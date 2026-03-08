import type { Column } from '@tanstack/react-table';

import { AsyncMultiSelectFilter, AsyncSingleSelectFilter, ListFilter } from '@components/tables';

import { isAsyncFilterMeta } from '@utils';

type DataTableFacetedFilterProps<TData> = {
  column: Column<TData>;
};

function DataTableFacetedFilter<TData>({ column }: DataTableFacetedFilterProps<TData>) {
  const filterMeta = column.columnDef.meta?.filterMeta;

  if (!filterMeta) return null;

  if (isAsyncFilterMeta(filterMeta) && filterMeta.variant === 'multiSelect') {
    return <AsyncMultiSelectFilter column={column} filterMeta={filterMeta} />;
  }

  if (isAsyncFilterMeta(filterMeta) && filterMeta.variant === 'select') {
    return <AsyncSingleSelectFilter column={column} filterMeta={filterMeta} />;
  }

  return <ListFilter column={column} filterMeta={filterMeta} />;
}

export default DataTableFacetedFilter;
