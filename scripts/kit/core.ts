// The kit updater's core: which files the kit owns, how an app's copy compares with the kit's, and how to take the
// kit's changes without ever losing the app's own.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** Folders the kit owns. Everything else (pages, routes, layouts, api, locales, config) belongs to the app. */
export const KIT_PATHS = [
  'src/components/',
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

export type Lock = { kit: string; files: Record<string, string> };
export type Status = 'same' | 'updated' | 'added' | 'removed' | 'modified' | 'conflict';
export type Row = { path: string; status: Status };

/** Repo-relative, posix separators. */
const posix = (file: string) => file.split(path.sep).join('/');

export const inScope = (file: string) => KIT_PATHS.some((prefix) => posix(file).startsWith(prefix)) && !file.endsWith('.upstream');

export const hashFile = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');

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

export function writeLock(appDir: string, kit: string, files: Map<string, string>) {
  const sorted = Object.fromEntries([...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  writeFileSync(path.join(appDir, LOCK_FILE), `${JSON.stringify({ kit, files: sorted }, null, 2)}\n`);
}

/**
 * How each kit file in the app compares with the kit now. `lock` is what the app last took. A file in neither the lock
 * nor the kit is the app's own and isn't listed.
 */
export function classify(lock: Lock, local: Map<string, string>, upstream: Map<string, string>): Row[] {
  const paths = new Set([...Object.keys(lock.files), ...upstream.keys()]);
  const rows: Row[] = [];
  for (const file of [...paths].sort()) {
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

export type UpdateResult = { updated: string[]; added: string[]; removed: string[]; merged: string[]; conflicts: string[]; kept: string[] };

/** Three-way merge of one file into the app's copy. Returns whether it merged cleanly. */
function mergeFile(appFile: string, baseFile: string, upstreamFile: string, dryRun: boolean): boolean {
  const merge = spawnSync('git', ['merge-file', '-p', '-L', 'yours', '-L', 'original', '-L', 'kit', appFile, baseFile, upstreamFile], {
    encoding: 'utf8',
  });
  if (merge.status === null || merge.status < 0) throw new Error(`git merge-file failed: ${merge.stderr}`);
  if (!dryRun) writeFileSync(appFile, merge.stdout);
  return merge.status === 0;
}

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
  const lock = readLock(appDir);
  const upstream = readTree(upstreamDir);
  const rows = classify(lock, readTree(appDir), upstream);
  const wanted = (file: string) => !only?.length || only.some((prefix) => file.startsWith(prefix));
  const result: UpdateResult = { updated: [], added: [], removed: [], merged: [], conflicts: [], kept: [] };
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
      if (canMerge && mergeFile(appFile, baseFile, path.join(upstreamDir, file), dryRun)) result.merged.push(file);
      else {
        if (!canMerge && theirs !== undefined && !dryRun) cpSync(path.join(upstreamDir, file), `${appFile}.upstream`);
        result.conflicts.push(file);
      }
    }
    // The lock records the kit's version of every file it has; the app's own edits then read as "changed locally".
    if (theirs === undefined) nextLock.delete(file);
    else nextLock.set(file, theirs);
  }

  if (!dryRun) writeLock(appDir, kit, nextLock);
  return result;
}

type Manifest = { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

/** The kit's added or changed dependencies, as one install line; null when the app already matches. */
export function dependencyChanges(local: Manifest, upstream: Manifest): string | null {
  const changed = (mine: Record<string, string> = {}, theirs: Record<string, string> = {}) =>
    Object.entries(theirs)
      .filter(([name, version]) => mine[name] !== version)
      .map(([name, version]) => `${name}@${version}`)
      .sort();
  const runtime = changed(local.dependencies, upstream.dependencies);
  const dev = changed(local.devDependencies, upstream.devDependencies);
  const lines = [runtime.length ? `pnpm add ${runtime.join(' ')}` : '', dev.length ? `pnpm add -D ${dev.join(' ')}` : ''].filter(Boolean);
  return lines.length ? lines.join(' && ') : null;
}
