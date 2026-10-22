'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { useState } from 'react';

import { RadioGroup } from '@components/ui';
import { Combobox } from '@components/shared';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import type { BooleanFilterMeta } from '@app-types';
import { type KitColumn } from '@utils';
import type { RowData } from '@tanstack/react-table';

type BooleanFilterProps<TData extends RowData> = { column: KitColumn<TData>; filterMeta: BooleanFilterMeta };

function BooleanFilter<TData extends RowData>({ column, filterMeta }: BooleanFilterProps<TData>) {
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
