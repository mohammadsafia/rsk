import type { Column } from '@tanstack/react-table';

import { AsyncSelectFilter, DateFilter, SelectFilter, TimeFilter } from '@components/tables';

import { isAsyncFilterMeta } from '@utils';

type DataTableFacetedFilterProps<TData> = {
  column: Column<TData>;
};

function DataTableFacetedFilter<TData>({ column }: DataTableFacetedFilterProps<TData>) {
  const filterMeta = column.columnDef.meta?.filterMeta;

  if (!filterMeta) return null;

  switch (filterMeta.variant) {
    case 'date':
    case 'dateRange':
      return <DateFilter column={column} filterMeta={filterMeta} />;

    case 'time':
      return <TimeFilter column={column} filterMeta={filterMeta} />;

    default:
      if (isAsyncFilterMeta(filterMeta)) return <AsyncSelectFilter column={column} filterMeta={filterMeta} />;

      return <SelectFilter column={column} filterMeta={filterMeta} />;
  }
}

export default DataTableFacetedFilter;
