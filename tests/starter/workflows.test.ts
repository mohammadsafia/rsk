// The CI that keeps both starters honest: every PR verifies the Vite and the Next starter, and main publishes each to
// its own repository with its own deploy key. Read as text (no YAML parser in the repo).
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = path.resolve(import.meta.dirname, '../..');
const workflow = (name: string) => readFileSync(path.join(ROOT, '.github/workflows', name), 'utf8');

describe('starter workflows', () => {
  it('verifies both starters on every pull request, with read-only permissions and no secrets', () => {
    const verify = workflow('starter-verify.yml');
    expect(verify).toMatch(/^on:\n {2}pull_request:/m);
    expect(verify).not.toContain('pull_request_target');
    expect(verify).toMatch(/^permissions:\n {2}contents: read/m);
    expect(verify).toContain('persist-credentials: false');
    expect(verify).toContain('target: [vite, next]');
    expect(verify).toContain('fail-fast: false');
    expect(verify).toContain('pnpm starter:verify -- --target ${{ matrix.target }}');
    expect(verify).not.toContain('secrets.');
  });

  it('publishes each starter to its own repository, with its own key, one target at a time', () => {
    const sync = workflow('starter-sync.yml');
    expect(sync).toContain('{ target: vite, repo: rsk-starter, key: STARTER_DEPLOY_KEY }');
    expect(sync).toContain('{ target: next, repo: rsk-next-starter, key: NEXT_STARTER_DEPLOY_KEY }');
    expect(sync).toContain('fail-fast: false');
    expect(sync).toMatch(/ {4}concurrency:\n {6}group: starter-sync-\$\{\{ matrix\.target \}\}/);
    expect(sync).toContain('ssh-private-key: ${{ secrets[matrix.key] }}');
    expect(sync).toContain('git@github.com:mohammadsafia/${{ matrix.repo }}.git');
    expect(sync).toContain('pnpm starter:build --target ${{ matrix.target }}');
    // The key is loaded only after the starter verified and built.
    expect(sync.indexOf('ssh-private-key')).toBeGreaterThan(sync.indexOf('starter:verify'));
    expect(sync.indexOf('ssh-private-key')).toBeGreaterThan(sync.indexOf('starter:build'));
  });

  it('keeps the CI files out of both starters', async () => {
    const { DROP } = await import('../../scripts/starter/manifest');
    expect(DROP).toEqual(expect.arrayContaining(['.github/workflows/starter-sync.yml', '.github/workflows/starter-verify.yml']));
  });
});
