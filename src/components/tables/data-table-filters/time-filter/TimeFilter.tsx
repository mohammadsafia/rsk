import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Popover, TimePicker } from '@components/ui';
import { Combobox } from '@components/shared';
import { type FilterChipItem, FilterChipList } from '@components/tables';

import { ChevronDown } from 'lucide-react';

import type { TimeFilterMeta } from '@app-types';

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

  const chips = useMemo<FilterChipItem[]>(() => (value ? [{ value, label: value }] : []), [value]);

  const onConfirm = useCallback(() => {
    column.setFilterValue(tempValue || undefined);
    setOpen(false);
  }, [column, tempValue]);

  const onRemoveChip = useCallback(
    (_value: string, event: MouseEvent) => {
      event.stopPropagation();

      column.setFilterValue(undefined);
    },
    [column],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <Combobox.Trigger className="hover:not-disabled:border-primary-25 hover:not-disabled:ring-primary-25 w-auto gap-1 rounded-sm px-2 py-1 text-xs">
        {filterMeta.label}

        <ChevronDown size={16} className="text-muted-400" />

        <FilterChipList chips={chips} onRemoveChip={onRemoveChip} maxVisibleChips={1} />
      </Combobox.Trigger>

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
