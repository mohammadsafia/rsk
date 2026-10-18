import { readFileSync } from 'node:fs';

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
  it('casts the pinned edge shadow toward the scrolling side in either direction (--inline-sign flips it in RTL)', () => {
    const startEdge = String(getCommonPinningStyles({ column: column('start'), withBorder: true }).boxShadow);
    const endEdge = String(getCommonPinningStyles({ column: column('end'), withBorder: true }).boxShadow);
    expect(startEdge).toBe('calc(var(--inline-sign, 1) * -4px) 0 4px -4px var(--border) inset');
    expect(endEdge).toBe('calc(var(--inline-sign, 1) * 4px) 0 4px -4px var(--border) inset');
    const css = readFileSync(new URL('../../styles/utilities.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\[dir='rtl'\]\s*\{\s*--inline-sign: -1;/);
    expect(css).toMatch(/\[dir='ltr'\]\s*\{\s*--inline-sign: 1;/);
  });

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
