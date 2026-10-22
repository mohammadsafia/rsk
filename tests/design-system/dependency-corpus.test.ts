// tests/design-system/dependency-corpus.test.ts
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { corpusFiles } from './dependency-corpus';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

describe('corpusFiles', () => {
  it("skips the starter manifest, which names docs-only packages as data, so they can't pass for used", () => {
    // vite.config.ts exists in the kit and the starter alike (the starter ships no scripts/starter/).
    expect(corpusFiles(['scripts/starter/manifest.ts', 'vite.config.ts'], ROOT)).toEqual(['vite.config.ts']);
  });

  it('skips a file git still lists but that was deleted, instead of crashing on it', () => {
    expect(corpusFiles(['src/does-not-exist.ts', 'vite.config.ts'], ROOT)).toEqual(['vite.config.ts']);
  });

  it('reads sources only, never package.json or the lockfile', () => {
    // A kit file: every app has it, whatever its framework.
    const kitFile = 'src/components/ui/button/Button.tsx';
    expect(corpusFiles(['package.json', 'pnpm-lock.yaml', 'README.md', kitFile], ROOT)).toEqual([kitFile]);
  });
});
