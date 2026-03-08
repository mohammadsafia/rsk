import { type MouseEvent, useCallback, useMemo, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Command, Popover } from '@components/ui';
import { type FilterChipItem, FilterChipTrigger } from '@components/tables';

import { cn } from '@utils';

import { CheckIcon } from 'lucide-react';

import type { DataTableFilterMeta } from '@app-types';

type ListFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: DataTableFilterMeta;
};

function ListFilter<TData>({ column, filterMeta }: ListFilterProps<TData>) {
  const isMulti = filterMeta.variant === 'multiSelect';
  const options = filterMeta.options as Record<string, unknown>[];
  const columnFilterValue = column.getFilterValue();

  const [open, setOpen] = useState(false);

  const { getOptionLabel, getOptionValue } = filterMeta;

  const selectedValues = useMemo(
    () => new Set(Array.isArray(columnFilterValue) ? (columnFilterValue as string[]) : []),
    [columnFilterValue],
  );

  const chips = useMemo<FilterChipItem[]>(
    () =>
      options
        .filter((option) => selectedValues.has(getOptionValue(option)))
        .map((option) => ({ value: getOptionValue(option), label: getOptionLabel(option) })),
    [options, selectedValues, getOptionValue, getOptionLabel],
  );

  const handleItemSelect = useCallback(
    (option: Record<string, unknown>, isSelected: boolean) => {
      const value = getOptionValue(option);

      if (isMulti) {
        const next = new Set(selectedValues);
        if (isSelected) {
          next.delete(value);
        } else {
          next.add(value);
        }
        const values = Array.from(next);
        column.setFilterValue(values.length > 0 ? values : undefined);
      } else {
        column.setFilterValue(isSelected ? undefined : [value]);
        setOpen(false);
      }
    },
    [column, isMulti, selectedValues],
  );

  const handleRemoveChip = useCallback(
    (value: string, event: MouseEvent) => {
      event.stopPropagation();

      const next = new Set(selectedValues);
      next.delete(value);

      const values = Array.from(next);
      column.setFilterValue(values.length > 0 ? values : undefined);
    },
    [column, selectedValues],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="h-7.5" asChild>
        <FilterChipTrigger label={filterMeta.label} chips={chips} onRemoveChip={handleRemoveChip} />
      </Popover.Trigger>

      <Popover.Content className="min-w-60 p-0" align="start">
        <Command>
          <Command.Input placeholder={filterMeta.placeholder ?? filterMeta.label} />

          <Command.List>
            <Command.Empty>No results found.</Command.Empty>

            <Command.Group>
              {options.map((option) => {
                const value = getOptionValue(option);
                const label = getOptionLabel(option);
                const isSelected = selectedValues.has(value);

                return (
                  <Command.Item key={value} onSelect={() => handleItemSelect(option, isSelected)}>
                    <div
                      className={cn('border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', {
                        'bg-primary text-primary-foreground': isSelected,
                        'opacity-50 [&_svg]:invisible': !isSelected,
                        'rounded-full': !isMulti,
                      })}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </div>

                    <span className="truncate text-xs">{label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </Popover.Content>
    </Popover>
  );
}

export default ListFilter;
