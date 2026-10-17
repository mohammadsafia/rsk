// @vitest-environment happy-dom
import { describe, expect, it } from 'vite-plus/test';

import { docsNavGroups } from '@component-docs/docs-nav';
import { getComponentDocsRegistry } from '@component-docs/registry';

describe('charts docs', () => {
  it('has a Charts nav group with the five chart pages', () => {
    const group = docsNavGroups(getComponentDocsRegistry()).find((item) => item.key === 'CHARTS');
    expect(group?.items.map((item) => item.id)).toEqual(['area-chart', 'bar-chart', 'donut-chart', 'line-chart', 'sparkline']);
  });
});
