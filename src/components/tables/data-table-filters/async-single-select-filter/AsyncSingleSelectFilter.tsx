import { type MouseEvent, useCallback, useMemo } from 'react';

import type { Column } from '@tanstack/react-table';

import { Divider } from '@components/ui';
import { Combobox, useComboboxContext } from '@components/shared';

import { cn } from '@utils';

import { ChevronDown, MinusCircle } from 'lucide-react';

import type { DataTableFilterMeta } from '@app-types';

type AsyncSingleSelectFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: DataTableFilterMeta;
};

function AsyncSingleSelectChips() {
  const context = useComboboxContext();

  const chips = useMemo(() => {
    if (!context.hasValue) return [];

    const label = context.displayValue !== context.placeholder ? context.displayValue : context.value;

    return [{ value: String(context.value), label: String(label) }];
  }, [context.hasValue, context.displayValue, context.placeholder, context.value]);

  const handleRemove = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      context.handleClear();
    },
    [context],
  );

  if (chips.length === 0) return null;

  return (
    <>
      <Divider orientation="vertical" className="mx-0.5 h-4" />

      <span className="text-2xs text-muted-400 flex items-center gap-0.5 font-normal">
        {chips[0].label}

        <MinusCircle className="text-muted-400 hover:text-error-500 size-4 cursor-pointer" onClick={handleRemove} />
      </span>
    </>
  );
}

function AsyncSingleSelectFilter<TData>({ column, filterMeta }: AsyncSingleSelectFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();
  const selectedValues = Array.isArray(columnFilterValue) ? (columnFilterValue as string[]) : [];
  const value = selectedValues[0] ?? null;

  const handleChange = useCallback(
    (newValue: string | null) => {
      column.setFilterValue(newValue ? [newValue] : undefined);
    },
    [column],
  );

  return (
    <Combobox
      options={filterMeta.options}
      value={value}
      onChange={handleChange}
      getOptionLabel={filterMeta.getOptionLabel}
      getOptionValue={filterMeta.getOptionValue}
      placeholder={filterMeta.placeholder ?? filterMeta.label}
      queryKey={filterMeta.queryKey ?? `filter-${column.id}`}
      urlSearchParams={filterMeta.urlSearchParams}
    >
      <Combobox.Trigger
        className={cn(
          'border-muted-200 bg-surface text-primary-900 hover:bg-muted-50 flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-normal transition-colors',
          'focus-visible:border-muted-200 h-7.5 w-auto min-w-0 rounded-lg px-2 py-1 shadow-none focus-visible:ring-0',
          '[&>*:last-child]:hidden',
          '[&>*:first-child]:flex [&>*:first-child]:items-center [&>*:first-child]:gap-1 [&>*:first-child]:overflow-visible [&>*:first-child]:whitespace-nowrap',
        )}
      >
        {filterMeta.label}

        <ChevronDown className="text-muted-400 size-4" />

        <AsyncSingleSelectChips />
      </Combobox.Trigger>

      <Combobox.Content className="min-w-60" />
    </Combobox>
  );
}

export default AsyncSingleSelectFilter;
