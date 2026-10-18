// TanStack Table v8 hands out one mutable table object, so compiled memoization would render stale rows;
// opted out of the React Compiler until Table 9 (compiler-compatible).
'use no memo';

import { type PropsWithChildren, type ReactNode, useMemo, useState } from 'react';

import type { Row, Table as TanstackTable } from '@tanstack/react-table';

import DataTableContent from './data-table-content/DataTableContent';
import DataTablePagination from './data-table-pagination/DataTablePagination';
import DataTableToolbar from './data-table-toolbar/DataTableToolbar';
import DataTableBulkActions from './data-table-selection/DataTableBulkActions';
import { DataTableContext, type DataTableContextValue } from './DataTableContext';

import { cn } from '@utils';

type DataTableRootProps<TData> = PropsWithChildren<{
  table: TanstackTable<TData>;
  className?: string;
  isLoading?: boolean;
  onRowClick?: (row: Row<TData>) => void;
  getRowClassName?: (row: Row<TData>) => string;
  /** Clears filters, search and any persisted copy (from `useDataTableFilters().reset`). */
  onResetFilters?: () => void;
}>;

type DataTableComponents = (<TData>(props: DataTableRootProps<TData>) => ReactNode) & {
  Toolbar: typeof DataTableToolbar;
  Content: typeof DataTableContent;
  Pagination: typeof DataTablePagination;
  BulkActions: typeof DataTableBulkActions;
};

export { useDataTableContext } from './DataTableContext';

function DataTableRoot<TData>({
  table,
  isLoading = false,
  onRowClick,
  getRowClassName,
  onResetFilters,
  children,
  className,
}: DataTableRootProps<TData>) {
  const [bulkActionsMounted, setBulkActionsMounted] = useState(false);

  const contextValue = useMemo<DataTableContextValue<unknown>>(
    () => ({
      table: table as TanstackTable<unknown>,
      isLoading,
      onRowClick: onRowClick as DataTableContextValue<unknown>['onRowClick'],
      getRowClassName: getRowClassName as DataTableContextValue<unknown>['getRowClassName'],
      onResetFilters,
      bulkActionsMounted,
      setBulkActionsMounted,
    }),
    [table, isLoading, onRowClick, getRowClassName, onResetFilters, bulkActionsMounted],
  );

  return (
    <DataTableContext.Provider value={contextValue}>
      <div data-slot="data-table" className={cn('flex h-full min-h-0 w-full flex-col gap-3', className)}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

const DataTable = DataTableRoot as DataTableComponents;

DataTable.Toolbar = DataTableToolbar;
DataTable.Content = DataTableContent;
DataTable.Pagination = DataTablePagination;
DataTable.BulkActions = DataTableBulkActions;

export default DataTable;
