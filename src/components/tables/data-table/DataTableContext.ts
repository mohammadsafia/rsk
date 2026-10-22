'use client';

import { createContext, useContext } from 'react';
import type { RowData } from '@tanstack/react-table';
import { type KitRow, type KitTable } from '@utils';

// Own module so parts (e.g. BulkActions) can read the context without importing DataTable, which imports them.
export type DataTableContextValue<TData extends RowData> = {
  table: KitTable<TData>;
  isLoading: boolean;
  onRowClick?: (row: KitRow<TData>) => void;
  getRowClassName?: (row: KitRow<TData>) => string;
  onResetFilters?: () => void;
  bulkActionsMounted: boolean;
  setBulkActionsMounted: (mounted: boolean) => void;
};

export const DataTableContext = createContext<DataTableContextValue<RowData> | null>(null);

export const useDataTableContext = <TData extends RowData = RowData>() => {
  const context = useContext(DataTableContext) as DataTableContextValue<TData> | null;

  if (!context) throw new Error('useDataTableContext must be used within a <DataTable /> provider');

  return context;
};
