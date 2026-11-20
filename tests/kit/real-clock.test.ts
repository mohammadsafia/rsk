import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

// A test that reads the real clock passes on most runs and fails near midnight or on a slow machine. Tests fix the
// clock (`vi.useFakeTimers` with `vi.setSystemTime`) and take "now" from it. This search keeps it that way: a test
// file may construct the current date only after it has fixed the clock in the same file.
const root = join(__dirname, '..', '..');
const realClock = /\bnew Date\(\)|\bDate\.now\(\)/;
const fixesClock = /\bsetSystemTime\(/;

function testFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) return [];
    if (statSync(path).isDirectory()) return testFiles(path);
    return /\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('tests and the clock', () => {
  it('no test reads the real clock without fixing it first', () => {
    const offenders = [join(root, 'src'), join(root, 'tests')]
      .flatMap(testFiles)
      .filter((file) => {
        const text = readFileSync(file, 'utf8');
        return realClock.test(text) && !fixesClock.test(text);
      })
      .map((file) => relative(root, file));
    expect(offenders, 'Fix the clock with vi.useFakeTimers and vi.setSystemTime before reading the current date').toEqual([]);
  });
});
