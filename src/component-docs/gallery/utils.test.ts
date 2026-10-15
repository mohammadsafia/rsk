// @vitest-environment happy-dom
import { describe, expect, it } from 'vite-plus/test';

import { buildCategoryTabOptions } from './utils';

import type { ComponentDocEntry } from '@component-docs/registry';

const doc = (category: string): ComponentDocEntry => ({
  id: category.toLowerCase(),
  title: category,
  section: 'Components',
  category,
  description: category,
  load: async () => ({ default: () => null }),
});

describe('buildCategoryTabOptions', () => {
  it('orders Foundations first, then UI, with Calendar last', () => {
    const tabs = buildCategoryTabOptions(['Shared', 'Calendar', 'UI', 'Forms', 'Foundations'].map(doc));
    expect(tabs.map((tab) => tab.key)).toEqual(['FOUNDATIONS', 'UI', 'FORMS', 'SHARED', 'CALENDAR']);
  });
});
