import { type MouseEvent, useCallback, useMemo, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Checkbox, RadioDot } from '@components/ui';
import { Combobox } from '@components/shared';
import { Conditional } from '@components/utils';
import { type FilterChipItem, FilterChipList } from '@components/tables';

import { type AsyncOptionsFn, useAsyncOptionsInfiniteQuery, useDebounce, useInfiniteScroll } from '@hooks/shared';

import { ChevronDown } from 'lucide-react';

import type { SelectFilterMeta } from '@app-types';

type AsyncSelectFilterProps<TData> = {
  column: Column<TData>;
  filterMeta: SelectFilterMeta;
};

function AsyncSelectFilter<TData>({ column, filterMeta }: AsyncSelectFilterProps<TData>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const isMulti = filterMeta.variant === 'multiSelect';

  const columnFilterValue = column.getFilterValue();
  const selectedValues = useMemo(() => (Array.isArray(columnFilterValue) ? (columnFilterValue as string[]) : []), [columnFilterValue]);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const hasValueToResolve = selectedValues.length > 0;

  const infiniteQuery = useAsyncOptionsInfiniteQuery({
    fetchOptions: filterMeta.options as AsyncOptionsFn<Record<string, unknown>>,
    queryKey: filterMeta.queryKey ?? `filter-${column.id}`,
    searchTerm: debouncedSearch,
    selectedItemsIds: selectedValues,
    urlSearchParams: filterMeta.urlSearchParams,
    pageSize: 20,
    enabled: open || hasValueToResolve,
  });

  const { handleScroll } = useInfiniteScroll({ infiniteQuery, enabled: true });

  const allOptions = useMemo(() => infiniteQuery.data?.pages.flatMap((p) => p.data) ?? [], [infiniteQuery.data]);

  const chips = useMemo<FilterChipItem[]>(
    () =>
      selectedValues.map((val) => {
        const option = allOptions.find((o) => filterMeta.getOptionValue(o) === val);

        return { value: val, label: option ? filterMeta.getOptionLabel(option) : val };
      }),
    [selectedValues, allOptions, filterMeta],
  );

  const onSelect = useCallback(
    (optValue: string) => {
      if (isMulti) {
        const next = new Set(selectedSet);

        next.has(optValue) ? next.delete(optValue) : next.add(optValue);

        column.setFilterValue(next.size > 0 ? Array.from(next) : undefined);
      } else {
        column.setFilterValue(selectedValues[0] === optValue ? undefined : [optValue]);

        setOpen(false);
      }
    },
    [column, isMulti, selectedSet, selectedValues],
  );

  const onRemoveChip = useCallback(
    (chipValue: string, e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (isMulti) {
        const next = selectedValues.filter((v) => v !== chipValue);
        column.setFilterValue(next.length > 0 ? next : undefined);
      } else {
        column.setFilterValue(undefined);
      }
    },
    [column, isMulti, selectedValues],
  );

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <Combobox.Trigger className="hover:not-disabled:border-primary-25 hover:not-disabled:ring-primary-25 w-auto gap-1 rounded-sm px-2 py-1 text-xs">
        {filterMeta.label}

        <ChevronDown size={16} className="text-muted-400" />

        <FilterChipList chips={chips} onRemoveChip={onRemoveChip} maxVisibleChips={isMulti ? undefined : 1} />
      </Combobox.Trigger>

      <Combobox.Content className="min-w-60" shouldFilter={false}>
        <Combobox.Input placeholder={filterMeta.placeholder ?? filterMeta.label} value={search} onValueChange={setSearch}>
          <Combobox.Loader when={infiniteQuery.isFetching || search !== debouncedSearch} />
        </Combobox.Input>

        <Combobox.List onScroll={handleScroll}>
          <Combobox.Empty when={!infiniteQuery.isFetching && allOptions.length === 0}>No results</Combobox.Empty>

          {allOptions.map((opt) => {
            const optValue = filterMeta.getOptionValue(opt);
            const isChecked = selectedSet.has(optValue);

            return (
              <Combobox.Item
                key={optValue}
                value={filterMeta.getOptionLabel(opt)}
                data-checked={isChecked || undefined}
                onSelect={() => onSelect(optValue)}
              >
                <Conditional>
                  <Conditional.If condition={isMulti}>
                    <Combobox.Indicator>
                      <Checkbox checked={isChecked} variant="primary" tabIndex={-1} className="pointer-events-none" />
                    </Combobox.Indicator>
                  </Conditional.If>

                  <Conditional.Else>
                    <Combobox.Indicator>
                      <RadioDot checked={isChecked} />
                    </Combobox.Indicator>
                  </Conditional.Else>
                </Conditional>

                {filterMeta.getOptionLabel(opt)}
              </Combobox.Item>
            );
          })}

          <Combobox.Loader when={infiniteQuery.isFetchingNextPage} message="Loading more..." />
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}

export default AsyncSelectFilter;
