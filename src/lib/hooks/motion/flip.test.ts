import { describe, expect, it } from 'vite-plus/test';

import { planFlip } from './useFlip';

const map = (entries: Array<[string, number]>) => new Map(entries);

describe('planFlip', () => {
  it('returns how far each row moved when the same rows change order', () => {
    expect(
      planFlip(
        map([
          ['a', 0],
          ['b', 40],
          ['c', 80],
        ]),
        map([
          ['c', 0],
          ['a', 40],
          ['b', 80],
        ]),
      ),
    ).toEqual(
      map([
        ['a', -40],
        ['b', -40],
        ['c', 80],
      ]),
    );
  });

  it('does nothing when the set of rows changed (paging, filtering)', () => {
    expect(
      planFlip(
        map([
          ['a', 0],
          ['b', 40],
        ]),
        map([
          ['b', 0],
          ['c', 40],
        ]),
      ).size,
    ).toBe(0);
  });

  it('does nothing above 50 rows', () => {
    const prev = map(Array.from({ length: 51 }, (_, i) => [`r${i}`, i * 40] as [string, number]));
    const next = map([...prev].reverse().map(([id], i) => [id, i * 40] as [string, number]));
    expect(planFlip(prev, next).size).toBe(0);
  });
});
