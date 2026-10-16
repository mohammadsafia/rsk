import { createContext, type PropsWithChildren, type ReactNode, useContext, useMemo } from 'react';

import type { Row, Table as TanstackTable } from '@tanstack/react-table';

import DataTableContent from './data-table-content/DataTableContent';
import DataTablePagination from './data-table-pagination/DataTablePagination';
import DataTableToolbar from './data-table-toolbar/DataTableToolbar';

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
};

type DataTableContextValue<TData> = {
  table: TanstackTable<TData>;
  isLoading: boolean;
  onRowClick?: (row: Row<TData>) => void;
  getRowClassName?: (row: Row<TData>) => string;
  onResetFilters?: () => void;
};

const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

export const useDataTableContext = <TData = unknown,>() => {
  const context = useContext(DataTableContext) as DataTableContextValue<TData> | null;

  if (!context) throw new Error('useDataTableContext must be used within a <DataTable /> provider');

  return context;
};

function DataTableRoot<TData>({
  table,
  isLoading = false,
  onRowClick,
  getRowClassName,
  onResetFilters,
  children,
  className,
}: DataTableRootProps<TData>) {
  const contextValue = useMemo<DataTableContextValue<unknown>>(
    () => ({
      table: table as TanstackTable<unknown>,
      isLoading,
      onRowClick: onRowClick as DataTableContextValue<unknown>['onRowClick'],
      getRowClassName: getRowClassName as DataTableContextValue<unknown>['getRowClassName'],
      onResetFilters,
    }),
    [table, isLoading, onRowClick, getRowClassName, onResetFilters],
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

export default DataTable;
