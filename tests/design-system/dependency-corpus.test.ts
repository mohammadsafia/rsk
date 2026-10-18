// tests/design-system/dependency-corpus.test.ts
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { corpusFiles } from './dependency-corpus';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

describe('corpusFiles', () => {
  it("skips the starter manifest, which names docs-only packages as data, so they can't pass for used", () => {
    expect(corpusFiles(['scripts/starter/manifest.ts', 'scripts/starter/build-starter.ts'], ROOT)).toEqual([
      'scripts/starter/build-starter.ts',
    ]);
  });

  it('skips a file git still lists but that was deleted, instead of crashing on it', () => {
    expect(corpusFiles(['src/does-not-exist.ts', 'vite.config.ts'], ROOT)).toEqual(['vite.config.ts']);
  });

  it('reads sources only, never package.json or the lockfile', () => {
    expect(corpusFiles(['package.json', 'pnpm-lock.yaml', 'README.md', 'src/main.tsx'], ROOT)).toEqual(['src/main.tsx']);
  });
});
