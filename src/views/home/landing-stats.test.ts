// @vitest-environment happy-dom
import { describe, expect, it } from 'vite-plus/test';

import { getComponentDocsRegistry } from '@component-docs/registry';

import { countDocs } from './landing-stats';

describe('countDocs', () => {
  it('groups by normalised category and counts every doc', () => {
    expect(
      countDocs([{ category: 'UI' }, { category: 'ui' }, { category: 'Forms' }, { category: 'Shared' }, { category: 'Hooks' }]),
    ).toEqual({
      ui: 2,
      forms: 1,
      shared: 1,
      total: 5,
    });
  });

  it('matches the real registry, so the hero never drifts from the docs', () => {
    const counts = countDocs(getComponentDocsRegistry());
    expect(counts.total).toBe(getComponentDocsRegistry().length);
    expect(counts.ui).toBeGreaterThan(30);
  });
});
