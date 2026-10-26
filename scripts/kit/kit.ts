/**
 * Keeps an app made from the RSK starter in step with the kit.
 *
 *   pnpm kit:status                     # how each kit file compares with the latest starter
 *   pnpm kit:update                     # take the kit's changes (never overwrites your own edits)
 *   pnpm kit:update src/components/ui/button/ --dry-run
 *
 * Options: --from <dir> (a local starter instead of GitHub), --base <dir> (the version you took, for three-way merges),
 * --dry-run. The GitHub repository is the one kit.lock.json names (`starter`); for an older lock without one,
 * RSK_STARTER_REPO picks it (default mohammadsafia/rsk-starter).
 */
import { spawnSync } from 'node:child_process';
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
import { download, starterRepo } from './download';
import { needsSelfUpdate, updateGaps } from './gaps';

/** Set on the run a self-updated kit:update hands over to, so it never hands over again. */
const SELF_UPDATED = 'RSK_KIT_SELF_UPDATED';

/** The same command for the new updater: the starter (and base) already downloaded, instead of fetching them again. */
const handOverArgs = (argv: string[], starterDir: string, baseStarter: string | null): string[] => {
  const kept: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const [flag, inline] = argv[index].split(/=(.*)/s);
    if (flag === '--from' || flag === '--base') {
      if (inline === undefined) index += 1;
      continue;
    }
    kept.push(argv[index]);
  }
  return [...kept, '--from', starterDir, ...(baseStarter ? ['--base', baseStarter] : [])];
};

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
    if (!starterDir) throw new Error(`${starterRepo()} has no main branch.`);
    if (!fromArg) temporary.push(starterDir);
    // The starter plus the registry files of the blocks this app added, at their app paths.
    const blocks = lock.blocks ?? [];
    const upstreamDir = stageUpstream(starterDir, blocks);
    temporary.push(upstreamDir);
    const upstreamLock = existsSync(path.join(upstreamDir, LOCK_FILE)) ? readLock(upstreamDir) : null;
    checkUpstream(upstreamLock);
    const { kit } = upstreamLock;

    const listed = (file: string) =>
      !paths.length || paths.some((prefix) => file.startsWith(prefix.replaceAll('\\', '/').replace(/^\.\//, '')));
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

    // A newer updater (scripts/kit/) takes the update first, then runs the rest: its own code, not this one's.
    if (!dryRun && !paths.length && process.env[SELF_UPDATED] !== '1' && needsSelfUpdate(rows)) {
      // The updater and what it imports (scripts/lib/), so the new version starts with the modules it expects.
      const own = applyUpdate({ appDir, upstreamDir, baseDir: baseDir ?? undefined, kit, only: ['scripts/kit/', 'scripts/lib/'] });
      if (own.conflicts.length) {
        console.log(
          `\nResolve these in the kit updater first, then run kit:update again:\n${own.conflicts.map((file) => `  ${file}`).join('\n')}`,
        );
        process.exitCode = 1;
        return;
      }
      console.log('\nkit:update updated itself; the new version takes the rest of the update.');
      const child = spawnSync(
        process.execPath,
        [...process.execArgv, path.join(appDir, 'scripts/kit/kit.ts'), ...handOverArgs(process.argv.slice(2), starterDir, baseStarter)],
        { cwd: appDir, stdio: 'inherit', env: { ...process.env, [SELF_UPDATED]: '1' } },
      );
      process.exitCode = child.status ?? 1;
      return;
    }

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
    if (result.keptPages.length)
      console.log(
        `You changed these generated pages, so the update left them as they are:\n${result.keptPages.map((file) => `  ${file}`).join('\n')}`,
      );
    if (result.conflicts.length) process.exitCode = 1;
    const gaps = dryRun ? [] : updateGaps(appDir, upstreamDir);
    if (gaps.length) console.log(`\nTo finish this update:\n${gaps.map((gap) => `  - ${gap}`).join('\n')}`);
  } finally {
    for (const dir of temporary) rmSync(dir, { recursive: true, force: true });
  }
}

await main();
