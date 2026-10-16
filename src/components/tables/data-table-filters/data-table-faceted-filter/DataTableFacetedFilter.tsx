import type { Column } from '@tanstack/react-table';

import { AsyncSelectFilter, BooleanFilter, DateFilter, NumberRangeFilter, SelectFilter, TextFilter, TimeFilter } from '@components/tables';

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

    case 'select':
    case 'multiSelect':
      if (isAsyncFilterMeta(filterMeta)) return <AsyncSelectFilter column={column} filterMeta={filterMeta} />;

      return <SelectFilter column={column} filterMeta={filterMeta} />;

    case 'boolean':
      return <BooleanFilter column={column} filterMeta={filterMeta} />;

    case 'text':
      return <TextFilter column={column} filterMeta={filterMeta} />;

    case 'numberRange':
      return <NumberRangeFilter column={column} filterMeta={filterMeta} />;

    default:
      return null;
  }
}

export default DataTableFacetedFilter;
