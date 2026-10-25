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
};
export type LockMeta = Pick<Lock, 'starter' | 'target' | 'generated'>;
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

export type Args = { command: 'status' | 'update'; paths: string[]; from?: string; base?: string; dryRun: boolean };

/** kit.ts's arguments: `status|update [paths…] [--from dir] [--base dir] [--dry-run]` (also --from=dir). */
export function parseArgs(argv: string[]): Args {
  const [command = 'status', ...rest] = argv;
  if (command !== 'status' && command !== 'update')
    throw new Error('usage: kit.ts status|update [paths…] [--from dir] [--base dir] [--dry-run]');
  const args: Args = { command, paths: [], dryRun: false };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith('--')) {
      args.paths.push(value);
      continue;
    }
    const [flag, inline] = value.split(/=(.*)/s);
    if (flag === '--dry-run') args.dryRun = true;
    else if (flag === '--from' || flag === '--base') {
      const given = inline ?? rest[index + 1];
      if (!given || given.startsWith('--')) throw new Error(`${flag} needs a value`);
      if (inline === undefined) index += 1;
      args[flag === '--from' ? 'from' : 'base'] = given;
    } else throw new Error(`Unknown option ${flag}`);
  }
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

export function readLock(appDir: string): Lock {
  const file = path.join(appDir, LOCK_FILE);
  if (!existsSync(file)) throw new Error(`No ${LOCK_FILE} here: run this in an app made from the RSK starter.`);
  return JSON.parse(readFileSync(file, 'utf8')) as Lock;
}

/** Writes kit.lock.json. `meta` sets the starter, target or generated files; each one left out keeps the lock's own. */
export function writeLock(appDir: string, kit: string, files: Map<string, string>, blocks: string[] = [], meta: LockMeta = {}) {
  const file = path.join(appDir, LOCK_FILE);
  const current: LockMeta = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Lock) : {};
  const { starter, target, generated } = { starter: current.starter, target: current.target, generated: current.generated, ...meta };
  const sorted = Object.fromEntries([...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  // Keys left out when absent, so an older app's lock stays byte for byte what it was.
  const lock = {
    kit,
    ...(starter && { starter }),
    ...(target && { target }),
    blocks: [...blocks].sort((a, b) => a.localeCompare(b)),
    ...(generated &&
      Object.keys(generated).length && {
        generated: Object.fromEntries(Object.entries(generated).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
      }),
    files: sorted,
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
  const rows = classify(lock, readTree(appDir), upstream);
  const prefixes = (only ?? []).map(normalise);
  for (const prefix of prefixes) if (!rows.some((row) => row.path.startsWith(prefix))) throw new Error(`"${prefix}" matches no kit file.`);
  const wanted = (file: string) => !prefixes.length || prefixes.some((prefix) => file.startsWith(prefix));
  // Check before touching anything: a missing git must not stop an update halfway.
  if (rows.some((row) => row.status === 'conflict' && wanted(row.path)) && baseDir && !gitAvailable())
    throw new Error('kit:update needs git to merge files changed on both sides; install git and run it again.');
  const result: UpdateResult = { updated: [], added: [], removed: [], merged: [], conflicts: [], kept: [], released, keptPages: [] };
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
      result.kept.push(file);
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
  if (!dryRun) writeLock(appDir, prefixes.length ? lock.kit : kit, nextLock, lock.blocks ?? []);
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
