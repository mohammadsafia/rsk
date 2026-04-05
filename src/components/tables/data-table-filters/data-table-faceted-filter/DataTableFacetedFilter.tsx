import type { Column } from '@tanstack/react-table';

import { AsyncSelectFilter, SelectFilter } from '@components/tables';

import { isAsyncFilterMeta } from '@utils';

type DataTableFacetedFilterProps<TData> = {
  column: Column<TData>;
};

function DataTableFacetedFilter<TData>({ column }: DataTableFacetedFilterProps<TData>) {
  const filterMeta = column.columnDef.meta?.filterMeta;

  if (!filterMeta) return null;

  if (isAsyncFilterMeta(filterMeta)) return <AsyncSelectFilter column={column} filterMeta={filterMeta} />;

  return <SelectFilter column={column} filterMeta={filterMeta} />;
}

export default DataTableFacetedFilter;
