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
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import {
  applyUpdate,
  checkUpstream,
  classify,
  dependencyChanges,
  LOCK_FILE,
  parseArgs,
  readLock,
  readTree,
  releaseDroppedBlocks,
  stageUpstream,
  type Status,
} from './core';
import { download, REPO } from './download';

const LABELS: Record<Exclude<Status, 'same'>, string> = {
  updated: 'updated in the kit',
  added: 'new in the kit',
  removed: 'removed from the kit',
  modified: 'changed by you (kept)',
  conflict: 'changed on both sides',
};

async function main() {
  const { command, paths, from: fromArg, base: baseArg, dryRun } = parseArgs(process.argv.slice(2));
  const appDir = process.cwd();
  const lock = readLock(appDir);
  const temporary: string[] = [];

  try {
    const starterDir = fromArg ? path.resolve(fromArg) : await download('refs/heads/main');
    if (!starterDir) throw new Error(`${REPO} has no main branch.`);
    if (!fromArg) temporary.push(starterDir);
    // The starter plus the registry files of the blocks this app added, at their app paths.
    const blocks = lock.blocks ?? [];
    const upstreamDir = stageUpstream(starterDir, blocks);
    temporary.push(upstreamDir);
    const upstreamLock = existsSync(path.join(upstreamDir, LOCK_FILE)) ? readLock(upstreamDir) : null;
    checkUpstream(upstreamLock);
    const { kit } = upstreamLock;

    const listed = (file: string) =>
      !paths.length || paths.some((prefix) => file.startsWith(prefix.replace(/\\/g, '/').replace(/^\.\//, '')));
    const { lock: kept, released } = releaseDroppedBlocks(lock, upstreamDir);
    const rows = classify(kept, readTree(appDir), readTree(upstreamDir)).filter((row) => row.status !== 'same' && listed(row.path));
    console.log(`Kit: you have rsk@${lock.kit.slice(0, 7)}, the starter has rsk@${kit.slice(0, 7)}.`);
    if (released.length)
      console.log(`\nNo longer in the kit, so ${command === 'status' ? 'kit:update keeps' : 'kept'} as your own: ${released.join(', ')}.`);
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

    const needsBase = rows.some((row) => row.status === 'conflict');
    const baseStarter = baseArg ? path.resolve(baseArg) : needsBase ? await download(`refs/tags/kit/${lock.kit.slice(0, 7)}`) : null;
    if (baseStarter && !baseArg) temporary.push(baseStarter);
    const baseDir = baseStarter ? stageUpstream(baseStarter, blocks) : null;
    if (baseDir) temporary.push(baseDir);
    if (needsBase && !baseDir)
      console.log(`\nNo kit/${lock.kit.slice(0, 7)} tag to merge against: files changed on both sides get a .upstream copy beside them.`);

    const result = applyUpdate({ appDir, upstreamDir, baseDir: baseDir ?? undefined, kit, dryRun, only: paths });
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
