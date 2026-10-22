// tests/design-system/react-compiler.test.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { checkCompilerConfig } from './target-checks';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const config = readFileSync(fileURLToPath(new URL('../../vite.config.ts', import.meta.url)), 'utf8');

describe('React Compiler', () => {
  it('builds with the React Compiler (Vite: the React plugin’s preset, not SWC; Next: reactCompiler)', () => {
    expect(checkCompilerConfig(ROOT)).toEqual([]);
  });

  it('keeps compiler rules as errors, so new code stays compilable', () => {
    for (const rule of ['purity', 'refs', 'set-state-in-effect', 'static-components']) {
      expect(config).toMatch(new RegExp(`'react/${rule}': 'error'`));
    }
  });

  it("skips only this project's tests/ and test-utils/ folders, never a clone that happens to live under a tests/ path", () => {
    const exclude = config.slice(config.indexOf('const COMPILER_EXCLUDE'), config.indexOf('];', config.indexOf('const COMPILER_EXCLUDE')));
    expect(exclude).not.toContain(String.raw`/[\\/]tests[\\/]/`);
    expect(exclude).toContain('new RegExp(`^${ROOT_ID}/tests/`)');
    expect(exclude).toContain('new RegExp(`^${ROOT_ID}/(?:.+/)?test-utils/`)');
  });
});
