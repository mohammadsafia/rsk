// tests/design-system/react-compiler.test.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const config = readFileSync(fileURLToPath(new URL('../../vite.config.ts', import.meta.url)), 'utf8');

describe('React Compiler', () => {
  it('builds with @vitejs/plugin-react and its React Compiler preset, not SWC', () => {
    expect(config).toContain("from '@vitejs/plugin-react'");
    expect(config).toContain('reactCompilerPreset');
    expect(config).not.toContain('plugin-react-swc');
  });

  it('keeps compiler rules as errors, so new code stays compilable', () => {
    for (const rule of ['purity', 'refs', 'set-state-in-effect', 'static-components']) {
      expect(config).toMatch(new RegExp(`'react/${rule}': 'error'`));
    }
  });
});
