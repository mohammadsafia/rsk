'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { type PropsWithChildren, type ReactNode, useMemo, useState } from 'react';

import DataTableContent from './data-table-content/DataTableContent';
import DataTablePagination from './data-table-pagination/DataTablePagination';
import DataTableToolbar from './data-table-toolbar/DataTableToolbar';
import DataTableBulkActions from './data-table-selection/DataTableBulkActions';
import { DataTableContext, type DataTableContextValue } from './DataTableContext';

import { cn, type KitRow, type KitTable } from '@utils';
import type { RowData } from '@tanstack/react-table';

type DataTableRootProps<TData extends RowData> = PropsWithChildren<{
  table: KitTable<TData>;
  className?: string;
  isLoading?: boolean;
  onRowClick?: (row: KitRow<TData>) => void;
  getRowClassName?: (row: KitRow<TData>) => string;
  /** Clears filters, search and any persisted copy (from `useDataTableFilters().reset`). */
  onResetFilters?: () => void;
}>;

type DataTableComponents = (<TData extends RowData>(props: DataTableRootProps<TData>) => ReactNode) & {
  Toolbar: typeof DataTableToolbar;
  Content: typeof DataTableContent;
  Pagination: typeof DataTablePagination;
  BulkActions: typeof DataTableBulkActions;
};

export { useDataTableContext } from './DataTableContext';

function DataTableRoot<TData extends RowData>({
  table,
  isLoading = false,
  onRowClick,
  getRowClassName,
  onResetFilters,
  children,
  className,
}: DataTableRootProps<TData>) {
  const [bulkActionsMounted, setBulkActionsMounted] = useState(false);

  const contextValue = useMemo<DataTableContextValue<RowData>>(
    () => ({
      table: table as KitTable<RowData>,
      isLoading,
      onRowClick: onRowClick as DataTableContextValue<RowData>['onRowClick'],
      getRowClassName: getRowClassName as DataTableContextValue<RowData>['getRowClassName'],
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
