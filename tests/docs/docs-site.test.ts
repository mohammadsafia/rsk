// tests/docs/docs-site.test.ts — the docs build ships the docs site; an app's `vp build` still never does.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

const ROOT = path.resolve(import.meta.dirname, '../..');
const out = mkdtempSync(path.join(os.tmpdir(), 'rsk-docs-site-'));
// Built as a real build is: Vitest runs with NODE_ENV=test, and a Vite build under it treats DEV as true.
const env = { ...process.env, NODE_ENV: 'production' };
const build = (...args: string[]) =>
  execFileSync('corepack', ['pnpm@10.34.7', 'exec', 'vp', 'build', ...args], { cwd: ROOT, stdio: 'pipe', env });
const scripts = (dist: string) =>
  readdirSync(path.join(dist, 'assets'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(path.join(dist, 'assets', file), 'utf8'))
    .join('\n');

/** Only the docs' Example block renders this slot. */
const DOCS_MARK = 'docs-example-preview';

beforeAll(() => {
  build('--outDir', path.join(out, 'app'));
  execFileSync('corepack', ['pnpm@10.34.7', 'run', 'docs:build', '--outDir', path.join(out, 'docs')], { cwd: ROOT, stdio: 'pipe', env });
}, 300_000);

afterAll(() => rmSync(out, { recursive: true, force: true }));

describe('docs site build', () => {
  it("leaves the docs out of an app's production build", () => {
    expect(scripts(path.join(out, 'app'))).not.toContain(DOCS_MARK);
  });

  it('ships the docs in the docs build, under the /rsk/ path GitHub Pages serves it from', () => {
    const dist = path.join(out, 'docs');
    expect(scripts(dist)).toContain(DOCS_MARK);
    expect(readFileSync(path.join(dist, 'index.html'), 'utf8')).toMatch(/src="\/rsk\/assets\//);
  });

  it('answers deep links on GitHub Pages: 404.html is the app itself', () => {
    const dist = path.join(out, 'docs');
    expect(existsSync(path.join(dist, '404.html'))).toBe(true);
    expect(readFileSync(path.join(dist, '404.html'), 'utf8')).toBe(readFileSync(path.join(dist, 'index.html'), 'utf8'));
  });
});
