import type { ReactNode } from 'react';

export type ChartTone =
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'chart-6'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export type ChartSeries = { key: string; label: string; tone?: ChartTone };

/** `percent` expects fractions (0.12 → 12%). */
export type ValueFormat = 'number' | 'percent' | 'money' | ((value: number) => string);

export type ChartBaseProps<T> = {
  data: T[];
  series: ChartSeries[];
  x: { key: keyof T & string; format?: (value: unknown) => string };
  valueFormat?: ValueFormat;
  currency?: string;
  height?: number;
  loading?: boolean;
  empty?: ReactNode;
  'aria-label': string;
  className?: string;
};

export type VisibleSeries = ChartSeries & { color: string };
