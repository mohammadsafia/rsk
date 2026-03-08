import { type MouseEvent, useCallback, useMemo } from 'react';

import type { Column } from '@tanstack/react-table';

import { Divider } from '@components/ui';
import { MultiCombobox, useMultiComboboxContext } from '@components/shared';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { ChevronDown, MinusCircle } from 'lucide-react';

import type { DataTableFilterMeta } from '@app-types';

type AsyncMultiSelectFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: DataTableFilterMeta;
};

const MAX_VISIBLE_CHIPS = 2;

function AsyncMultiSelectChips() {
  const context = useMultiComboboxContext();
  const selectedArray = useMemo(() => Array.from(context.selectedValues), [context.selectedValues]);
  const hasSelection = selectedArray.length > 0;

  const visibleValues = selectedArray.slice(0, MAX_VISIBLE_CHIPS);
  const overflowCount = selectedArray.length - MAX_VISIBLE_CHIPS;

  const handleRemoveValue = useCallback(
    (value: string, e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      context.handleItemSelect(value);
    },
    [context],
  );

  if (!hasSelection) return null;

  return (
    <>
      <Divider orientation="vertical" className="mx-0.5 h-4" />

      <div className="flex items-center gap-2">
        {visibleValues.map((val) => {
          const option = context.findOptionByValue(val);
          const label = option ? context.getOptionLabel(option) : val;

          return (
            <span key={val} className="text-2xs text-muted-400 flex items-center gap-0.5 font-normal">
              {label}

              <MinusCircle
                className="text-muted-400 hover:text-error-500 size-4 cursor-pointer"
                onClick={(e) => handleRemoveValue(val, e)}
              />
            </span>
          );
        })}

        <Conditional.If condition={overflowCount > 0}>
          <span className="text-2xs text-primary-900 font-normal">+{overflowCount}</span>
        </Conditional.If>
      </div>
    </>
  );
}

function AsyncMultiSelectFilter<TData>({ column, filterMeta }: AsyncMultiSelectFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();
  const selectedValues = useMemo(() => (Array.isArray(columnFilterValue) ? (columnFilterValue as string[]) : []), [columnFilterValue]);

  const handleChange = useCallback(
    (newValues: string[] | Record<string, unknown>[]) => {
      column.setFilterValue(newValues.length > 0 ? newValues : undefined);
    },
    [column],
  );

  return (
    <MultiCombobox
      options={filterMeta.options}
      value={selectedValues}
      onChange={handleChange}
      getOptionLabel={filterMeta.getOptionLabel}
      getOptionValue={filterMeta.getOptionValue}
      placeholder={filterMeta.placeholder ?? filterMeta.label}
      queryKey={filterMeta.queryKey ?? `filter-${column.id}`}
      urlSearchParams={filterMeta.urlSearchParams}
    >
      <MultiCombobox.Trigger
        className={cn(
          'border-muted-200 bg-surface text-primary-900 hover:bg-muted-50 flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-normal transition-colors',
          'focus-visible:border-muted-200 h-7.5 w-auto min-w-0 rounded-lg px-2 py-1 shadow-none focus-visible:ring-0',
          '[&>*:last-child]:hidden',
          '[&>*:first-child]:flex [&>*:first-child]:items-center [&>*:first-child]:gap-1 [&>*:first-child]:overflow-visible [&>*:first-child]:whitespace-nowrap',
        )}
      >
        {filterMeta.label}

        <ChevronDown className="text-muted-400 size-4" />

        <AsyncMultiSelectChips />
      </MultiCombobox.Trigger>

      <MultiCombobox.Content className="min-w-60" />
    </MultiCombobox>
  );
}

export default AsyncMultiSelectFilter;
