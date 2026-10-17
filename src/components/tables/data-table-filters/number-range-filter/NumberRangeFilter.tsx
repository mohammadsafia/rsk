import { useEffect, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Button, FormattedNumber, Popover } from '@components/ui';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import { useNumberFormat } from '@utils';

import type { NumberRangeFilterMeta, NumberRangeFilterValue } from '@app-types';

type NumberRangeFilterProps<TData> = { column: Column<TData>; filterMeta: NumberRangeFilterMeta };

function NumberRangeFilter<TData>({ column, filterMeta }: NumberRangeFilterProps<TData>) {
  const { t } = useAppTranslation('common');
  const formatNumber = useNumberFormat();
  const value = (column.getFilterValue() as NumberRangeFilterValue | undefined) ?? {};
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState<number | null>(value.min ?? null);
  const [max, setMax] = useState<number | null>(value.max ?? null);

  useEffect(() => {
    if (!open) return;
    setMin(value.min ?? null);
    setMax(value.max ?? null);
  }, [open, value.min, value.max]);

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
    <Popover open={open} onOpenChange={setOpen}>
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
