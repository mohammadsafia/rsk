'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  type ColumnSort,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableState,
  type Updater,
  type ColumnVisibilityState,
  useTable,
} from '@tanstack/react-table';

import { parseAsInteger, useQueryState, type UseQueryStateOptions } from 'nuqs';

import { getSortingStateParser, kitFeatures, type KitFeatures, type KitTableOptions } from '@utils';

const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'pageSize';
const SORT_KEY = 'sort';
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

type UseDataTableProps<TData extends Record<string, unknown>> = Omit<
  KitTableOptions<TData>,
  | 'features'
  | 'initialState'
  | 'pageCount'
  | 'getCoreRowModel'
  | 'manualFiltering'
  | 'manualPagination'
  | 'manualSorting'
  | 'onSortingChange'
> &
  Required<Pick<KitTableOptions<TData>, 'pageCount'>> & {
    initialState?: Omit<Partial<TableState<KitFeatures>>, 'sorting'> & {
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
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(initialState?.columnVisibility ?? {});

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
    getSortingStateParser<TData>(columnIds)
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

  const table = useTable({
    features: kitFeatures,
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
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return { table };
};
