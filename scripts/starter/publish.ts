/**
 * Publishes a built starter into a clone of the starter repository: the clone's tree becomes the starter's (files the
 * kit removed are removed there too), then one commit records the kit commit it came from. Pushing is left to the
 * caller (the starter-sync workflow).
 *
 *   pnpm starter:publish <starterDir> <cloneDir>
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

export type SyncSource = { sha: string; subject: string; repoUrl: string };

const ROOT = path.resolve(import.meta.dirname, '../..');

/** Empties `into` except its `.git`, then copies everything from `from` (dotfiles included) into it. */
export function replaceTree(from: string, into: string) {
  for (const name of readdirSync(into)) {
    if (name !== '.git') rmSync(path.join(into, name), { recursive: true, force: true });
  }
  for (const name of readdirSync(from)) {
    if (name !== '.git') cpSync(path.join(from, name), path.join(into, name), { recursive: true });
  }
}

export function commitMessage({ sha, subject, repoUrl }: SyncSource) {
  return `sync: rsk@${sha.slice(0, 7)} — ${subject}\n\nGenerated from ${repoUrl}/commit/${sha}\n`;
}

export function publish(from: string, into: string, source: SyncSource): 'unchanged' | 'committed' {
  replaceTree(from, into);
  // execFileSync passes arguments without a shell, so the subject reaches git verbatim.
  const git = (...args: string[]) => execFileSync('git', args, { cwd: into, encoding: 'utf8' });
  git('add', '--all');
  const changes = git('status', '--porcelain').trim().split('\n').filter(Boolean);
  // kit.lock.json names the kit commit; when nothing else changed, the starter didn't either: keep the lock that
  // matches the existing kit/ tag rather than commit a new version of the same files.
  const hasHead = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: into }).status === 0;
  if (hasHead && changes.length === 1 && changes[0].endsWith(' kit.lock.json')) {
    git('checkout', 'HEAD', '--', 'kit.lock.json');
    return 'unchanged';
  }
  if (!changes.length) return 'unchanged';
  git(
    '-c',
    'user.name=rsk-starter-bot',
    '-c',
    'user.email=noreply@github.com',
    // A global commit.gpgsign would otherwise make the bot commit (and the tests) wait for a signing key.
    '-c',
    'commit.gpgsign=false',
    'commit',
    '--quiet',
    '--no-verify',
    '--message',
    commitMessage(source),
  );
  // Annotated, so `git push --follow-tags` sends it: an app's kit:update fetches this as the version it took.
  git(
    '-c',
    'user.name=rsk-starter-bot',
    '-c',
    'user.email=noreply@github.com',
    '-c',
    'tag.gpgsign=false',
    'tag',
    '-a',
    '-f',
    `kit/${source.sha.slice(0, 7)}`,
    '-m',
    `rsk@${source.sha}`,
  );
  return 'committed';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [from, into] = process.argv.slice(2);
  if (!from || !into) throw new Error('usage: pnpm starter:publish <starterDir> <cloneDir>');
  const head = (format: string) => execFileSync('git', ['log', '-1', `--format=${format}`], { cwd: ROOT, encoding: 'utf8' }).trim();
  const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
  const repository = process.env.GITHUB_REPOSITORY ?? 'mohammadsafia/rsk';
  const source: SyncSource = { sha: head('%H'), subject: head('%s'), repoUrl: `${server}/${repository}` };
  const result = publish(path.resolve(from), path.resolve(into), source);
  console.log(result === 'unchanged' ? 'starter unchanged' : `starter committed: ${commitMessage(source).split('\n')[0]}`);
}
