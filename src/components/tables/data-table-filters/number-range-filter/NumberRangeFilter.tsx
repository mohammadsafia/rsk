'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { useEffect, useState } from 'react';

import { Button, FormattedNumber, Popover } from '@components/ui';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import { type KitColumn, useNumberFormat } from '@utils';

import type { NumberRangeFilterMeta, NumberRangeFilterValue } from '@app-types';
import type { RowData } from '@tanstack/react-table';

type NumberRangeFilterProps<TData extends RowData> = { column: KitColumn<TData>; filterMeta: NumberRangeFilterMeta };

function NumberRangeFilter<TData extends RowData>({ column, filterMeta }: NumberRangeFilterProps<TData>) {
  const { t } = useAppTranslation('common');
  const formatNumber = useNumberFormat();
  const value = (column.getFilterValue() as NumberRangeFilterValue | undefined) ?? {};
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState<number | null>(value.min ?? null);
  const [max, setMax] = useState<number | null>(value.max ?? null);

  // The inputs start from the applied range each time the popover opens, and follow it if it changes while open.
  const reseed = () => {
    setMin(value.min ?? null);
    setMax(value.max ?? null);
  };
  const onOpenChange = (next: boolean) => {
    if (next) reseed();
    setOpen(next);
  };
  const [seededFrom, setSeededFrom] = useState({ min: value.min, max: value.max });
  if (value.min !== seededFrom.min || value.max !== seededFrom.max) {
    setSeededFrom({ min: value.min, max: value.max });
    if (open) reseed();
  }

  const format = (n: number) => formatNumber(n, { style: filterMeta.format ?? 'decimal' });
  const hasMin = value.min !== undefined;
  const hasMax = value.max !== undefined;
  const summary =
    hasMin && hasMax
      ? `${format(value.min!)} – ${format(value.max!)}`
      : hasMin
        ? `≥ ${format(value.min!)}`
        : hasMax
          ? `≤ ${format(value.max!)}`
          : '';

  const apply = () => {
    const [low, high] = min !== null && max !== null && min > max ? [max, min] : [min, max];
    const next: NumberRangeFilterValue = { ...(low !== null && { min: low }), ...(high !== null && { max: high }) };
    column.setFilterValue(next.min === undefined && next.max === undefined ? undefined : next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <FilterPill
        label={filterMeta.label}
        values={summary ? [summary] : []}
        renderValues={(text) => (
          <span dir="ltr" className="tabular-nums">
            {text}
          </span>
        )}
        onClear={() => column.setFilterValue(undefined)}
      />

      <Popover.Content align="start" className="w-72 p-3">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <FormattedNumber
              size="sm"
              aria-label={t('filterBar.min')}
              placeholder={t('filterBar.min')}
              value={min}
              onChange={setMin}
              min={filterMeta.min}
              max={filterMeta.max}
            />
            <FormattedNumber
              size="sm"
              aria-label={t('filterBar.max')}
              placeholder={t('filterBar.max')}
              value={max}
              onChange={setMax}
              min={filterMeta.min}
              max={filterMeta.max}
            />
          </div>

          <Button type="submit" size="sm" className="self-end">
            {t('filterBar.apply')}
          </Button>
        </form>
      </Popover.Content>
    </Popover>
  );
}

export default NumberRangeFilter;
