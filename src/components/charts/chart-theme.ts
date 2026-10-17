import type { ChartTone } from './types';

/** A token colour for a series: its tone, or the categorical palette by position. */
export const toneColor = (tone: ChartTone | undefined, index: number): string => {
  if (tone === 'neutral') return 'var(--fg-muted)';
  if (tone) return `var(--${tone})`;
  return `var(--chart-${(index % 6) + 1})`;
};

export const AXIS = {
  stroke: 'var(--border)',
  tick: { fill: 'var(--fg-muted)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID = { stroke: 'var(--border-subtle)', strokeDasharray: '3 3' } as const;
