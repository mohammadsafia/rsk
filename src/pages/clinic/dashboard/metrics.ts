import type { DailyMetric } from '@api/clinic';

export type RangeDays = 7 | 30 | 90;
export type Point = { date: string; value: number };
export type Figure = { value: number; trend: number | null; series: Point[] };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const rate = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
const round1 = (value: number) => Math.round(value * 10) / 10;

const windows = (metrics: DailyMetric[], days: RangeDays) => ({
  current: metrics.slice(-days),
  previous: metrics.length >= days * 2 ? metrics.slice(-days * 2, -days) : null,
});

/** Percentage change against the previous range; null without a previous range or with a zero base. */
const trendOf = (current: number, previous: number | null) =>
  previous === null || previous === 0 ? null : round1(((current - previous) / previous) * 100);

const figure = (
  metrics: DailyMetric[],
  days: RangeDays,
  total: (rows: DailyMetric[]) => number,
  daily: (row: DailyMetric) => number,
): Figure => {
  const { current, previous } = windows(metrics, days);
  return {
    value: total(current),
    trend: trendOf(total(current), previous ? total(previous) : null),
    series: current.map((row) => ({ date: row.date, value: daily(row) })),
  };
};

export const summarize = (metrics: DailyMetric[], days: RangeDays) => ({
  visits: figure(
    metrics,
    days,
    (rows) => sum(rows.map((r) => r.visits)),
    (r) => r.visits,
  ),
  newPatients: figure(
    metrics,
    days,
    (rows) => sum(rows.map((r) => r.newPatients)),
    (r) => r.newPatients,
  ),
  noShowRate: figure(
    metrics,
    days,
    (rows) => rate(sum(rows.map((r) => r.noShows)), sum(rows.map((r) => r.visits))),
    (r) => rate(r.noShows, r.visits),
  ),
  revenue: figure(
    metrics,
    days,
    (rows) => sum(rows.map((r) => r.revenue)),
    (r) => r.revenue,
  ),
});

export const visitsSeries = (metrics: DailyMetric[], days: RangeDays) =>
  metrics.slice(-days).map((row) => ({ date: row.date, completed: row.completed, noShows: row.noShows }));

export const revenueByDoctor = (metrics: DailyMetric[], days: RangeDays) => {
  const totals = new Map<string, number>();
  for (const row of metrics.slice(-days))
    for (const [doctorId, value] of Object.entries(row.revenueByDoctor)) totals.set(doctorId, (totals.get(doctorId) ?? 0) + value);
  return [...totals].map(([doctorId, revenue]) => ({ doctorId, revenue })).sort((a, b) => b.revenue - a.revenue);
};

export const payerMix = (metrics: DailyMetric[], days: RangeDays) => {
  const rows = metrics.slice(-days);
  return { insured: sum(rows.map((r) => r.insured)), selfPay: sum(rows.map((r) => r.selfPay)) };
};
