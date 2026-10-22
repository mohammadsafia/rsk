'use client';

import { type ReactNode, useState } from 'react';

import { Button, EmptyState, Skeleton, Table } from '@components/ui';
import { Conditional } from '@components/utils';

import { useMotion } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { toneColor } from './chart-theme';
import type { ChartSeries, VisibleSeries } from './types';

type FrameContext = { visible: VisibleSeries[]; isRTL: boolean; animate: boolean };

export type ChartFrameProps<T> = {
  'aria-label': string;
  data: T[];
  series: ChartSeries[];
  xKey: keyof T & string;
  formatValue: (value: number) => string;
  formatX: (value: unknown) => string;
  height?: number;
  loading?: boolean;
  empty?: ReactNode;
  className?: string;
  /** Override the table view (DonutChart lists slices). */
  table?: { columns: string[]; rows: { key: string; cells: ReactNode[] }[] };
  /** Show the series legend. @default series.length > 1 */
  legend?: boolean;
  children: (context: FrameContext) => ReactNode;
};

/** Table cells match the chart: missing values are a gap there, an em dash here. */
export const formatCell = (raw: unknown, formatValue: (value: number) => string) =>
  raw === null || raw === undefined || raw === '' || !Number.isFinite(Number(raw)) ? '—' : formatValue(Number(raw));

export function ChartFrame<T>({
  'aria-label': ariaLabel,
  data,
  series,
  xKey,
  formatValue,
  formatX,
  height = 280,
  loading = false,
  empty,
  className,
  table,
  legend,
  children,
}: ChartFrameProps<T>) {
  const { t, isRTL } = useAppTranslation('common');
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [asTable, setAsTable] = useState(false);
  const { mode } = useMotion();
  // Charts paint still and morph on later data changes only (spec §4 Charts); never under reduced motion.
  // The "still" snapshot is taken when the plot is first shown, so data arriving after a loading state doesn't animate.
  const [stillData, setStillData] = useState<typeof data | null>(loading || data.length === 0 ? null : data);
  if (stillData === null && !loading && data.length > 0) setStillData(data);
  const animate = stillData !== null && data !== stillData && mode !== 'reduced';

  const colored: VisibleSeries[] = series.map((item, index) => ({ ...item, color: toneColor(item.tone, index) }));
  // Hidden keys are reconciled with the current series: stale keys are ignored, and the plot never goes blank.
  const activeHidden = colored.filter((item) => hidden.has(item.key)).length;
  const shown = colored.filter((item) => !hidden.has(item.key));
  const visible = shown.length > 0 ? shown : colored;
  const showLegend = legend ?? series.length > 1;
  const isEmpty = !loading && data.length === 0;

  const toggle = (key: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (colored.length - activeHidden > 1) next.add(key);
      return next;
    });

  const tableModel = table ?? {
    columns: ['', ...colored.map((item) => item.label)],
    rows: data.map((datum, index) => {
      const record = datum as Record<string, unknown>;
      return {
        key: String(record[xKey] ?? index),
        cells: [formatX(record[xKey]), ...colored.map((item) => formatCell(record[item.key], formatValue))],
      };
    }),
  };

  return (
    <figure
      data-slot="chart"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn('flex w-full flex-col gap-3', className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Conditional.If condition={showLegend && !asTable}>
          <div role="group" aria-label={t('charts.legend')} className="flex flex-wrap items-center gap-1">
            {colored.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={!hidden.has(item.key)}
                onClick={() => toggle(item.key)}
                className="focus-ring text-fg-muted aria-pressed:text-fg hover:bg-hover inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs transition-colors"
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ background: hidden.has(item.key) ? 'var(--border-strong)' : item.color }}
                />
                {item.label}
              </button>
            ))}
          </div>
        </Conditional.If>

        <Button variant="ghost" size="sm" className="ms-auto" aria-pressed={asTable} onClick={() => setAsTable((value) => !value)}>
          {t(asTable ? 'charts.viewChart' : 'charts.viewTable')}
        </Button>
      </div>

      <Conditional>
        <Conditional.If condition={loading}>
          <Skeleton shape="block" className="w-full" style={{ height }} />
        </Conditional.If>
        <Conditional.If condition={isEmpty}>{empty ?? <EmptyState size="sm" kind="no-results" title={t('charts.empty')} />}</Conditional.If>
        <Conditional.If condition={asTable}>
          <div className="border-border overflow-hidden rounded-lg border">
            <Table aria-label={ariaLabel}>
              <Table.Header>
                <Table.Row>
                  {tableModel.columns.map((column, index) => (
                    <Table.Head key={`${column}-${index}`} numeric={index > 0}>
                      {column}
                    </Table.Head>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {tableModel.rows.map((row) => (
                  <Table.Row key={row.key}>
                    {row.cells.map((cell, index) => (
                      <Table.Cell key={index} numeric={index > 0}>
                        {cell}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Conditional.If>
        <Conditional.Else>
          {/* recharts' accessibility layer makes the svg focusable: give it the kit ring, not the browser default.
              dir="ltr": recharts mirrors the chart itself (reversed axes, axis on the right), so svg text must lay out left
              to right, or an RTL page flips every text-anchor and the category labels land on top of the bars. */}
          <div data-slot="chart-plot" dir="ltr" className="[&_.recharts-surface]:focus-ring w-full" style={{ height }}>
            {children({ visible, isRTL, animate })}
          </div>
        </Conditional.Else>
      </Conditional>
    </figure>
  );
}
