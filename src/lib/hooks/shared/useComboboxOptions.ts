import { useState } from 'react';

import { type AsyncOptionsFn, useAsyncOptionsInfiniteQuery } from './useAsyncOptionsInfiniteQuery';
import { useDebounce } from './useDebounce';
import { useInfiniteScroll } from './useInfiniteScroll';

export type UrlSearchParamsInput = URLSearchParams | string | Record<string, string | string[] | undefined>;

export type ComboboxOptionsParams<TOption> = {
  options: TOption[] | AsyncOptionsFn<TOption>;
  open: boolean;
  queryKey?: string;
  urlSearchParams?: UrlSearchParamsInput;
  selectedItemsIds?: string[];
};

const PAGE_SIZE = 20;
const DEFAULT_QUERY_KEY = 'combobox-options';

const toURLSearchParams = (input: UrlSearchParamsInput | undefined): URLSearchParams | string | undefined => {
  if (!input) return undefined;
  if (input instanceof URLSearchParams || typeof input === 'string') return input;

  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.append(key, value);
  });

  return params;
};

export function useComboboxOptions<TOption>({
  options,
  open,
  queryKey = DEFAULT_QUERY_KEY,
  urlSearchParams,
  selectedItemsIds,
}: ComboboxOptionsParams<TOption>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const isAsync = typeof options === 'function';

  const infiniteQuery = useAsyncOptionsInfiniteQuery({
    queryKey,
    fetchOptions: isAsync
      ? (options as AsyncOptionsFn<TOption>)
      : () => Promise.resolve({ data: [] as TOption[], pagination: { page: 1, total: 0, totalPages: 0, pageSize: PAGE_SIZE } }),
    searchTerm: debouncedSearch,
    selectedItemsIds,
    urlSearchParams: toURLSearchParams(urlSearchParams),
    pageSize: PAGE_SIZE,
    enabled: isAsync && open,
  });

  const { handleScroll } = useInfiniteScroll({ infiniteQuery, enabled: isAsync });

  const allOptions = isAsync ? (infiniteQuery.data?.pages.flatMap((p) => p.data) ?? []) : (options as TOption[]);

  return {
    search,
    setSearch,
    allOptions,
    isAsync,
    onScroll: isAsync ? handleScroll : undefined,
    isLoading: isAsync && (infiniteQuery.isFetching || search !== debouncedSearch),
    isFetchingNextPage: isAsync && infiniteQuery.isFetchingNextPage,
  };
}
