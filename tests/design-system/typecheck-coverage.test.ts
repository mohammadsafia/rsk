// tests/design-system/typecheck-coverage.test.ts — `tsc -b` type-checks scripts/ and tests/, not only src/.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vite-plus/test';

/** tsconfig files allow comments and trailing commas; strip comments before parsing. */
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')) as Record<string, unknown>;

describe('type-check coverage', () => {
  it('builds the scripts-and-tests project with the app settings (JSX, DOM, aliases) it needs', () => {
    const root = read('tsconfig.json') as { references: { path: string }[] };
    expect(root.references.map((reference) => reference.path)).toContain('./tsconfig.scripts.json');
    const scripts = read('tsconfig.scripts.json') as { extends: string; include: string[] };
    expect(scripts.extends).toBe('./tsconfig.app.json');
    expect(scripts.include).toEqual(expect.arrayContaining(['scripts', 'tests']));
  });
});
