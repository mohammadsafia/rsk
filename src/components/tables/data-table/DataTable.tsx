import { createContext, type PropsWithChildren, type ReactNode, useContext, useMemo } from 'react';

import type { Table as TanstackTable } from '@tanstack/react-table';

import { DataTableContent, DataTablePagination, DataTableToolbar } from '@components/tables';

import { cn } from '@utils';

type DataTableRootProps<TData> = PropsWithChildren<{
  table: TanstackTable<TData>;
  className?: string;
  isLoading?: boolean;
  emptyState?: { title?: string; description?: string };
}>;

type DataTableComponents = (<TData>(props: DataTableRootProps<TData>) => ReactNode) & {
  Toolbar: typeof DataTableToolbar;
  Content: typeof DataTableContent;
  Pagination: typeof DataTablePagination;
};

type DataTableContextValue<TData> = {
  table: TanstackTable<TData>;
  isLoading: boolean;
};

const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

export const useDataTableContext = <TData = unknown,>() => {
  const context = useContext(DataTableContext) as DataTableContextValue<TData> | null;

  if (!context) throw new Error('useDataTableContext must be used within a <DataTable /> provider');

  return context;
};

function DataTableRoot<TData>({ table, isLoading = false, children, className }: DataTableRootProps<TData>) {
  const contextValue = useMemo<DataTableContextValue<unknown>>(
    () => ({
      table: table as TanstackTable<unknown>,
      isLoading,
    }),
    [table, isLoading],
  );

  return (
    <DataTableContext.Provider value={contextValue}>
      <div data-slot="data-table" className={cn('flex h-full w-full flex-col gap-3', className)}>
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
