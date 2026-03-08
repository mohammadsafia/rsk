import React, { useCallback, useMemo, useState } from 'react';

import {
  type ColumnSort,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';

import { parseAsInteger, useQueryState, type UseQueryStateOptions } from 'nuqs';

import { getSortingStateParser } from '@utils';

const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'pageSize';
const SORT_KEY = 'sort';
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

type UseDataTableProps<TData extends Record<string, unknown>> = Omit<
  TableOptions<TData>,
  'initialState' | 'pageCount' | 'getCoreRowModel' | 'manualFiltering' | 'manualPagination' | 'manualSorting' | 'onSortingChange'
> &
  Required<Pick<TableOptions<TData>, 'pageCount'>> & {
  initialState?: Omit<Partial<TableState>, 'sorting'> & {
    sorting?: ColumnSort[];
  };
  history?: 'push' | 'replace';
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  shallow?: boolean;
  scroll?: boolean;
  startTransition?: React.TransitionStartFunction;
  onSortingChange?: (updaterOrValue: Updater<ColumnSort[]>) => void;
};

export const useDataTable = <TData extends Record<string, unknown>>(props: UseDataTableProps<TData>) => {
  const {
    columns,
    pageCount = -1,
    initialState,
    history = 'replace',
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    shallow = true,
    scroll = false,
    startTransition,
    ...tableProps
  } = props;

  const queryStateOptions = useMemo<Omit<UseQueryStateOptions<string>, 'parse'>>(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [history, scroll, shallow, throttleMs, debounceMs, clearOnDefault, startTransition],
  );

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialState?.rowSelection ?? {});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialState?.columnVisibility ?? {});

  // URL-synced pagination
  const [page, setPage] = useQueryState(PAGE_KEY, parseAsInteger.withOptions(queryStateOptions).withDefault(1));
  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(initialState?.pagination?.pageSize ?? 10),
  );

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: perPage,
    }),
    [page, perPage],
  );

  // URL-synced sorting
  const columnIds = useMemo(() => {
    return new Set(columns.map((column) => column.id).filter(Boolean) as string[]);
  }, [columns]);

  const onPaginationChange = useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === 'function') {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage],
  );

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? []),
  );

  const onSortingChange = useCallback(
    (updaterOrValue: Updater<ColumnSort[]>) => {
      if (typeof updaterOrValue === 'function') {
        const newSorting = updaterOrValue(sorting);
        void setSorting(newSorting);
      } else {
        void setSorting(updaterOrValue);
      }
    },
    [sorting, setSorting],
  ) as OnChangeFn<SortingState>;

  const table = useReactTable({
    enableGlobalFilter: true,
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: {
      columnVisibility,
      rowSelection,
      ...tableProps.state,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return { table };
};
