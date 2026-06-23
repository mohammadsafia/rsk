import { type MouseEvent, useCallback, useMemo, useState } from 'react';

import type { Column } from '@tanstack/react-table';
import type { DateRange } from 'react-day-picker';

import { Calendar, Popover } from '@components/ui';
import { Combobox } from '@components/shared';
import { Conditional } from '@components/utils';
import { type FilterChipItem, FilterChipList } from '@components/tables';

import { DateFormats, useDate } from '@hooks/shared';

import { ChevronDown } from 'lucide-react';

import type { DateFilterMeta, DateRangeFilterValue } from '@app-types';

type DateFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: DateFilterMeta;
};

function DateFilter<TData>({ column, filterMeta }: DateFilterProps<TData>) {
  const { toDate, toBoundaryDate, formatDate } = useDate();

  const isRange = filterMeta.variant === 'dateRange';
  const displayFormat = filterMeta.dateFormat ?? DateFormats.SHORT_MONTH_DAY_YEAR;

  const [open, setOpen] = useState(false);

  const filterValue = column.getFilterValue();

  // Single: ISO `yyyy-MM-dd` string. Range: `{ from, to }` ISO strings.
  const single = isRange ? undefined : (filterValue as string | undefined);
  const range = isRange ? (filterValue as DateRangeFilterValue | undefined) : undefined;

  const selectedSingle = useMemo(() => (single ? toBoundaryDate(single) : undefined), [single, toBoundaryDate]);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!range?.from && !range?.to) return undefined;

    return {
      from: range?.from ? toBoundaryDate(range.from) : undefined,
      to: range?.to ? toBoundaryDate(range.to) : undefined,
    };
  }, [range, toBoundaryDate]);

  const chips = useMemo<FilterChipItem[]>(() => {
    if (isRange) {
      if (!range?.from && !range?.to) return [];

      const from = range?.from ? formatDate(range.from, displayFormat) : '…';
      const to = range?.to ? formatDate(range.to, displayFormat) : '…';

      return [{ value: 'range', label: `${from} – ${to}` }];
    }

    if (!single) return [];

    return [{ value: single, label: formatDate(single, displayFormat) }];
  }, [isRange, range, single, formatDate, displayFormat]);

  const onSelectSingle = useCallback(
    (date: Date | undefined) => {
      column.setFilterValue(date ? toDate(date) : undefined);
      setOpen(false);
    },
    [column, toDate],
  );

  const onSelectRange = useCallback(
    (next: DateRange | undefined) => {
      if (!next?.from && !next?.to) {
        column.setFilterValue(undefined);

        return;
      }

      column.setFilterValue({
        from: next?.from ? toDate(next.from) : undefined,
        to: next?.to ? toDate(next.to) : undefined,
      });
    },
    [column, toDate],
  );

  const onRemoveChip = useCallback(
    (_value: string, event: MouseEvent) => {
      event.stopPropagation();

      column.setFilterValue(undefined);
    },
    [column],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger className="hover:not-disabled:border-primary-25 hover:not-disabled:ring-primary-25 w-auto gap-1 rounded-sm px-2 py-1 text-xs">
        {filterMeta.label}

        <ChevronDown size={16} className="text-muted-400" />

        <FilterChipList chips={chips} onRemoveChip={onRemoveChip} maxVisibleChips={1} />
      </Combobox.Trigger>

      <Popover.Content align="start" className="w-auto p-0">
        <Conditional>
          <Conditional.If condition={isRange}>
            <Calendar
              mode="range"
              numberOfMonths={2}
              captionLayout="dropdown"
              selected={selectedRange}
              onSelect={onSelectRange}
              autoFocus
            />
          </Conditional.If>

          <Conditional.Else>
            <Calendar mode="single" captionLayout="dropdown" selected={selectedSingle} onSelect={onSelectSingle} autoFocus />
          </Conditional.Else>
        </Conditional>
      </Popover.Content>
    </Popover>
  );
}

export default DateFilter;
