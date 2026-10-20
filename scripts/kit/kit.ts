/**
 * Keeps an app made from the RSK starter in step with the kit.
 *
 *   pnpm kit:status                     # how each kit file compares with the latest starter
 *   pnpm kit:update                     # take the kit's changes (never overwrites your own edits)
 *   pnpm kit:update src/components/ui/button/ --dry-run
 *
 * Options: --from <dir> (a local starter instead of GitHub), --base <dir> (the version you took, for three-way merges),
 * --dry-run. RSK_STARTER_REPO picks another GitHub repository (default mohammadsafia/rsk-starter).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { applyUpdate, classify, dependencyChanges, LOCK_FILE, readLock, readTree, type Status } from './core';

const REPO = process.env.RSK_STARTER_REPO ?? 'mohammadsafia/rsk-starter';

const LABELS: Record<Exclude<Status, 'same'>, string> = {
  updated: 'updated in the kit',
  added: 'new in the kit',
  removed: 'removed from the kit',
  modified: 'changed by you (kept)',
  conflict: 'changed on both sides',
};

/** Downloads a ref of the starter repository and unpacks it; null when the ref doesn't exist. */
async function download(ref: string): Promise<string | null> {
  const response = await fetch(`https://codeload.github.com/${REPO}/tar.gz/${ref}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Downloading ${REPO}@${ref} failed: HTTP ${response.status}`);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'rsk-kit-'));
  const archive = path.join(dir, 'starter.tar.gz');
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  const unpack = spawnSync('tar', ['-xzf', archive, '-C', dir, '--strip-components=1'], { encoding: 'utf8' });
  if (unpack.status !== 0) throw new Error(`Unpacking ${REPO}@${ref} failed: ${unpack.stderr}`);
  rmSync(archive);
  return dir;
}

const arg = (name: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
};

async function main() {
  const [command = 'status', ...rest] = process.argv.slice(2);
  if (command !== 'status' && command !== 'update')
    throw new Error('usage: kit.ts status|update [paths…] [--from dir] [--base dir] [--dry-run]');
  const appDir = process.cwd();
  const lock = readLock(appDir);
  const temporary: string[] = [];

  try {
    const fromArg = arg('from');
    const upstreamDir = fromArg ? path.resolve(fromArg) : await download('refs/heads/main');
    if (!upstreamDir) throw new Error(`${REPO} has no main branch.`);
    if (!fromArg) temporary.push(upstreamDir);
    const upstreamLock = existsSync(path.join(upstreamDir, LOCK_FILE)) ? readLock(upstreamDir) : null;
    const kit = upstreamLock?.kit ?? 'unknown';

    const rows = classify(lock, readTree(appDir), readTree(upstreamDir)).filter((row) => row.status !== 'same');
    console.log(`Kit: you have rsk@${lock.kit.slice(0, 7)}, the starter has rsk@${kit.slice(0, 7)}.`);
    if (!rows.length) console.log('Every kit file is up to date.');
    for (const status of Object.keys(LABELS) as (keyof typeof LABELS)[]) {
      const files = rows.filter((row) => row.status === status).map((row) => row.path);
      if (files.length) console.log(`\n${LABELS[status]} (${files.length}):\n${files.map((file) => `  ${file}`).join('\n')}`);
    }

    const install = dependencyChanges(
      JSON.parse(readFileSync(path.join(appDir, 'package.json'), 'utf8')),
      JSON.parse(readFileSync(path.join(upstreamDir, 'package.json'), 'utf8')),
    );
    if (install) console.log(`\nThe kit's dependencies changed. To match them:\n  ${install}`);
    if (command === 'status') return;

    const baseArg = arg('base');
    const needsBase = rows.some((row) => row.status === 'conflict');
    const baseDir = baseArg ? path.resolve(baseArg) : needsBase ? await download(`refs/tags/kit/${lock.kit.slice(0, 7)}`) : null;
    if (baseDir && !baseArg) temporary.push(baseDir);
    if (needsBase && !baseDir)
      console.log(`\nNo kit/${lock.kit.slice(0, 7)} tag to merge against: files changed on both sides get a .upstream copy beside them.`);

    const options = new Set(['--from', '--base']);
    const only = rest.filter((value, index) => !value.startsWith('--') && !options.has(rest[index - 1] ?? ''));
    const dryRun = process.argv.includes('--dry-run');
    const result = applyUpdate({ appDir, upstreamDir, baseDir: baseDir ?? undefined, kit, dryRun, only });
    const summary = [
      [result.updated.length, 'updated'],
      [result.added.length, 'added'],
      [result.removed.length, 'removed'],
      [result.merged.length, 'merged'],
      [result.conflicts.length, 'need your attention'],
    ]
      .filter(([count]) => count)
      .map(([count, label]) => `${count} ${label}`)
      .join(', ');
    console.log(`\n${dryRun ? 'Would update' : 'Updated'}: ${summary || 'nothing'}.`);
    if (result.conflicts.length)
      console.log(
        `Resolve these (look for <<<<<<< or a .upstream file beside them):\n${result.conflicts.map((file) => `  ${file}`).join('\n')}`,
      );
    if (result.conflicts.length) process.exitCode = 1;
  } finally {
    for (const dir of temporary) rmSync(dir, { recursive: true, force: true });
  }
}

await main();
