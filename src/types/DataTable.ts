import '@tanstack/react-table';

import type { RowData, ColumnSort } from '@tanstack/react-table';

import type { AsyncOptionsFn } from '@hooks/shared';

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPage: number;
}

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
    disableRowClick?: boolean;
    // TODO: this will be removed after the migration to the new component
    autoComplete?: {
      queryKey: string[];
      request: (params: string) => Promise<PaginatedResult<unknown>>;
      optionValue: (option: unknown) => string;
      optionLabel: (option: unknown) => string;
    };
  }
}
