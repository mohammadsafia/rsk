import { type MouseEvent, useCallback, useMemo, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Checkbox, RadioDot } from '@components/ui';
import { Combobox } from '@components/shared';
import { Conditional } from '@components/utils';
import { type FilterChipItem, FilterChipList } from '@components/tables';

import { ChevronDown } from 'lucide-react';

import type { DataTableFilterMeta } from '@app-types';

type SelectFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: DataTableFilterMeta;
};

function SelectFilter<TData>({ column, filterMeta }: SelectFilterProps<TData>) {
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

  const onSelectItem = useCallback(
    (option: Record<string, unknown>, isSelected: boolean) => {
      const value = getOptionValue(option);

      if (isMulti) {
        const next = new Set(selectedValues);

        isSelected ? next.delete(value) : next.add(value);

        const values = Array.from(next);
        column.setFilterValue(values.length > 0 ? values : undefined);
      } else {
        column.setFilterValue(isSelected ? undefined : [value]);
        setOpen(false);
      }
    },
    [column, getOptionValue, isMulti, selectedValues],
  );

  const onRemoveChip = useCallback(
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
    <Combobox open={open} onOpenChange={setOpen}>
      <Combobox.Trigger className="hover:not-disabled:border-primary-25 hover:not-disabled:ring-primary-25 w-auto gap-1 px-2 py-1 text-xs">
        {filterMeta.label}

        <ChevronDown size={16} className="text-muted-400" />

        <FilterChipList chips={chips} onRemoveChip={onRemoveChip} maxVisibleChips={isMulti ? undefined : 1} />
      </Combobox.Trigger>

      <Combobox.Content className="min-w-60" shouldFilter={true}>
        <Combobox.Input placeholder={filterMeta.placeholder ?? filterMeta.label} />

        <Combobox.List>
          <Combobox.Empty when={options.length === 0}>No results</Combobox.Empty>

          {options.map((option) => {
            const value = getOptionValue(option);
            const label = getOptionLabel(option);
            const isSelected = selectedValues.has(value);

            return (
              <Combobox.Item
                key={value}
                value={label}
                data-checked={isSelected || undefined}
                onSelect={() => onSelectItem(option, isSelected)}
              >
                <Conditional>
                  <Conditional.If condition={isMulti}>
                    <Combobox.Indicator>
                      <Checkbox checked={isSelected} variant="primary" tabIndex={-1} className="pointer-events-none" />
                    </Combobox.Indicator>
                  </Conditional.If>

                  <Conditional.Else>
                    <Combobox.Indicator>
                      <RadioDot checked={isSelected} />
                    </Combobox.Indicator>
                  </Conditional.Else>
                </Conditional>

                {label}
              </Combobox.Item>
            );
          })}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}

export default SelectFilter;
