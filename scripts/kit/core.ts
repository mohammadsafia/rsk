// The kit updater's core: which files the kit owns, how an app's copy compares with the kit's, and how to take the
// kit's changes without ever losing the app's own.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { writeIndex } from './blocks';

/**
 * Folders the kit owns. Everything else (pages, routes, layouts, api, config) belongs to the app; of src/locales/, only
 * the added blocks' own copy (block-<id>.json) is the kit's.
 */
export const KIT_PATHS = [
  'src/components/',
  'src/blocks/',
  'src/locales/',
  'src/lib/hooks/',
  'src/lib/utils/',
  'src/lib/contexts/',
  'src/lib/constants/',
  'src/styles/',
  'src/assets/icons/',
  'scripts/a11y/',
  'scripts/bundle/',
  'scripts/lib/',
  'scripts/kit/',
  'tests/design-system/',
  'tests/a11y/',
  'tests/bundle/',
  'tests/kit/',
] as const;

export const LOCK_FILE = 'kit.lock.json';

/**
 * Kit files an app is expected to change: barrels the kit ships empty or nearly so, where the app adds its own
 * exports. kit:status lists an app's changes to them as expected, not unexplained, and kit:update merges as usual.
 * The starter's README lists them for a project's rules to point at.
 */
export const EXTENSION_POINTS = [
  'src/lib/hooks/queries/index.ts',
  'src/lib/hooks/mutations/index.ts',
  'src/assets/icons/index.ts',
] as const;
const isExtensionPoint = (file: string) => (EXTENSION_POINTS as readonly string[]).includes(file);

export type KitTarget = 'vite' | 'next';
export type Lock = {
  kit: string;
  files: Record<string, string>;
  /** The blocks the app added with kit:add. */
  blocks?: string[];
  /** The starter repository the app came from (owner/repo); older locks have none: the Vite starter. */
  starter?: string;
  /** Which starter: a Vite or a Next app; older locks have none: vite. */
  target?: KitTarget;
  /** A Next app's generated App Router files (block pages, 404, error), by hash: kit:add replaces only unchanged ones. */
  generated?: Record<string, string>;
  /**
   * Kit files the app changed or deleted on purpose (`kit:accept`), each with the reason and the hash of the accepted
   * content (for a deletion, of the kit's version the app deleted). kit:status lists them apart from unexplained
   * changes; a further edit, a deleted file coming back, or the kit changing a deleted file makes it unexplained again.
   */
  accepted?: Record<string, Accepted>;
};
export type Accepted = { reason: string; hash: string; deleted?: true };
export type LockMeta = Pick<Lock, 'starter' | 'target' | 'generated' | 'accepted'>;
export type Status = 'same' | 'updated' | 'added' | 'removed' | 'modified' | 'conflict';
export type Row = { path: string; status: Status };

/** Repo-relative, posix separators. */
const posix = (file: string) => file.split(path.sep).join('/');

const BLOCK_LOCALE = /^src\/locales\/(en|ar)\/block-[\w-]+\.json$/;

export const inScope = (file: string) => {
  const rel = posix(file);
  // The block index is generated from the app's own blocks by kit:add/kit:remove.
  if (rel.endsWith('.upstream') || rel === 'src/blocks/index.ts') return false;
  // Locales are the app's own, except each block's own copy.
  if (rel.startsWith('src/locales/')) return BLOCK_LOCALE.test(rel);
  return KIT_PATHS.some((prefix) => rel.startsWith(prefix));
};

/** A file with a NUL byte is binary: it is hashed as is and never merged. */
const isBinary = (bytes: Buffer) => bytes.includes(0);

/** sha256 of a file; text is hashed with CRLF read as LF, so a Windows checkout isn't mistaken for a local edit. */
export function hashFile(file: string) {
  const bytes = readFileSync(file);
  const content = isBinary(bytes) ? bytes : Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'), 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

/** The kit to update from must say which kit files it has (its kit.lock.json); otherwise "removed" can't be told apart. */
export function checkUpstream(upstreamLock: Lock | null): asserts upstreamLock is Lock {
  if (!upstreamLock)
    throw new Error(`The starter to update from has no ${LOCK_FILE}: use the published starter or a folder built by starter:build.`);
}

export type Args = {
  command: 'status' | 'update' | 'accept';
  paths: string[];
  from?: string;
  base?: string;
  reason?: string;
  dryRun: boolean;
};

const USAGE = 'usage: kit.ts status|update [paths…] [--from dir] [--base dir] [--dry-run], or kit.ts accept <paths…> --reason "<why>"';

/**
 * kit.ts's arguments: `status|update [paths…] [--from dir] [--base dir] [--dry-run]` (also --from=dir), and
 * `accept <paths…> --reason <text>`.
 */
export function parseArgs(argv: string[]): Args {
  const [command = 'status', ...rest] = argv;
  if (command !== 'status' && command !== 'update' && command !== 'accept') throw new Error(USAGE);
  const args: Args = { command, paths: [], dryRun: false };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith('--')) {
      args.paths.push(value);
      continue;
    }
    const [flag, inline] = value.split(/=(.*)/s);
    if (flag === '--dry-run') args.dryRun = true;
    else if (flag === '--from' || flag === '--base' || (flag === '--reason' && command === 'accept')) {
      const given = inline ?? rest[index + 1];
      if (!given || given.startsWith('--')) throw new Error(`${flag} needs a value`);
      if (inline === undefined) index += 1;
      args[flag === '--from' ? 'from' : flag === '--base' ? 'base' : 'reason'] = given;
    } else throw new Error(`Unknown option ${flag}`);
  }
  if (command === 'accept' && (!args.paths.length || !args.reason)) throw new Error(USAGE.replace(/^usage: .*, or /, 'usage: '));
  return args;
}

/** Every in-scope file under `root`, as path → sha256. */
export function readTree(root: string): Map<string, string> {
  const tree = new Map<string, string>();
  const walk = (dir: string) => {
    if (!existsSync(path.join(root, dir))) return;
    for (const name of readdirSync(path.join(root, dir))) {
      const rel = dir ? `${dir}/${name}` : name;
      if (statSync(path.join(root, rel)).isDirectory()) walk(rel);
      else if (inScope(rel)) tree.set(rel, hashFile(path.join(root, rel)));
    }
  };
  for (const prefix of KIT_PATHS) walk(prefix.replace(/\/$/, ''));
  return tree;
}

/**
 * On disk a hash is written as `sha256:<hex>`. A bare 64-character hex string beside a path such as
 * `src/lib/utils/auth.ts` reads to a secret scanner as a credential ("auth": "<random>"), which fails the first
 * push of every new app whose pipeline scans for secrets. In memory hashes stay bare hex.
 */
const DIGEST_PREFIX = 'sha256:';
const withPrefix = (hashes: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(hashes).map(([file, hash]) => [file, hash.startsWith(DIGEST_PREFIX) ? hash : `${DIGEST_PREFIX}${hash}`]),
  );
const withoutPrefix = (hashes: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(hashes).map(([file, hash]) => [file, hash.startsWith(DIGEST_PREFIX) ? hash.slice(DIGEST_PREFIX.length) : hash]),
  );

const acceptedHashes = (accepted: Record<string, Accepted>, map: (hashes: Record<string, string>) => Record<string, string>) => {
  const hashes = map(Object.fromEntries(Object.entries(accepted).map(([file, entry]) => [file, entry.hash])));
  return Object.fromEntries(
    Object.entries(accepted).map(([file, entry]) => [
      file,
      { reason: entry.reason, ...(entry.deleted && { deleted: true as const }), hash: hashes[file] },
    ]),
  );
};

/** Reads kit.lock.json. Hashes come back as bare hex whether the lock was written with the prefix or before it. */
export function parseLock(text: string): Lock {
  const lock = JSON.parse(text) as Lock;
  return {
    ...lock,
    files: withoutPrefix(lock.files ?? {}),
    ...(lock.generated && { generated: withoutPrefix(lock.generated) }),
    ...(lock.accepted && { accepted: acceptedHashes(lock.accepted, withoutPrefix) }),
  };
}

export function readLock(appDir: string): Lock {
  const file = path.join(appDir, LOCK_FILE);
  if (!existsSync(file)) throw new Error(`No ${LOCK_FILE} here: run this in an app made from the RSK starter.`);
  return parseLock(readFileSync(file, 'utf8'));
}

/** Writes kit.lock.json. `meta` sets the starter, target or generated files; each one left out keeps the lock's own. */
export function writeLock(appDir: string, kit: string, files: Map<string, string>, blocks: string[] = [], meta: LockMeta = {}) {
  const file = path.join(appDir, LOCK_FILE);
  const current: LockMeta = existsSync(file) ? parseLock(readFileSync(file, 'utf8')) : {};
  const { starter, target, generated, accepted } = {
    starter: current.starter,
    target: current.target,
    generated: current.generated,
    accepted: current.accepted,
    ...meta,
  };
  const byPath = <T>(record: Record<string, T>) =>
    Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const sorted = Object.fromEntries([...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  // Keys left out when absent. Hashes are written with the digest prefix (see DIGEST_PREFIX), so the first write
  // after this change rewrites an older app's hashes in the new form; the hashes themselves do not change.
  const lock = {
    kit,
    ...(starter && { starter }),
    ...(target && { target }),
    blocks: [...blocks].sort((a, b) => a.localeCompare(b)),
    ...(generated &&
      Object.keys(generated).length && {
        generated: withPrefix(byPath(generated)),
      }),
    ...(accepted && Object.keys(accepted).length && { accepted: acceptedHashes(byPath(accepted), withPrefix) }),
    files: withPrefix(sorted),
  };
  writeFileSync(file, `${JSON.stringify(lock, null, 2)}\n`);
}

/**
 * The starter as an app sees it: the starter's own files plus, for each block the app added, the block's registry
 * files at their app paths. kit:status and kit:update compare against this, so an added block is updated from the
 * registry rather than read as "removed", and a block the app never added never appears.
 */
export function stageUpstream(starterDir: string, blocks: string[]): string {
  const view = mkdtempSync(path.join(tmpdir(), 'rsk-kit-view-'));
  // A local starter (--from) may have its dependencies and history beside it; the comparison needs neither.
  const skip = new Set(['node_modules', '.git'].map((name) => path.join(starterDir, name)));
  cpSync(starterDir, view, { recursive: true, filter: (source) => !skip.has(source) });
  for (const id of blocks) {
    const files = path.join(starterDir, 'registry/blocks', id, 'files');
    if (existsSync(files)) cpSync(files, view, { recursive: true });
  }
  return view;
}

/**
 * How each kit file in the app compares with the kit now. `lock` is what the app last took. A file in neither the lock
 * nor the kit is the app's own and isn't listed.
 */
export function classify(lock: Lock, local: Map<string, string>, upstream: Map<string, string>): Row[] {
  const paths = new Set([...Object.keys(lock.files), ...upstream.keys()]);
  const rows: Row[] = [];
  for (const file of [...paths].sort((a, b) => a.localeCompare(b))) {
    const taken = lock.files[file];
    const mine = local.get(file);
    const theirs = upstream.get(file);
    let status: Status;
    if (taken === undefined) status = mine === undefined ? 'added' : mine === theirs ? 'same' : 'conflict';
    else if (theirs === undefined) status = mine === taken ? 'removed' : mine === undefined ? 'same' : 'conflict';
    else if (theirs === taken) status = mine === taken ? 'same' : 'modified';
    else if (mine === taken) status = 'updated';
    else status = mine === theirs ? 'same' : 'conflict';
    rows.push({ path: file, status });
  }
  return rows;
}

/**
 * Files whose lock record changes although the app's file needs nothing: the app already has the kit's version (the
 * lock still names an older one), or a file the kit removed that the app removed too. kit:update rewrites their
 * hashes, so it lists them; otherwise kit.lock.json changes in a pull request with no line saying why.
 */
export function lockOnly(lock: Lock, local: Map<string, string>, upstream: Map<string, string>): string[] {
  return [...new Set([...Object.keys(lock.files), ...upstream.keys()])]
    .filter((file) => lock.files[file] !== upstream.get(file) && local.get(file) === upstream.get(file))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Whether an accepted deletion still stands: the file is still gone and the kit's version is still the one the app
 * deleted (in the lock and, when given, in the kit now). A changed kit file is a new decision to make.
 */
const deletionStands = (file: string, entry: Accepted, local: Map<string, string>, kitHash: string | undefined) =>
  !local.has(file) && kitHash === entry.hash;

/**
 * The app's accepted changes that still stand: a changed file is as it was when accepted; a deleted file is still gone
 * and the kit has not changed it since (`upstream`, when given, is the kit now).
 */
export function standingAcceptances(lock: Lock, local: Map<string, string>, upstream?: Map<string, string>): Record<string, Accepted> {
  return Object.fromEntries(
    Object.entries(lock.accepted ?? {}).filter(([file, entry]) =>
      entry.deleted
        ? deletionStands(file, entry, local, lock.files[file]) && (!upstream || upstream.get(file) === entry.hash)
        : local.get(file) === entry.hash,
    ),
  );
}

/**
 * Records kit files the app changed or deleted on purpose, with the reason, in kit.lock.json (`accepted`). kit:status
 * then lists them as accepted instead of unexplained, until the file changes again (or, deleted, comes back or is
 * changed by the kit). Only a kit file that differs from, or is missing against, the kit version the app last took can
 * be accepted.
 */
export function acceptChanges(appDir: string, files: string[], reason: string): { file: string; deleted: boolean }[] {
  if (!reason.trim()) throw new Error('kit:accept needs a reason: say why the app changes this kit file (an issue key helps).');
  const lock = readLock(appDir);
  const local = readTree(appDir);
  const accepted = { ...lock.accepted };
  const taken: { file: string; deleted: boolean }[] = [];
  for (const given of files) {
    const file = normalise(given);
    if (lock.files[file] === undefined) throw new Error(`${file} is not a kit file (kit.lock.json does not list it).`);
    const mine = local.get(file);
    if (mine === lock.files[file]) throw new Error(`${file} is the same as the kit: there is no change to accept.`);
    // Deleted: the hash is the kit's version the app deleted, so the acceptance lapses when the kit changes the file.
    accepted[file] =
      mine === undefined ? { reason: reason.trim(), deleted: true, hash: lock.files[file] } : { reason: reason.trim(), hash: mine };
    taken.push({ file, deleted: mine === undefined });
  }
  writeLock(appDir, lock.kit, new Map(Object.entries(lock.files)), lock.blocks ?? [], { accepted });
  return taken;
}

const LABELS: Record<Exclude<Status, 'same'>, string> = {
  updated: 'updated in the kit',
  added: 'new in the kit',
  removed: 'removed from the kit',
  modified: 'changed by you (kept)',
  conflict: 'changed on both sides',
};

/**
 * kit:status's lines: each kit file that differs from the kit, by status; the app's accepted changes with their
 * reasons; the files where only the lock changes; and a last line counting the unexplained changes (changed by the app
 * and not accepted). `rows` defaults to every file classify() finds.
 */
export function statusReport(
  lock: Lock,
  local: Map<string, string>,
  upstream: Map<string, string>,
  rows: Row[] = classify(lock, local, upstream),
): string[] {
  const changed = rows.filter((row) => row.status !== 'same');
  const standing = standingAcceptances(lock, local, upstream);
  const lines: string[] = [];
  if (!changed.length) lines.push('Every kit file is up to date.');
  const block = (label: string, files: string[]) => {
    if (files.length) lines.push('', `${label} (${files.length}):`, ...files.map((file) => `  ${file}`));
  };
  for (const status of Object.keys(LABELS) as (keyof typeof LABELS)[]) {
    const files = changed.filter((row) => row.status === status).map((row) => row.path);
    if (status !== 'modified') block(LABELS[status], files);
    else {
      const unexplained = files.filter((file) => !standing[file] && !isExtensionPoint(file));
      block(
        LABELS.modified,
        unexplained.map((file) => (lock.accepted?.[file] ? `${file} (changed since it was accepted)` : file)),
      );
      block(
        'changed by you, expected (the app adds its own exports there)',
        files.filter((file) => !standing[file] && isExtensionPoint(file)),
      );
      block(
        'changed by you, accepted',
        files
          .filter((file) => standing[file])
          .map((file) => `${file}${standing[file].deleted ? ' (deleted)' : ''}: ${standing[file].reason}`),
      );
    }
  }
  const paths = new Set(rows.map((row) => row.path));
  block(
    'already the kit’s version, only the lock changes',
    lockOnly(lock, local, upstream).filter((file) => paths.has(file)),
  );
  const unexplained = changed.filter((row) => row.status === 'modified' && !standing[row.path] && !isExtensionPoint(row.path)).length;
  lines.push(
    '',
    unexplained
      ? `Unexplained changes to kit files: ${unexplained}. Take the kit's version, or record why with pnpm kit:accept <file> --reason "<why>".`
      : 'Unexplained changes to kit files: none.',
  );
  return lines;
}

export type UpdateResult = {
  updated: string[];
  added: string[];
  removed: string[];
  merged: string[];
  conflicts: string[];
  kept: string[];
  /** Blocks the kit no longer offers: they stay in the app as its own, out of the lock. */
  released: string[];
  /** A Next app's generated pages the app changed: the update left them as they are. */
  keptPages: string[];
  /** Files whose lock record changed although the file did not (see lockOnly). */
  relocked: string[];
  /** Kit files the app deleted on purpose (an accepted deletion): the update leaves them deleted. */
  skipped: string[];
};

/** A block's files in the lock: its folder and its locale files. */
const isBlockFile = (id: string) => (file: string) =>
  file.startsWith(`src/blocks/${id}/`) || file === `src/locales/en/block-${id}.json` || file === `src/locales/ar/block-${id}.json`;

/**
 * The lock as kit:update and kit:status should read it: a block the kit no longer offers (absent from the upstream
 * registry) stays in the app as its own, so it leaves the lock instead of being deleted as "removed from the kit".
 */
export function releaseDroppedBlocks(lock: Lock, upstreamDir: string): { lock: Lock; released: string[] } {
  const released = (lock.blocks ?? []).filter((id) => !existsSync(path.join(upstreamDir, 'registry/blocks', id)));
  return {
    released,
    lock: {
      ...lock,
      blocks: (lock.blocks ?? []).filter((id) => !released.includes(id)),
      files: Object.fromEntries(Object.entries(lock.files).filter(([file]) => !released.some((id) => isBlockFile(id)(file)))),
    },
  };
}

/**
 * Three-way merge of one file into the app's copy. 'cannot' (binary, or git refused) leaves the app's file untouched.
 */
function mergeFile(appFile: string, baseFile: string, upstreamFile: string, dryRun: boolean): 'clean' | 'conflict' | 'cannot' {
  if ([appFile, baseFile, upstreamFile].some((file) => isBinary(readFileSync(file)))) return 'cannot';
  const merge = spawnSync('git', ['merge-file', '-p', '-L', 'yours', '-L', 'original', '-L', 'kit', appFile, baseFile, upstreamFile]);
  // 0 = clean, 1–127 = that many conflicts, above (or no status) = git couldn't merge.
  if (merge.status === null || merge.status > 127 || merge.status < 0) return 'cannot';
  if (!dryRun) writeFileSync(appFile, merge.stdout);
  return merge.status === 0 ? 'clean' : 'conflict';
}

const gitAvailable = () => spawnSync('git', ['--version']).status === 0;

/** "./src\\components" → "src/components/": paths as the lock writes them. */
const normalise = (prefix: string) => {
  const clean = prefix.replaceAll('\\', '/').replace(/^\.\//, '');
  return clean;
};

/**
 * Takes the kit's changes into the app: updated and added files are copied, files the kit removed are deleted (only if
 * the app never changed them), files changed on both sides are merged three ways against `baseDir` (the version the
 * app last took). Without a base, the app's file is kept and the kit's version is written beside it as `.upstream`.
 * `only` limits the update to paths starting with one of its entries.
 */
export function applyUpdate(options: {
  appDir: string;
  upstreamDir: string;
  baseDir?: string;
  kit: string;
  dryRun?: boolean;
  only?: string[];
}): UpdateResult {
  const { appDir, upstreamDir, baseDir, kit, dryRun = false, only } = options;
  const appLock = readLock(appDir);
  const { lock, released } = releaseDroppedBlocks(appLock, upstreamDir);
  const upstream = readTree(upstreamDir);
  const local = readTree(appDir);
  const rows = classify(lock, local, upstream);
  const prefixes = (only ?? []).map(normalise);
  for (const prefix of prefixes) if (!rows.some((row) => row.path.startsWith(prefix))) throw new Error(`"${prefix}" matches no kit file.`);
  const wanted = (file: string) => !prefixes.length || prefixes.some((prefix) => file.startsWith(prefix));
  // Check before touching anything: a missing git must not stop an update halfway.
  if (rows.some((row) => row.status === 'conflict' && wanted(row.path)) && baseDir && !gitAvailable())
    throw new Error('kit:update needs git to merge files changed on both sides; install git and run it again.');
  const result: UpdateResult = {
    updated: [],
    added: [],
    removed: [],
    merged: [],
    conflicts: [],
    kept: [],
    released,
    keptPages: [],
    relocked: lockOnly(lock, local, upstream).filter(wanted),
    skipped: [],
  };
  const standing = standingAcceptances(lock, local, upstream);
  const nextLock = new Map(Object.entries(lock.files));

  const copy = (file: string) => {
    if (dryRun) return;
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    cpSync(path.join(upstreamDir, file), path.join(appDir, file));
  };

  for (const { path: file, status } of rows) {
    if (!wanted(file)) continue;
    const theirs = upstream.get(file);
    if (status === 'updated' || status === 'added') {
      copy(file);
      result[status].push(file);
    } else if (status === 'removed') {
      if (!dryRun) rmSync(path.join(appDir, file));
      result.removed.push(file);
    } else if (status === 'modified') {
      result[standing[file]?.deleted ? 'skipped' : 'kept'].push(file);
    } else if (status === 'conflict') {
      const appFile = path.join(appDir, file);
      const baseFile = baseDir ? path.join(baseDir, file) : '';
      const canMerge = theirs !== undefined && existsSync(appFile) && baseFile && existsSync(baseFile);
      const outcome = canMerge ? mergeFile(appFile, baseFile, path.join(upstreamDir, file), dryRun) : 'cannot';
      if (outcome === 'clean') result.merged.push(file);
      else {
        // Without a merge, the app's file stays as it is and the kit's version goes beside it.
        if (outcome === 'cannot' && theirs !== undefined && !dryRun) {
          mkdirSync(path.dirname(appFile), { recursive: true });
          cpSync(path.join(upstreamDir, file), `${appFile}.upstream`);
        }
        result.conflicts.push(file);
      }
    }
    // The lock records the kit's version of every file it has; the app's own edits then read as "changed locally".
    if (theirs === undefined) nextLock.delete(file);
    else nextLock.set(file, theirs);
  }

  // A partial update keeps the kit version the lock had: the files it didn't take still came from that version, and
  // their three-way merges need it as their base.
  // An accepted change stays accepted while the app's file still differs from the kit's version the lock now records;
  // an accepted deletion while the file is still gone and the kit's version is still the one the app deleted.
  const after = readTree(appDir);
  const accepted = Object.fromEntries(
    Object.entries(lock.accepted ?? {}).filter(([file, entry]) =>
      entry.deleted ? deletionStands(file, entry, after, nextLock.get(file)) : nextLock.has(file) && after.get(file) !== nextLock.get(file),
    ),
  );
  if (!dryRun) writeLock(appDir, prefixes.length ? lock.kit : kit, nextLock, lock.blocks ?? [], { accepted });
  // The blocks' routes, menu entries and error page follow their (maybe updated) block.json.
  if (!dryRun && (appLock.blocks?.length || existsSync(path.join(appDir, 'src/blocks/index.ts')))) result.keptPages = writeIndex(appDir);
  return result;
}

type Manifest = { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

/** The kit's added or changed dependencies, as one install line; null when the app already matches. */
export function dependencyChanges(local: Manifest, upstream: Manifest): string | null {
  const changed = (mine: Record<string, string> = {}, theirs: Record<string, string> = {}) =>
    Object.entries(theirs)
      .filter(([name, version]) => mine[name] !== version)
      .map(([name, version]) => `${name}@${version}`)
      .sort((a, b) => a.localeCompare(b));
  const runtime = changed(local.dependencies, upstream.dependencies);
  const dev = changed(local.devDependencies, upstream.devDependencies);
  const lines = [runtime.length ? `pnpm add ${runtime.join(' ')}` : '', dev.length ? `pnpm add -D ${dev.join(' ')}` : ''].filter(Boolean);
  return lines.length ? lines.join(' && ') : null;
}
