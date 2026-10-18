import '@tanstack/react-table';

import type { CellData, ColumnSort, RowData, TableFeatures } from '@tanstack/react-table';

import type { AsyncOptionsFn, DateFormat } from '@hooks/shared';

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPage: number;
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

/** Static or async option-driven filter (single `select` or `multiSelect`). */
export type SelectFilterMeta = FilterMetaBase & {
  variant: 'select' | 'multiSelect';
  options: Record<string, unknown>[] | AsyncOptionsFn<Record<string, unknown>>;
  getOptionLabel: (option: Record<string, unknown>) => string;
  getOptionValue: (option: Record<string, unknown>) => string;
};

/** Calendar-driven filter — a single day (`date`) or an inclusive `[from, to]` range (`dateRange`). */
export type DateFilterMeta = FilterMetaBase & {
  variant: 'date' | 'dateRange';
  /** Display format for the active-value chip. Defaults to `DateFormats.SHORT_MONTH_DAY_YEAR`. */
  dateFormat?: DateFormat;
};

/** Time-of-day filter backed by the shared `TimePicker`. */
export type TimeFilterMeta = FilterMetaBase & {
  variant: 'time';
  use24hFormat?: boolean;
  /** Time-picker bounds, e.g. `'08:00 AM'` / `'23:59'`. */
  min?: string;
  max?: string;
  step?: number;
};

/** Yes / No filter; clearing it means "Any". */
export type BooleanFilterMeta = FilterMetaBase & {
  variant: 'boolean';
  /** @default t('common:yes') */
  trueLabel?: string;
  /** @default t('common:no') */
  falseLabel?: string;
};

/** Case- and diacritic-insensitive "contains" text filter. */
export type TextFilterMeta = FilterMetaBase & { variant: 'text' };

/** Inclusive numeric range; either end may be open. */
export type NumberRangeFilterMeta = FilterMetaBase & {
  variant: 'numberRange';
  /** Formats the pill summary. @default 'decimal' */
  format?: 'decimal' | 'currency' | 'percent';
  min?: number;
  max?: number;
};

export type DataTableFilterMeta =
  | SelectFilterMeta
  | DateFilterMeta
  | TimeFilterMeta
  | BooleanFilterMeta
  | TextFilterMeta
  | NumberRangeFilterMeta;

/** Column filter value for the `numberRange` variant. */
export type NumberRangeFilterValue = { min?: number; max?: number };

/** Column filter value for the `dateRange` variant (ISO `yyyy-MM-dd` strings). */
export type DateRangeFilterValue = { from?: string; to?: string };

declare module '@tanstack/table-core' {
  // oxlint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    label?: string;
    /** Right-align (end-align) and use tabular figures for this column. */
    numeric?: boolean;
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
