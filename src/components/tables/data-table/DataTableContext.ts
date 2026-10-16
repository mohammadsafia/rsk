import { createContext, useContext } from 'react';

import type { Row, Table as TanstackTable } from '@tanstack/react-table';

// Own module so parts (e.g. BulkActions) can read the context without importing DataTable, which imports them.
export type DataTableContextValue<TData> = {
  table: TanstackTable<TData>;
  isLoading: boolean;
  onRowClick?: (row: Row<TData>) => void;
  getRowClassName?: (row: Row<TData>) => string;
  onResetFilters?: () => void;
  bulkActionsMounted: boolean;
  setBulkActionsMounted: (mounted: boolean) => void;
};

export const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

export const useDataTableContext = <TData = unknown>() => {
  const context = useContext(DataTableContext) as DataTableContextValue<TData> | null;

  if (!context) throw new Error('useDataTableContext must be used within a <DataTable /> provider');

  return context;
};
