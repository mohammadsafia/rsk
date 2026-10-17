// @vitest-environment happy-dom
import path from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

import { getComponentDocsRegistry } from '@component-docs/registry';

import { countDocs, scanDocCounts } from '../../../scripts/docs/doc-counts';

describe('countDocs', () => {
  it('groups by normalised category and counts every doc', () => {
    expect(
      countDocs([{ category: 'UI' }, { category: 'ui' }, { category: 'Forms' }, { category: 'Shared' }, { category: 'Hooks' }]),
    ).toEqual({ ui: 2, forms: 1, shared: 1, total: 5 });
  });
});

describe('scanDocCounts', () => {
  it('counts the docs from frontmatter exactly as the registry does, so the landing stats never drift', () => {
    const counts = scanDocCounts(path.resolve(__dirname, '../../component-docs'));

    expect(counts).toEqual(countDocs(getComponentDocsRegistry()));
    expect(counts.ui).toBeGreaterThan(30);
  });

  it('is what the build injects for the landing page', () => {
    expect(__RSK_DOC_COUNTS__).toEqual(countDocs(getComponentDocsRegistry()));
  });
});
