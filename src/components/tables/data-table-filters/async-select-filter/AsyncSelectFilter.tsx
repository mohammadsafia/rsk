'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { useCallback, useMemo, useState } from 'react';

import { Checkbox, RadioGroup } from '@components/ui';
import { Combobox } from '@components/shared';
import { Conditional } from '@components/utils';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { type AsyncOptionsFn, useAppTranslation, useAsyncOptionsInfiniteQuery, useDebounce, useInfiniteScroll } from '@hooks/shared';

import type { SelectFilterMeta } from '@app-types';
import { type KitColumn } from '@utils';
import type { RowData } from '@tanstack/react-table';

type FilterChip = { value: string; label: string };

type AsyncSelectFilterProps<TData extends RowData> = {
  column: KitColumn<TData>;
  filterMeta: SelectFilterMeta;
};

function AsyncSelectFilter<TData extends RowData>({ column, filterMeta }: AsyncSelectFilterProps<TData>) {
  const { t } = useAppTranslation('common');
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

  const chips = useMemo<FilterChip[]>(
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

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <FilterPill label={filterMeta.label} values={chips.map((chip) => chip.label)} onClear={() => column.setFilterValue(undefined)} />

      <Combobox.Content className="min-w-60" shouldFilter={false}>
        <Combobox.Input placeholder={filterMeta.placeholder ?? filterMeta.label} value={search} onValueChange={setSearch}>
          <Combobox.Loader when={infiniteQuery.isFetching || search !== debouncedSearch} />
        </Combobox.Input>

        <Combobox.List onScroll={handleScroll}>
          <Combobox.Empty when={!infiniteQuery.isFetching && allOptions.length === 0}>{t('noResults')}</Combobox.Empty>

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
                      <Checkbox checked={isChecked} tabIndex={-1} className="pointer-events-none" />
                    </Combobox.Indicator>
                  </Conditional.If>

                  <Conditional.Else>
                    <Combobox.Indicator>
                      <RadioGroup.Dot checked={isChecked} />
                    </Combobox.Indicator>
                  </Conditional.Else>
                </Conditional>

                {filterMeta.getOptionLabel(opt)}
              </Combobox.Item>
            );
          })}

          <Combobox.Loader when={infiniteQuery.isFetchingNextPage} message={t('loadingMore')} />
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}

export default AsyncSelectFilter;
