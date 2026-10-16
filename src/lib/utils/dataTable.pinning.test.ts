import { describe, expect, it } from 'vite-plus/test';

import { getCommonPinningStyles } from './dataTable';

const column = (pinned: 'left' | 'right') =>
  ({
    getIsPinned: () => pinned,
    getIsLastColumn: () => pinned === 'left',
    getIsFirstColumn: () => pinned === 'right',
    getStart: () => 0,
    getAfter: () => 0,
    getSize: () => 120,
  }) as never;

describe('getCommonPinningStyles', () => {
  it('draws the pinned edge shadow with a valid token colour (tokens are oklch, not hsl channels)', () => {
    for (const side of ['left', 'right'] as const) {
      const shadow = String(getCommonPinningStyles({ column: column(side), withBorder: true }).boxShadow ?? '');
      expect(shadow).toContain('var(--border)');
      expect(shadow).not.toContain('hsl(');
    }
  });
});
