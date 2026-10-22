'use client';

import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AXIS, axisLabel, GRID } from './chart-theme';
import { ChartFrame } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';
import type { ChartBaseProps } from './types';
import { useChartFormat } from './useChartFormat';
import { MOTION_DURATIONS } from '@constants';

export type LineChartProps<T> = ChartBaseProps<T> & { curve?: 'monotone' | 'linear' };

export function LineChart<T>({
  data,
  series,
  x,
  valueFormat,
  currency,
  height = 280,
  loading,
  empty,
  className,
  curve = 'monotone',
  ...rest
}: LineChartProps<T>) {
  const { formatValue, formatTick, formatX } = useChartFormat({ valueFormat, currency, xFormat: x.format });

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
          <RechartsLineChart data={data} accessibilityLayer margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} {...GRID} />
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
            <Tooltip content={<ChartTooltip formatValue={formatValue} formatX={formatX} />} cursor={{ stroke: 'var(--border-strong)' }} />
            {visible.map((item) => (
              <Line
                key={item.key}
                dataKey={item.key}
                name={item.label}
                type={curve}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={animate}
                animationDuration={MOTION_DURATIONS.slow}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
