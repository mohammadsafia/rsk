// TanStack Table v8 hands out one mutable table object, so compiled memoization would render stale rows;
// opted out of the React Compiler until Table 9 (compiler-compatible).
'use no memo';

import { useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { RadioGroup } from '@components/ui';
import { Combobox } from '@components/shared';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import type { BooleanFilterMeta } from '@app-types';

type BooleanFilterProps<TData> = { column: Column<TData>; filterMeta: BooleanFilterMeta };

function BooleanFilter<TData>({ column, filterMeta }: BooleanFilterProps<TData>) {
  const { t } = useAppTranslation('common');
  const [open, setOpen] = useState(false);
  const value = column.getFilterValue() as boolean | undefined;

  const options = [
    { value: true, label: filterMeta.trueLabel ?? t('yes') },
    { value: false, label: filterMeta.falseLabel ?? t('no') },
  ];
  const active = options.find((option) => option.value === value);

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <FilterPill label={filterMeta.label} values={active ? [active.label] : []} onClear={() => column.setFilterValue(undefined)} />

      <Combobox.Content className="min-w-48" shouldFilter={false}>
        <Combobox.List>
          {options.map((option) => (
            <Combobox.Item
              key={String(option.value)}
              value={option.label}
              data-checked={option.value === value || undefined}
              onSelect={() => {
                column.setFilterValue(option.value === value ? undefined : option.value);
                setOpen(false);
              }}
            >
              <Combobox.Indicator>
                <RadioGroup.Dot checked={option.value === value} />
              </Combobox.Indicator>

              {option.label}
            </Combobox.Item>
          ))}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}

export default BooleanFilter;
