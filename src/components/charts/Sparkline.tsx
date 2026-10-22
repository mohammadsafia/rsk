'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { toneColor } from './chart-theme';
import type { ChartTone } from './types';

export type SparklineProps<T> = {
  data: T[];
  valueKey: keyof T & string;
  tone?: ChartTone;
  height?: number;
  'aria-label': string;
  className?: string;
};

/** A tiny trend line without axes, for StatCard. Needs at least two points to draw. */
export function Sparkline<T>({ data, valueKey, tone = 'accent', height = 32, className, ...rest }: SparklineProps<T>) {
  const { isRTL } = useAppTranslation('common');

  return (
    <div role="img" aria-label={rest['aria-label']} data-slot="sparkline" className={cn('w-full', className)} style={{ height }}>
      {data.length >= 2 && (
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 120, height }}>
          {/* No accessibility layer: it would add a focusable role="application" inside role="img". */}
          <LineChart data={data} accessibilityLayer={false} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <XAxis hide reversed={isRTL} />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Line dataKey={valueKey} type="monotone" stroke={toneColor(tone, 0)} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
