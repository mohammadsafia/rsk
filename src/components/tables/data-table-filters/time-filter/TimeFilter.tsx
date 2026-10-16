import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Popover, TimePicker } from '@components/ui';
import { Combobox } from '@components/shared';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import type { TimeFilterMeta } from '@app-types';

type FilterChip = { value: string; label: string };

type TimeFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: TimeFilterMeta;
};

function TimeFilter<TData>({ column, filterMeta }: TimeFilterProps<TData>) {
  const { use24hFormat = false, min = '00:00', max = '23:59', step = 1 } = filterMeta;

  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState('');

  const value = column.getFilterValue() as string | undefined;

  const startAt = use24hFormat ? '08:00' : '08:00 AM';

  // Seed the scroll selectors when opening; clear scratch state on close.
  useEffect(() => {
    setTempValue(open ? value || startAt : '');
  }, [open, value, startAt]);

  const chips = useMemo<FilterChip[]>(() => (value ? [{ value, label: value }] : []), [value]);

  const onConfirm = useCallback(() => {
    column.setFilterValue(tempValue || undefined);
    setOpen(false);
  }, [column, tempValue]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <FilterPill label={filterMeta.label} values={chips.map((chip) => chip.label)} onClear={() => column.setFilterValue(undefined)} />

      <TimePicker.Content
        value={value}
        tempValue={tempValue}
        onTempValueChange={setTempValue}
        onConfirm={onConfirm}
        use24hFormat={use24hFormat}
        min={min}
        max={max}
        step={step}
      />
    </Popover>
  );
}

export default TimeFilter;
