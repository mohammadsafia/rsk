// tests/design-system/typecheck-coverage.test.ts — `tsc -b` type-checks scripts/ and tests/, not only src/.
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { checkTypecheckProjects } from './target-checks';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

describe('type-check coverage', () => {
  it('builds the scripts-and-tests project with the app settings (JSX, DOM, aliases) it needs', () => {
    expect(checkTypecheckProjects(ROOT)).toEqual([]);
  });
});
