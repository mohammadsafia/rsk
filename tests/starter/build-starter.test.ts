import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { buildStarter } from '../../scripts/starter/build-starter';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

let out = '';

beforeAll(() => {
  out = buildStarter(mkdtempSync(path.join(os.tmpdir(), 'rsk-starter-test-')));
});

afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

describe('buildStarter', () => {
  it('ships none of the starter tooling, its tests or its sync workflow', () => {
    expect(existsSync(path.join(out, 'scripts/starter'))).toBe(false);
    expect(existsSync(path.join(out, 'tests/starter'))).toBe(false);
    expect(existsSync(path.join(out, '.github/workflows/starter-sync.yml'))).toBe(false);
  });

  it('names no client API anywhere in the tree', () => {
    const offenders = walk(out).filter((file) => /qlinica/i.test(readFileSync(file, 'utf8')));
    expect(offenders.map((file) => path.relative(out, file))).toEqual([]);
  });

  it('ignores .env but keeps .env.example', () => {
    execFileSync('git', ['init', '-q'], { cwd: out });
    const ignored = (file: string) => {
      try {
        execFileSync('git', ['check-ignore', '-q', file], { cwd: out });
        return true;
      } catch {
        return false;
      }
    };
    expect(ignored('.env')).toBe(true);
    expect(ignored('.env.example')).toBe(false);
  });
});
