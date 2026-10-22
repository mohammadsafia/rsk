'use client';

import type { TooltipContentProps } from 'recharts';

import { useAppTranslation } from '@hooks/shared';

type ChartTooltipProps = Partial<TooltipContentProps<number, string>> & {
  formatValue: (value: number) => string;
  formatX: (value: unknown) => string;
};

/** Raised-surface tooltip: x label, then a dot · name · value row per series. */
export function ChartTooltip({ active, payload, label, formatValue, formatX }: ChartTooltipProps) {
  // The plot is dir="ltr" (see ChartFrame); the tooltip is HTML and reads in the page's own direction.
  const { direction } = useAppTranslation('common');
  if (!active || !payload?.length) return null;

  return (
    <div
      data-slot="chart-tooltip"
      dir={direction}
      className="bg-surface-raised text-fg shadow-raised flex min-w-36 flex-col gap-1 rounded-md px-3 py-2 text-xs"
    >
      <span className="text-fg-muted">{formatX(label)}</span>
      {payload.map((entry) => (
        <span key={String(entry.dataKey)} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-fg-muted">{entry.name}</span>
          <span dir="ltr" className="text-fg ms-auto font-mono tabular-nums">
            {formatValue(Number(entry.value))}
          </span>
        </span>
      ))}
    </div>
  );
}
