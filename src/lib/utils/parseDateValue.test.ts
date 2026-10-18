import { describe, expect, it } from 'vite-plus/test';

import { parseDateValue } from './parseDateValue';

describe('parseDateValue', () => {
  it('reads a date-only string as that day at local midnight, not UTC midnight (which is the day before west of UTC)', () => {
    const date = parseDateValue('2026-10-18')!;
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 9, 18, 0]);
  });

  it('keeps full timestamps and Dates as they are, and maps anything invalid or empty to undefined', () => {
    expect(parseDateValue('2026-10-18T10:00:00Z')?.toISOString()).toBe('2026-10-18T10:00:00.000Z');
    const now = new Date(2026, 0, 2);
    expect(parseDateValue(now)).toBe(now);
    expect(parseDateValue(new Date('nope'))).toBeUndefined();
    expect(parseDateValue('2026-02-30')).toBeUndefined();
    expect(parseDateValue('soon')).toBeUndefined();
    expect(parseDateValue('')).toBeUndefined();
    expect(parseDateValue(null)).toBeUndefined();
  });
});
