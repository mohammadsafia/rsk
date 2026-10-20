// tests/kit/kit.test.ts — kit:status / kit:update, on throwaway app, upstream and base folders.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { applyUpdate, classify, dependencyChanges, hashFile, inScope, readTree, writeLock } from '../../scripts/kit/core';

const dir = () => mkdtempSync(path.join(tmpdir(), 'kit-'));
const put = (root: string, file: string, text: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
};
const read = (root: string, file: string) => readFileSync(path.join(root, file), 'utf8');

const BUTTON = 'src/components/ui/button/Button.tsx';
const CARD = 'src/components/ui/card/Card.tsx';
const OLD = 'src/components/ui/old/Old.tsx';
const NEW = 'src/components/ui/new/New.tsx';
const MINE = 'src/components/ui/button/MyButton.tsx';
const PAGE = 'src/pages/dashboard/DashboardPage.tsx';

/** base = the version the app took; app = base + its own edits; upstream = the kit now. */
const scenario = () => {
  const base = dir();
  put(base, BUTTON, 'one\ntwo\nthree\n');
  put(base, CARD, 'card v1\n');
  put(base, OLD, 'old\n');
  put(base, PAGE, 'page\n');
  put(base, 'src/components/ui/tag/Tag.tsx', 'a\nb\nc\nd\ne\n');

  const app = dir();
  for (const file of [BUTTON, CARD, OLD, PAGE, 'src/components/ui/tag/Tag.tsx']) put(app, file, read(base, file));
  writeLock(app, 'aaaaaaa', readTree(app));
  put(app, CARD, 'card v1 with my tweak\n'); // changed locally only
  put(app, MINE, 'mine\n'); // the app's own file
  put(app, 'src/components/ui/tag/Tag.tsx', 'A\nb\nc\nd\ne\n'); // both sides change, different lines
  put(app, PAGE, 'my page\n'); // app-owned: never in scope

  const upstream = dir();
  put(upstream, BUTTON, 'one\ntwo\nthree\nfour\n'); // updated upstream only
  put(upstream, CARD, 'card v1\n');
  put(upstream, NEW, 'new\n'); // added upstream; OLD removed upstream
  put(upstream, 'src/components/ui/tag/Tag.tsx', 'a\nb\nc\nd\nE\n');
  put(upstream, PAGE, 'their page\n');
  return { base, app, upstream };
};

const statusOf = (rows: { path: string; status: string }[], file: string) => rows.find((row) => row.path === file)?.status;

describe('kit scope', () => {
  it('owns components, hooks, utils, styles and the gates; never pages, routes, layouts, api or locales', () => {
    expect(inScope(BUTTON)).toBe(true);
    expect(inScope('src/lib/hooks/shared/useDate.ts')).toBe(true);
    expect(inScope('scripts/bundle/first-load.mjs')).toBe(true);
    for (const file of [
      PAGE,
      'src/routes/router.tsx',
      'src/layouts/app-layout/AppLayout.tsx',
      'src/api/x.ts',
      'src/locales/en/common.json',
      'package.json',
    ])
      expect(inScope(file)).toBe(false);
  });
});

describe('kit:status', () => {
  it('sorts every kit file: updated, added, removed, changed locally, changed on both sides; ignores the app’s own', () => {
    const { app, upstream } = scenario();
    const lock = JSON.parse(read(app, 'kit.lock.json'));
    const rows = classify(lock, readTree(app), readTree(upstream));
    expect(statusOf(rows, BUTTON)).toBe('updated');
    expect(statusOf(rows, NEW)).toBe('added');
    expect(statusOf(rows, OLD)).toBe('removed');
    expect(statusOf(rows, CARD)).toBe('modified');
    expect(statusOf(rows, 'src/components/ui/tag/Tag.tsx')).toBe('conflict');
    expect(statusOf(rows, MINE)).toBeUndefined();
    expect(statusOf(rows, PAGE)).toBeUndefined();
  });

  it('calls a file the app removed but upstream changed a conflict, never a silent re-add', () => {
    const { app, upstream } = scenario();
    const lock = JSON.parse(read(app, 'kit.lock.json'));
    const local = readTree(app);
    local.delete(BUTTON);
    expect(statusOf(classify(lock, local, readTree(upstream)), BUTTON)).toBe('conflict');
  });
});

describe('kit:update', () => {
  it('takes safe changes, merges both-sides edits three ways, keeps the app’s edits and own files, refreshes the lock', () => {
    const { base, app, upstream } = scenario();
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(read(app, BUTTON)).toBe('one\ntwo\nthree\nfour\n');
    expect(read(app, NEW)).toBe('new\n');
    expect(existsSync(path.join(app, OLD))).toBe(false);
    expect(read(app, CARD)).toBe('card v1 with my tweak\n');
    expect(read(app, 'src/components/ui/tag/Tag.tsx')).toBe('A\nb\nc\nd\nE\n');
    expect(read(app, MINE)).toBe('mine\n');
    expect(read(app, PAGE)).toBe('my page\n');
    expect(result.merged).toEqual(['src/components/ui/tag/Tag.tsx']);
    expect(result.conflicts).toEqual([]);
    const lock = JSON.parse(read(app, 'kit.lock.json'));
    expect(lock.kit).toBe('bbbbbbb');
    expect(lock.files[BUTTON]).toBe(hashFile(path.join(upstream, BUTTON)));
    expect(lock.files[OLD]).toBeUndefined();
    // A file the app keeps changed stays "changed locally" next time, not "updated".
    expect(statusOf(classify(lock, readTree(app), readTree(upstream)), CARD)).toBe('modified');
  });

  it('marks colliding edits with conflict markers and lists them', () => {
    const { base, app, upstream } = scenario();
    put(app, 'src/components/ui/tag/Tag.tsx', 'a\nb\nc\nd\nmine\n');
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(result.conflicts).toEqual(['src/components/ui/tag/Tag.tsx']);
    expect(read(app, 'src/components/ui/tag/Tag.tsx')).toMatch(/<<<<<<< yours[\s\S]*mine[\s\S]*=======[\s\S]*E[\s\S]*>>>>>>> kit/);
  });

  it('without a base, keeps the app’s file and writes the kit’s version beside it', () => {
    const { app, upstream } = scenario();
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, kit: 'bbbbbbb' });
    expect(read(app, 'src/components/ui/tag/Tag.tsx')).toBe('A\nb\nc\nd\ne\n');
    expect(read(app, 'src/components/ui/tag/Tag.tsx.upstream')).toBe('a\nb\nc\nd\nE\n');
    expect(result.conflicts).toEqual(['src/components/ui/tag/Tag.tsx']);
  });

  it('--dry-run writes nothing', () => {
    const { base, app, upstream } = scenario();
    const before = read(app, 'kit.lock.json');
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb', dryRun: true });
    expect(result.updated).toContain(BUTTON);
    expect(read(app, BUTTON)).toBe('one\ntwo\nthree\n');
    expect(read(app, 'kit.lock.json')).toBe(before);
  });

  it('only touches the paths asked for', () => {
    const { base, app, upstream } = scenario();
    applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb', only: ['src/components/ui/new/'] });
    expect(read(app, NEW)).toBe('new\n');
    expect(read(app, BUTTON)).toBe('one\ntwo\nthree\n');
  });
});

describe('dependency changes', () => {
  it('lists added and changed upstream dependencies as one pnpm add line, and nothing when they match', () => {
    const local = { dependencies: { react: '^19.2.0', zod: '^4.0.0' }, devDependencies: { vitest: '1.0.0' } };
    const upstream = {
      dependencies: { react: '^19.3.0', zod: '^4.0.0', clsx: '^2.1.0' },
      devDependencies: { vitest: '1.0.0', playwright: '1.50.0' },
    };
    expect(dependencyChanges(local, upstream)).toBe('pnpm add clsx@^2.1.0 react@^19.3.0 && pnpm add -D playwright@1.50.0');
    expect(dependencyChanges(local, local)).toBeNull();
  });
});
