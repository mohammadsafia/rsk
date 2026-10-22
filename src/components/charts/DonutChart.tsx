'use client';

import { type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { toneColor } from './chart-theme';
import { ChartFrame, formatCell } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';
import type { ValueFormat } from './types';
import { useChartFormat } from './useChartFormat';
import { MOTION_DURATIONS } from '@constants';

export type DonutChartProps<T> = {
  data: T[];
  nameKey: keyof T & string;
  valueKey: keyof T & string;
  valueFormat?: ValueFormat;
  currency?: string;
  height?: number;
  centerLabel?: ReactNode;
  centerValue?: ReactNode;
  loading?: boolean;
  empty?: ReactNode;
  'aria-label': string;
  className?: string;
};

export function DonutChart<T>({
  data,
  nameKey,
  valueKey,
  valueFormat,
  currency,
  height = 240,
  centerLabel,
  centerValue,
  loading,
  empty,
  className,
  ...rest
}: DonutChartProps<T>) {
  const { formatValue, formatX } = useChartFormat({ valueFormat, currency });
  const record = (datum: T) => datum as Record<string, unknown>;
  // Each slice is a "series" so the legend toggles slices.
  const series = data.map((datum) => ({ key: String(record(datum)[nameKey]), label: String(record(datum)[nameKey]) }));

  return (
    <ChartFrame
      aria-label={rest['aria-label']}
      data={data}
      series={series}
      xKey={nameKey}
      formatValue={formatValue}
      formatX={formatX}
      height={height}
      loading={loading}
      empty={empty}
      className={className}
      table={{
        columns: ['', ''],
        rows: data.map((datum) => ({
          key: String(record(datum)[nameKey]),
          cells: [String(record(datum)[nameKey]), formatCell(record(datum)[valueKey], formatValue)],
        })),
      }}
    >
      {({ visible, animate }) => {
        const shown = data.filter((datum) => visible.some((item) => item.key === String(record(datum)[nameKey])));
        return (
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height }}>
              <PieChart accessibilityLayer>
                <Tooltip content={<ChartTooltip formatValue={formatValue} formatX={formatX} />} />
                <Pie
                  data={shown}
                  dataKey={valueKey}
                  nameKey={nameKey}
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={2}
                  stroke="var(--surface)"
                  isAnimationActive={animate}
                  animationDuration={MOTION_DURATIONS.slow}
                >
                  {shown.map((datum) => {
                    const index = data.indexOf(datum);
                    return <Cell key={String(record(datum)[nameKey])} fill={toneColor(undefined, index)} />;
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <span dir="ltr" className="text-fg font-mono text-xl font-medium tabular-nums">
                {centerValue}
              </span>
              <span className="text-fg-muted text-xs">{centerLabel}</span>
            </div>
          </div>
        );
      }}
    </ChartFrame>
  );
}
