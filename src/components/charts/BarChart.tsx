'use client';

import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AXIS, axisLabel, GRID } from './chart-theme';
import { ChartFrame } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';
import type { ChartBaseProps } from './types';
import { useChartFormat } from './useChartFormat';
import { MOTION_DURATIONS } from '@constants';

/** `orientation` is the direction the bars grow: `vertical` = columns. */
export type BarChartProps<T> = ChartBaseProps<T> & { orientation?: 'vertical' | 'horizontal'; stacked?: boolean };

export function BarChart<T>({
  data,
  series,
  x,
  valueFormat,
  currency,
  height = 280,
  loading,
  empty,
  className,
  orientation = 'vertical',
  stacked = false,
  ...rest
}: BarChartProps<T>) {
  const { formatValue, formatTick, formatX } = useChartFormat({ valueFormat, currency, xFormat: x.format });
  const horizontal = orientation === 'horizontal';

  return (
    <ChartFrame
      aria-label={rest['aria-label']}
      data={data}
      series={series}
      xKey={x.key}
      formatValue={formatValue}
      formatX={formatX}
      height={height}
      loading={loading}
      empty={empty}
      className={className}
    >
      {({ visible, isRTL, animate }) => (
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
          <RechartsBarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            accessibilityLayer
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid vertical={horizontal} horizontal={!horizontal} {...GRID} />
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  reversed={isRTL}
                  tickFormatter={(value: number) => axisLabel(formatTick(value), isRTL, 'value')}
                  {...AXIS}
                />
                <YAxis
                  type="category"
                  dataKey={x.key as string}
                  orientation={isRTL ? 'right' : 'left'}
                  width={96}
                  tickFormatter={(value: unknown) => axisLabel(formatX(value), isRTL, 'category')}
                  {...AXIS}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={x.key as string}
                  reversed={isRTL}
                  tickFormatter={(value: unknown) => axisLabel(formatX(value), isRTL, 'category')}
                  {...AXIS}
                />
                <YAxis
                  orientation={isRTL ? 'right' : 'left'}
                  width={64}
                  tickFormatter={(value: number) => axisLabel(formatTick(value), isRTL, 'value')}
                  {...AXIS}
                />
              </>
            )}
            <Tooltip content={<ChartTooltip formatValue={formatValue} formatX={formatX} />} cursor={{ fill: 'var(--hover)' }} />
            {visible.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                fill={item.color}
                radius={stacked ? 0 : 4}
                stackId={stacked ? 'stack' : undefined}
                maxBarSize={40}
                isAnimationActive={animate}
                animationDuration={MOTION_DURATIONS.slow}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
