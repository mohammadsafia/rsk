import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { readLock, writeLock } from '../../scripts/kit/core';
import { starterRepo } from '../../scripts/kit/download';
import { kitTarget } from '../../scripts/lib/kit-target.mjs';

const app = (): string => mkdtempSync(path.join(tmpdir(), 'kit-target-'));
const oldLock = (dir: string): void => writeFileSync(path.join(dir, 'kit.lock.json'), JSON.stringify({ kit: 'aaaaaaa', files: {} }));

afterEach(() => {
  delete process.env.RSK_STARTER_REPO;
});

describe('kit target and starter repo', () => {
  it('an old lock (no starter, no target) means the Vite starter, as today', () => {
    const dir = app();
    oldLock(dir);
    expect(starterRepo(dir)).toBe('mohammadsafia/rsk-starter');
    expect(kitTarget(dir)).toBe('vite');
  });

  it('reads both from the lock, and keeps them when the lock is rewritten', () => {
    const dir = app();
    writeLock(dir, 'aaaaaaa', new Map(), [], { starter: 'mohammadsafia/rsk-next-starter', target: 'next' });
    writeLock(dir, 'bbbbbbb', new Map(), []);
    expect(readLock(dir)).toMatchObject({ starter: 'mohammadsafia/rsk-next-starter', target: 'next', kit: 'bbbbbbb' });
    expect(starterRepo(dir)).toBe('mohammadsafia/rsk-next-starter');
    expect(kitTarget(dir)).toBe('next');
  });

  it('writes an old-shaped lock byte for byte when there is no starter or target', () => {
    const dir = app();
    writeLock(dir, 'aaaaaaa', new Map([['src/a.ts', 'h']]), []);
    expect(Object.keys(readLock(dir))).toEqual(['kit', 'blocks', 'files']);
  });

  it('RSK_STARTER_REPO overrides an old lock', () => {
    const dir = app();
    oldLock(dir);
    process.env.RSK_STARTER_REPO = 'someone/fork';
    expect(starterRepo(dir)).toBe('someone/fork');
  });

  it('without a lock, a next.config file means next', () => {
    const dir = app();
    writeFileSync(path.join(dir, 'next.config.ts'), 'export default {};');
    expect(kitTarget(dir)).toBe('next');
    expect(kitTarget(app())).toBe('vite');
  });
});
