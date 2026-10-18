import {
  type Cell,
  type Column,
  type ColumnDef,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  type FilterFn,
  filterFn_equals,
  filterFn_includesString,
  type Header,
  type ReactTable,
  type Row,
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  type Table,
  tableFeatures,
  type TableOptions,
} from '@tanstack/react-table';

/**
 * The feature set every kit table uses (TanStack Table v9): only the features the kit's tables and filters use, so the
 * rest (grouping, expanding, resizing, cell selection, …) is tree-shaken away, plus the row models they read. Pass it as
 * `useTable({ features: kitFeatures, … })`; the kit's components and types assume it.
 */
export const kitFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnPinningFeature,
  // getIsFirstColumn / getIsLastColumn (the pinned edge shadows) come from column ordering.
  columnOrderingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  columnFacetingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  // The built-in filters the kit refers to by name ('equals' on a column, 'includesString' as the global search).
  filterFns: { equals: filterFn_equals, includesString: filterFn_includesString },
  // The default (auto) sort picks one of these by name — datetime for dates, alphanumeric or text for strings — so they
  // must be registered, or v9 falls back to a basic compare (uppercase first, "Item 10" before "Item 2").
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    alphanumericCaseSensitive: sortFn_alphanumericCaseSensitive,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
    textCaseSensitive: sortFn_textCaseSensitive,
  },
});

export type KitFeatures = typeof kitFeatures;

/** v9 table types bound to the kit's feature set, so callers write `KitColumnDef<Row>` as they wrote `ColumnDef<Row>`. */
export type KitColumnDef<TData extends object, TValue = unknown> = ColumnDef<KitFeatures, TData, TValue>;
export type KitColumn<TData extends object, TValue = unknown> = Column<KitFeatures, TData, TValue>;
export type KitRow<TData extends object> = Row<KitFeatures, TData>;
export type KitCell<TData extends object, TValue = unknown> = Cell<KitFeatures, TData, TValue>;
export type KitHeader<TData extends object, TValue = unknown> = Header<KitFeatures, TData, TValue>;
/** The table `useTable` returns (it carries `.state` for render reads); the kit's components take this one. */
export type KitTable<TData extends object> = ReactTable<KitFeatures, TData>;
/** The core table (inside cells and column defs: `row.table`, `column.table`). */
export type KitCoreTable<TData extends object> = Table<KitFeatures, TData>;
export type KitFilterFn<TData extends object> = FilterFn<KitFeatures, TData>;
export type KitTableOptions<TData extends object> = TableOptions<KitFeatures, TData>;
