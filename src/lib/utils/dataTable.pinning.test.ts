import { describe, expect, it } from 'vite-plus/test';

import { getCommonPinningStyles } from './dataTable';

const column = (pinned: 'start' | 'end') =>
  ({
    getIsPinned: () => pinned,
    getIsLastColumn: () => pinned === 'start',
    getIsFirstColumn: () => pinned === 'end',
    getStart: () => 24,
    getAfter: () => 48,
    getSize: () => 120,
  }) as never;

describe('getCommonPinningStyles', () => {
  it('draws the pinned edge shadow with a valid token colour (tokens are oklch, not hsl channels)', () => {
    for (const side of ['start', 'end'] as const) {
      const shadow = String(getCommonPinningStyles({ column: column(side), withBorder: true }).boxShadow ?? '');
      expect(shadow).toContain('var(--border)');
      expect(shadow).not.toContain('hsl(');
    }
  });

  it('sticks to the logical start or end (mirrors in RTL), never a physical left or right', () => {
    const start = getCommonPinningStyles({ column: column('start') });
    const end = getCommonPinningStyles({ column: column('end') });
    expect(start).toMatchObject({ insetInlineStart: '24px', position: 'sticky' });
    expect(end).toMatchObject({ insetInlineEnd: '48px', position: 'sticky' });
    for (const style of [start, end]) expect(Object.keys(style)).not.toEqual(expect.arrayContaining(['left']));
    for (const style of [start, end]) expect(Object.keys(style)).not.toEqual(expect.arrayContaining(['right']));
  });
});
