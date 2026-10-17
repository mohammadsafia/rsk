/**
 * Publishes a built starter into a clone of the starter repository: the clone's tree becomes the starter's (files the
 * kit removed are removed there too), then one commit records the kit commit it came from. Pushing is left to the
 * caller (the starter-sync workflow).
 *
 *   pnpm starter:publish <starterDir> <cloneDir>
 */
import { execFileSync } from 'node:child_process';
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
  if (!git('status', '--porcelain').trim()) return 'unchanged';
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
