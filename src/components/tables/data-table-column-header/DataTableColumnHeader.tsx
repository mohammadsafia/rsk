import { useCallback } from 'react';

import type { Column } from '@tanstack/react-table';

import { cn } from '@utils';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort();
  const sortDirection = column.getIsSorted();

  const handleSort = useCallback(() => {
    if (!canSort) return;

    if (!sortDirection) {
      column.toggleSorting(false);
    } else if (sortDirection === 'asc') {
      column.toggleSorting(true);
    } else {
      column.clearSorting();
    }
  }, [canSort, sortDirection, column]);

  if (!canSort) return <div className={cn(className)}>{title}</div>;

  return (
    <button
      type="button"
      onClick={handleSort}
      className={cn('flex cursor-pointer items-center gap-1 text-xs font-bold focus:outline-none', className)}
    >
      {title}

      {sortDirection === 'asc' ? (
        <ArrowUp className="size-3.5" />
      ) : sortDirection === 'desc' ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="text-muted-foreground size-3.5" />
      )}
    </button>
  );
}

export default DataTableColumnHeader;
