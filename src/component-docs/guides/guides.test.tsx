// @vitest-environment happy-dom
import { describe, expect, it } from 'vite-plus/test';

import { getComponentDocsRegistry } from '@component-docs/registry';

const GUIDES = ['introduction', 'installation', 'theming', 'rtl-i18n', 'forms', 'data-tables'];

describe('guides', () => {
  it('registers all six guides in order with real sections', () => {
    const guides = getComponentDocsRegistry()
      .filter((doc) => doc.category.toUpperCase() === 'GUIDES')
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    expect(guides.map((doc) => doc.id)).toEqual(GUIDES);
    guides.forEach((guide) => expect(guide.headings.length, guide.id).toBeGreaterThanOrEqual(3));
  });
});
