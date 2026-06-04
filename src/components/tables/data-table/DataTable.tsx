import { createContext, type PropsWithChildren, type ReactNode, useContext, useMemo } from 'react';

import type { Row, Table as TanstackTable } from '@tanstack/react-table';

import { DataTableContent, DataTablePagination, DataTableToolbar } from '@components/tables';

import { cn } from '@utils';

type DataTableRootProps<TData> = PropsWithChildren<{
  table: TanstackTable<TData>;
  className?: string;
  isLoading?: boolean;
  onRowClick?: (row: Row<TData>) => void;
  getRowClassName?: (row: Row<TData>) => string;
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
};

const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

export const useDataTableContext = <TData = unknown,>() => {
  const context = useContext(DataTableContext) as DataTableContextValue<TData> | null;

  if (!context) throw new Error('useDataTableContext must be used within a <DataTable /> provider');

  return context;
};

function DataTableRoot<TData>({ table, isLoading = false, onRowClick, getRowClassName, children, className }: DataTableRootProps<TData>) {
  const contextValue = useMemo<DataTableContextValue<unknown>>(
    () => ({
      table: table as TanstackTable<unknown>,
      isLoading,
      onRowClick: onRowClick as DataTableContextValue<unknown>['onRowClick'],
      getRowClassName: getRowClassName as DataTableContextValue<unknown>['getRowClassName'],
    }),
    [table, isLoading, onRowClick, getRowClassName],
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
