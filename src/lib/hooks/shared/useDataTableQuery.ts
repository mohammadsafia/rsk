import { useState } from 'react';

import { type QueryKey } from '@tanstack/query-core';
import type { ColumnFiltersState, OnChangeFn, PaginationState, Updater } from '@tanstack/react-table';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { type Options, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import type { AxiosRequestConfig } from 'axios';

import type { ExtendedSortingState, PaginatedResult } from '@app-types';

export type PaginatedDataTable<T extends Record<string, unknown>> = PaginatedResult<T>;

export type UseDataTableQueryProps<
  T extends Record<string, unknown>,
  TError = unknown,
  TData = T,
  TQueryKey extends QueryKey = QueryKey,
> = {
  queryFn: (params: AxiosRequestConfig['params']) => Promise<PaginatedDataTable<T>>;
  queryKey: string[];
  params?: AxiosRequestConfig['params'];
  queryOptions?: Omit<UseQueryOptions<T, TError, TData, TQueryKey>, 'queryKey' | 'queryFn' | 'initialData'> & {
    initialData?: () => undefined;
  };
  enabled?: boolean;
  persist?: boolean;
  defaultPageSize?: number;
  defaultFirstPage?: number;
  pageKey?: string;
  perPageKey?: string;
  globalFilterKey?: string;
  sortKey?: string;
  filterKey?: string;
  sortToParam?: (sortState: ExtendedSortingState<T>) => string;
  filtersToParam?: (state: ColumnFiltersState) => string;
};

const DEFAULTS = {
  pageKey: 'page',
  perPageKey: 'pageSize',
  globalFilterKey: 'search',
  sortKey: 'sort',
  filterKey: 'filter',
  defaultFirstPage: 1,
  defaultPageSize: 30,
  sortToParam: <T extends Record<string, unknown>>(sortState: ExtendedSortingState<T>) =>
    sortState.map((sort) => `${sort.id}:${sort.desc ? 'desc' : 'asc'}`).join(','),
  filtersToParam: (state: ColumnFiltersState) => {
    const queryParams = new URLSearchParams();
    state.forEach((filter) => {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        filter.value.forEach((val) => queryParams.append(filter.id, val));
      } else {
        queryParams.append(filter.id, filter.value as string);
      }
    });
    return queryParams.toString();
  },
};

const queryStateOptions: Options = {
  history: 'replace',
};

const serializeColumnFilters = (filters: ColumnFiltersState): string => {
  if (filters.length === 0) return '';

  return JSON.stringify(filters);
};

const deserializeColumnFilters = (serialized: string): ColumnFiltersState => {
  if (!serialized) return [];

  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
};

const serializeSorting = <T extends Record<string, unknown>>(sorting: ExtendedSortingState<T>): string => {
  if (sorting.length === 0) return '';

  return JSON.stringify(sorting);
};

const deserializeSorting = <T extends Record<string, unknown>>(serialized: string): ExtendedSortingState<T> => {
  if (!serialized) return [];

  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
};

export const useDataTableQuery = <T extends Record<string, unknown>>(props: UseDataTableQueryProps<T>) => {
  const {
    params,
    queryKey,
    queryFn,
    pageKey,
    sortKey,
    sortToParam,
    defaultPageSize,
    globalFilterKey,
    perPageKey,
    filtersToParam,
    enabled = true,
    persist = true,
  } = props;

  // URL-synced state (always called to satisfy rules of hooks)
  const [urlQuery, setUrlQuery] = useQueryStates({
    page: parseAsInteger.withOptions(queryStateOptions).withDefault(DEFAULTS.defaultFirstPage),
    perPage: parseAsInteger.withOptions(queryStateOptions).withDefault(defaultPageSize ?? DEFAULTS.defaultPageSize),
    globalFilter: parseAsString.withOptions(queryStateOptions).withDefault(''),
    columnFilters: parseAsString.withOptions(queryStateOptions).withDefault(''),
    sorting: parseAsString.withOptions(queryStateOptions).withDefault(''),
  });

  // Local state (always called to satisfy rules of hooks)
  const [localQuery, setLocalQuery] = useState({
    page: DEFAULTS.defaultFirstPage,
    perPage: defaultPageSize ?? DEFAULTS.defaultPageSize,
    globalFilter: '',
    columnFilters: '',
    sorting: '',
  });

  const query = persist ? urlQuery : localQuery;
  const setQuery = persist
    ? setUrlQuery
    : (updater: Parameters<typeof setUrlQuery>[0]) => {
        if (!updater) return;

        if (typeof updater === 'function') {
          setLocalQuery((prev) => {
            const partial = updater(prev);
            if (!partial) return prev;
            return {
              page: partial.page ?? prev.page,
              perPage: partial.perPage ?? prev.perPage,
              globalFilter: partial.globalFilter ?? prev.globalFilter,
              columnFilters: partial.columnFilters ?? prev.columnFilters,
              sorting: partial.sorting ?? prev.sorting,
            };
          });
        } else {
          setLocalQuery((prev) => ({
            page: updater.page ?? prev.page,
            perPage: updater.perPage ?? prev.perPage,
            globalFilter: updater.globalFilter ?? prev.globalFilter,
            columnFilters: updater.columnFilters ?? prev.columnFilters,
            sorting: updater.sorting ?? prev.sorting,
          }));
        }
      };

  // Derive state from query params
  const columnFilters = deserializeColumnFilters(query.columnFilters);
  const sorting = deserializeSorting<T>(query.sorting);

  const dataTableQuery = useQuery<PaginatedDataTable<T>, Error>({
    queryKey: [...queryKey, query.page, query.perPage, query.globalFilter, sorting, columnFilters],
    queryFn: async () => {
      const queryParams = new URLSearchParams(params);
      const pageNumber = query.page;

      if (query.globalFilter && query.globalFilter.length > 0) {
        queryParams.append(globalFilterKey ?? DEFAULTS.globalFilterKey, query.globalFilter);
      }

      const filters = (filtersToParam ?? DEFAULTS.filtersToParam)(columnFilters);

      if (filters) {
        const filterParams = new URLSearchParams(filters);
        filterParams.forEach((value, key) => {
          queryParams.append(key, value);
        });
      }

      const sorts = (sortToParam ?? DEFAULTS.sortToParam)(sorting);
      if (sorting.length > 0 && sorts) {
        queryParams.append(sortKey ?? DEFAULTS.sortKey, sorts ?? '');
      }

      queryParams.append(pageKey ?? DEFAULTS.pageKey, pageNumber.toString());
      queryParams.append(perPageKey ?? DEFAULTS.perPageKey, query.perPage.toString());

      return await queryFn(queryParams.toString());
    },
    enabled,
    keepPreviousData: true,
  });

  const setPagination: OnChangeFn<PaginationState> = (updater) => {
    if (typeof updater === 'function') {
      const newState = updater({ pageIndex: query.page, pageSize: query.perPage });
      setQuery((prev) => ({
        ...prev,
        page: newState.pageIndex,
        perPage: newState.pageSize,
      }));
    } else {
      setQuery((prev) => ({
        ...prev,
        page: updater.pageIndex,
        perPage: updater.pageSize,
      }));
    }
  };

  return {
    ...dataTableQuery,
    data: (dataTableQuery.data?.data ?? []) as T[],
    tableUtils: {
      totalCount: dataTableQuery.data?.pagination.total ?? 0,
      totalPages: dataTableQuery.data?.pagination.totalPages ?? 0,
      state: {
        sorting,
        columnFilters,
        globalFilter: query.globalFilter,
        pagination: { pageIndex: query.page - 1, pageSize: query.perPage },
      },

      setPagination,
      setGlobalFilter: (value: string) => setQuery((prev) => ({ ...prev, globalFilter: value || '' })),
      setSorting: (updater: Updater<ExtendedSortingState<T>>) => {
        const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
        setQuery((prev) => ({ ...prev, sorting: serializeSorting(newSorting) }));
      },
      setColumnFilters: (updater: Updater<ColumnFiltersState>) => {
        const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
        setQuery((prev) => ({ ...prev, columnFilters: serializeColumnFilters(newFilters) }));
      },
    },
  };
};
