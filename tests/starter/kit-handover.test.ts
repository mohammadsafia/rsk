// kit:update hands over to the updater it just received: the new scripts/kit/ (and the scripts/lib/ it imports) run the
// rest of the update, with the same starter, and its exit code is kit:update's.
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vite-plus/test';

import { readLock, readTree, writeLock } from '../../scripts/kit/core';

const ROOT = path.resolve(import.meta.dirname, '../..');
// Under node_modules: git and the kit's scans skip it, and imports still resolve to this repo's packages.
const SCRATCH = path.join(ROOT, 'node_modules/.cache/kit-handover');

/** An app (or a starter) holding only the kit updater, at kit version `kit`. */
const updaterOnly = (name: string, kit: string, change?: (dir: string) => void): string => {
  const dir = path.join(SCRATCH, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const folder of ['scripts/kit', 'scripts/lib']) cpSync(path.join(ROOT, folder), path.join(dir, folder), { recursive: true });
  writeFileSync(path.join(dir, 'package.json'), '{ "type": "module" }\n');
  change?.(dir);
  writeLock(dir, kit, readTree(dir));
  return dir;
};

afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

describe('kit:update self-update', () => {
  it('runs the rest of the update with the new updater and the scripts/lib it imports', () => {
    const app = updaterOnly('app', 'a'.repeat(40));
    const starter = updaterOnly('starter', 'b'.repeat(40), (dir) => {
      // A newer updater that needs a newer scripts/lib/ module.
      appendFileSync(path.join(dir, 'scripts/lib/kit-target.mjs'), "\nexport const HANDOVER = 'new lib';\n");
      const kit = path.join(dir, 'scripts/kit/kit.ts');
      writeFileSync(
        kit,
        `import { HANDOVER } from '../lib/kit-target.mjs';\nconsole.log('NEW UPDATER', HANDOVER);\n${readFileSync(kit, 'utf8')}`,
      );
    });

    const run = spawnSync(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/kit/kit.ts', 'update', '--from', starter], {
      cwd: app,
      encoding: 'utf8',
    });

    expect(run.stderr, run.stderr).not.toMatch(/Error/);
    expect(run.stdout).toContain('kit:update updated itself');
    expect(run.stdout).toContain('NEW UPDATER new lib');
    expect(run.status).toBe(0);
    expect(readFileSync(path.join(app, 'scripts/kit/kit.ts'), 'utf8')).toBe(readFileSync(path.join(starter, 'scripts/kit/kit.ts'), 'utf8'));
    expect(readLock(app).kit).toBe('b'.repeat(40));
  });
});
