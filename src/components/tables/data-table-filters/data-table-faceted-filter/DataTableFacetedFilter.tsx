'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { AsyncSelectFilter, BooleanFilter, DateFilter, NumberRangeFilter, SelectFilter, TextFilter, TimeFilter } from '@components/tables';

import { isAsyncFilterMeta, type KitColumn } from '@utils';
import type { RowData } from '@tanstack/react-table';

type DataTableFacetedFilterProps<TData extends RowData> = {
  column: KitColumn<TData>;
};

function DataTableFacetedFilter<TData extends RowData>({ column }: DataTableFacetedFilterProps<TData>) {
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
