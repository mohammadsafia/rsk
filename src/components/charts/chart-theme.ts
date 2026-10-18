import type { ChartTone } from './types';

/** A token colour for a series: its tone, or the categorical palette by position. */
export const toneColor = (tone: ChartTone | undefined, index: number): string => {
  if (tone === 'neutral') return 'var(--fg-muted)';
  if (tone) return `var(--${tone})`;
  return `var(--chart-${(index % 6) + 1})`;
};

/**
 * An axis label in its own direction. The plot's svg lays text out left to right (chart-plot is dir="ltr"), so a tick's
 * text-anchor means the same side in every language. In Arabic each label is isolated: a category (a name) by its first
 * strong character (U+2068), so it reads right to left; a value (money, a count) left to right (U+2066), like <Money>,
 * so "US$" stays whole.
 */
export const axisLabel = (text: string, isRTL: boolean, kind: 'category' | 'value'): string =>
  isRTL ? `${kind === 'value' ? '\u2066' : '\u2068'}${text}\u2069` : text;

export const AXIS = {
  stroke: 'var(--border)',
  tick: { fill: 'var(--fg-muted)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID = { stroke: 'var(--border-subtle)', strokeDasharray: '3 3' } as const;
