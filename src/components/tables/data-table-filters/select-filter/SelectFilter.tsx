import { useCallback, useMemo, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Checkbox, RadioGroup } from '@components/ui';
import { Combobox } from '@components/shared';
import { Conditional } from '@components/utils';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import type { SelectFilterMeta } from '@app-types';

type FilterChip = { value: string; label: string };

type SelectFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: SelectFilterMeta;
};

function SelectFilter<TData>({ column, filterMeta }: SelectFilterProps<TData>) {
  const { t } = useAppTranslation('common');
  const isMulti = filterMeta.variant === 'multiSelect';
  const options = filterMeta.options as Record<string, unknown>[];
  const columnFilterValue = column.getFilterValue();

  const [open, setOpen] = useState(false);

  const { getOptionLabel, getOptionValue } = filterMeta;

  const selectedValues = useMemo(
    () => new Set(Array.isArray(columnFilterValue) ? (columnFilterValue as string[]) : []),
    [columnFilterValue],
  );

  const chips = useMemo<FilterChip[]>(
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

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <FilterPill label={filterMeta.label} values={chips.map((chip) => chip.label)} onClear={() => column.setFilterValue(undefined)} />

      <Combobox.Content className="min-w-60" shouldFilter={true}>
        <Combobox.Input placeholder={filterMeta.placeholder ?? filterMeta.label} />

        <Combobox.List>
          <Combobox.Empty when={options.length === 0}>{t('noResults')}</Combobox.Empty>

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
                      <Checkbox checked={isSelected} tabIndex={-1} className="pointer-events-none" />
                    </Combobox.Indicator>
                  </Conditional.If>

                  <Conditional.Else>
                    <Combobox.Indicator>
                      <RadioGroup.Dot checked={isSelected} />
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
