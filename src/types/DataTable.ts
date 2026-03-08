import '@tanstack/react-table';

import type { RowData, ColumnSort } from '@tanstack/react-table';

import type { AsyncOptionsFn } from '@hooks/shared';

export type Pagination = {
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;
};

export type ExtendedSortingState<TData extends Record<string, unknown>> = Array<
  Omit<ColumnSort, 'id'> & { id: Extract<keyof TData, string> }
>;

export type PaginatedResult<T> = {
  data: T[];
  pagination: Pagination;
};

type FilterMetaBase = {
  label: string;
  placeholder?: string;
  queryKey?: string;
  urlSearchParams?: URLSearchParams | string;
};

type FilterConfig = FilterMetaBase & {
  options: Record<string, unknown>[] | AsyncOptionsFn<Record<string, unknown>>;
  getOptionLabel: (option: Record<string, unknown>) => string;
  getOptionValue: (option: Record<string, unknown>) => string;
};

type FilterMetalVariant = 'select' | 'multiSelect';

export type DataTableFilterMeta = { variant: FilterMetalVariant } & FilterConfig;

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    filterMeta?: DataTableFilterMeta;
  }
}
