import { describe, expect, it } from 'vite-plus/test';

import type { DailyMetric } from '@api/clinic';

import { payerMix, revenueByDoctor, summarize, visitsSeries } from './metrics';

const day = (index: number, overrides: Partial<DailyMetric> = {}): DailyMetric => ({
  date: `2026-10-${String(index + 1).padStart(2, '0')}`,
  visits: 10,
  completed: 9,
  noShows: 1,
  newPatients: 2,
  revenue: 100,
  revenueByDoctor: { a: 60, b: 40 },
  insured: 6,
  selfPay: 3,
  ...overrides,
});

describe('dashboard metrics', () => {
  it('sums the range and compares it with the previous range of the same length', () => {
    const metrics = [
      ...Array.from({ length: 7 }, (_, i) => day(i)),
      ...Array.from({ length: 7 }, (_, i) => day(i + 7, { visits: 15, revenue: 150 })),
    ];
    const figures = summarize(metrics, 7);
    expect(figures.visits.value).toBe(105);
    expect(figures.visits.trend).toBe(50);
    expect(figures.revenue.value).toBe(1050);
    expect(figures.revenue.series).toHaveLength(7);
    expect(figures.newPatients.value).toBe(14);
  });

  it('has no trend when there is no previous range, and never NaN', () => {
    const metrics = Array.from({ length: 7 }, (_, i) => day(i));
    const figures = summarize(metrics, 7);
    expect(figures.visits.trend).toBeNull();
    expect(Object.values(figures).every((figure) => Number.isFinite(figure.value))).toBe(true);
  });

  it('reports a 0% no-show rate for days without visits', () => {
    const metrics = Array.from({ length: 7 }, (_, i) => day(i, { visits: 0, completed: 0, noShows: 0 }));
    const { noShowRate } = summarize(metrics, 7);
    expect(noShowRate.value).toBe(0);
    expect(noShowRate.series.every((point) => point.value === 0)).toBe(true);
  });

  it('builds the visits series, revenue by doctor and payer mix', () => {
    const metrics = Array.from({ length: 7 }, (_, i) => day(i));
    expect(visitsSeries(metrics, 7)[0]).toEqual({ date: '2026-10-01', completed: 9, noShows: 1 });
    expect(revenueByDoctor(metrics, 7)).toEqual([
      { doctorId: 'a', revenue: 420 },
      { doctorId: 'b', revenue: 280 },
    ]);
    expect(payerMix(metrics, 7)).toEqual({ insured: 42, selfPay: 21 });
  });
});
