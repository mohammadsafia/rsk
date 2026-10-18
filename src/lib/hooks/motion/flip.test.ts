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
    ).toEqual({
      moves: map([
        ['a', -40],
        ['b', -40],
        ['c', 80],
      ]),
      arrivals: [],
    });
  });

  it('moves the rows that stayed and lists the rows that arrived (a sort that changes the page)', () => {
    expect(
      planFlip(
        map([
          ['a', 0],
          ['b', 40],
        ]),
        map([
          ['c', 0],
          ['b', 40],
          ['a', 80],
        ]),
      ),
    ).toEqual({ moves: map([['a', -80]]), arrivals: ['c'] });
  });

  it('does nothing above 50 rows', () => {
    const prev = map(Array.from({ length: 51 }, (_, i) => [`r${i}`, i * 40] as [string, number]));
    const next = map([...prev].reverse().map(([id], i) => [id, i * 40] as [string, number]));
    expect(planFlip(prev, next)).toEqual({ moves: new Map(), arrivals: [] });
  });
});
