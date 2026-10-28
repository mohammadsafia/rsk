// What useDataTableQuery reads from the URL, the cache key it stores a page under, and the query string it asks the
// API with. Pure and server-safe, so a server-rendering app can prefetch the exact page the table is about to read.
import type { QueryKey } from '@tanstack/query-core';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { type Options, parseAsInteger, parseAsString } from 'nuqs/server';
import type { AxiosRequestConfig } from 'axios';

import type { ExtendedSortingState } from '@app-types';

/** The table's state as it sits in the URL: page numbers from 1, filters and sorting as JSON. */
export type DataTableQueryState = { page: number; perPage: number; globalFilter: string; columnFilters: string; sorting: string };

export type DataTableRequestOptions<T extends Record<string, unknown>> = {
  params?: AxiosRequestConfig['params'];
  pageKey?: string;
  perPageKey?: string;
  globalFilterKey?: string;
  sortKey?: string;
  sortToParam?: (sortState: ExtendedSortingState<T>) => string;
  filtersToParam?: (state: ColumnFiltersState) => string;
};

export const DATA_TABLE_DEFAULTS = {
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

/** The URL parsers for the table's state (nuqs: useQueryStates in the browser, createLoader on the server). */
export const dataTableSearchParams = (defaultPageSize?: number) => ({
  page: parseAsInteger.withOptions(queryStateOptions).withDefault(DATA_TABLE_DEFAULTS.defaultFirstPage),
  perPage: parseAsInteger.withOptions(queryStateOptions).withDefault(defaultPageSize ?? DATA_TABLE_DEFAULTS.defaultPageSize),
  globalFilter: parseAsString.withOptions(queryStateOptions).withDefault(''),
  columnFilters: parseAsString.withOptions(queryStateOptions).withDefault(''),
  sorting: parseAsString.withOptions(queryStateOptions).withDefault(''),
});

export const deserializeColumnFilters = (serialized: string): ColumnFiltersState => {
  if (!serialized) return [];

  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
};

export const deserializeSorting = <T extends Record<string, unknown>>(serialized: string): ExtendedSortingState<T> => {
  if (!serialized) return [];

  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
};

/** The cache key a page of the table lives under. */
export const dataTableQueryKey = (queryKey: readonly unknown[], state: DataTableQueryState): QueryKey => [
  ...queryKey,
  state.page,
  state.perPage,
  state.globalFilter,
  deserializeSorting(state.sorting),
  deserializeColumnFilters(state.columnFilters),
];

/** The query string a page of the table asks the API for. */
export function dataTableRequestParams<T extends Record<string, unknown>>(
  state: DataTableQueryState,
  { params, pageKey, perPageKey, globalFilterKey, sortKey, sortToParam, filtersToParam }: DataTableRequestOptions<T> = {},
): string {
  const queryParams = new URLSearchParams(params);

  if (state.globalFilter && state.globalFilter.length > 0) {
    queryParams.append(globalFilterKey ?? DATA_TABLE_DEFAULTS.globalFilterKey, state.globalFilter);
  }

  const filters = (filtersToParam ?? DATA_TABLE_DEFAULTS.filtersToParam)(deserializeColumnFilters(state.columnFilters));

  if (filters) {
    const filterParams = new URLSearchParams(filters);
    filterParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
  }

  const sorting = deserializeSorting<T>(state.sorting);
  const sorts = (sortToParam ?? DATA_TABLE_DEFAULTS.sortToParam)(sorting);
  if (sorting.length > 0 && sorts) {
    queryParams.append(sortKey ?? DATA_TABLE_DEFAULTS.sortKey, sorts ?? '');
  }

  queryParams.append(pageKey ?? DATA_TABLE_DEFAULTS.pageKey, state.page.toString());
  queryParams.append(perPageKey ?? DATA_TABLE_DEFAULTS.perPageKey, state.perPage.toString());

  return queryParams.toString();
}
