import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { commitMessage, publish, type SyncSource } from '../../scripts/starter/publish';

const SOURCE: SyncSource = {
  sha: '0d74983a1b2c3d4e5f60718293a4b5c6d7e8f901',
  subject: 'feat(starter): generate a clean vp create starter from the kit',
  repoUrl: 'https://github.com/mohammadsafia/rsk',
};

const dirs: string[] = [];
const tmp = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'rsk-publish-'));
  dirs.push(dir);
  return dir;
};
const write = (root: string, file: string, text: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
};
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' });
/** An empty repository standing in for a fresh clone of rsk-starter. */
const emptyClone = () => {
  const dir = tmp();
  git(dir, 'init', '-q', '-b', 'main');
  return dir;
};
const commitCount = (dir: string) => Number(git(dir, 'rev-list', '--count', 'HEAD').trim());

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('commitMessage', () => {
  it('names the short sha and subject, and links the full commit', () => {
    expect(commitMessage(SOURCE)).toBe(
      'sync: rsk@0d74983 — feat(starter): generate a clean vp create starter from the kit\n\n' +
        'Generated from https://github.com/mohammadsafia/rsk/commit/0d74983a1b2c3d4e5f60718293a4b5c6d7e8f901\n',
    );
  });
});

describe('publish', () => {
  it('commits into a clone with no commits yet', () => {
    const starter = tmp();
    write(starter, 'package.json', '{ "name": "rsk-app" }\n');
    write(starter, 'src/main.tsx', 'export {};\n');
    const clone = emptyClone();

    expect(publish(starter, clone, SOURCE)).toBe('committed');
    expect(commitCount(clone)).toBe(1);
    expect(git(clone, 'log', '-1', '--format=%an <%ae>').trim()).toBe('rsk-starter-bot <noreply@github.com>');
    expect(git(clone, 'ls-files').trim().split('\n').sort()).toEqual(['package.json', 'src/main.tsx']);
  });

  it('removes files the starter no longer has', () => {
    const clone = emptyClone();
    const first = tmp();
    write(first, 'README.md', 'v1\n');
    write(first, 'src/pages/old/OldPage.tsx', 'export {};\n');
    publish(first, clone, SOURCE);

    const second = tmp();
    write(second, 'README.md', 'v2\n');
    expect(publish(second, clone, { ...SOURCE, sha: 'f'.repeat(40) })).toBe('committed');
    expect(existsSync(path.join(clone, 'src'))).toBe(false);
    expect(git(clone, 'ls-files').trim()).toBe('README.md');
    expect(readFileSync(path.join(clone, 'README.md'), 'utf8')).toBe('v2\n');
  });

  it('reports unchanged on a second identical publish', () => {
    const starter = tmp();
    write(starter, 'README.md', 'same\n');
    const clone = emptyClone();
    publish(starter, clone, SOURCE);

    expect(publish(starter, clone, { ...SOURCE, sha: 'e'.repeat(40) })).toBe('unchanged');
    expect(commitCount(clone)).toBe(1);
  });

  it("keeps the clone's .git and copies dotfiles", () => {
    const starter = tmp();
    write(starter, '.gitignore', 'node_modules\n');
    write(starter, '.env.example', 'VITE_API_URL=\n');
    write(starter, 'index.html', '<!doctype html>\n');
    const clone = emptyClone();

    publish(starter, clone, SOURCE);
    expect(existsSync(path.join(clone, '.git/HEAD'))).toBe(true);
    expect(git(clone, 'ls-files').trim().split('\n').sort()).toEqual(['.env.example', '.gitignore', 'index.html']);
  });

  it('keeps the source subject verbatim', () => {
    const starter = tmp();
    write(starter, 'README.md', 'x\n');
    const clone = emptyClone();
    const subject = 'fix: quote "it", cost $HOME and `whoami` — done';

    publish(starter, clone, { ...SOURCE, subject });
    expect(git(clone, 'log', '-1', '--format=%s').trim()).toBe(`sync: rsk@0d74983 — ${subject}`);
  });
});
