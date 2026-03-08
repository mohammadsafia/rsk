import { type FC, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Input } from '@components/ui';
import { Conditional } from '@components/utils';
import { DataTableFacetedFilter, useDataTableContext } from '@components/tables';

import { useDebounce } from '@hooks/shared';

import { cn } from '@utils';

import { Minus, Plus, Search, X } from 'lucide-react';

type ToolbarProps = PropsWithChildren<{
  totalCount?: number;
  totalLabel?: string;
  className?: string;
  placeholder?: string;
}>;

const DataTableToolbar: FC<ToolbarProps> = ({ totalCount, totalLabel, placeholder, children, className }) => {
  const { table } = useDataTableContext();

  const [search, setSearch] = useState(table.getState().globalFilter ?? '');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filterableColumns = useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter() && column.columnDef.meta?.filterMeta),
    [table],
  );

  const activeFilterCount = useMemo(() => table.getState().columnFilters.length, [table.getState().columnFilters?.length]);

  const isFiltered = activeFilterCount > 0;

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
    setSearch('');
  }, [table]);

  useEffect(() => {
    table.setGlobalFilter(debouncedSearch);
  }, [debouncedSearch, table]);

  return (
    <div data-slot="data-table-toolbar" className={cn('flex w-full flex-col rounded-2xl shadow', className)}>
      <div className={cn('bg-surface flex items-stretch gap-6 rounded-2xl pl-6 transition-all', showFilters && 'rounded-bl-none')}>
        <div className="flex flex-1 items-center py-2">
          <Conditional.If condition={totalCount !== undefined}>
            <span className="text-muted-400 text-xs font-medium whitespace-nowrap">
              Total: {totalCount} {totalLabel}
            </span>
          </Conditional.If>
        </div>

        <Conditional.If condition={!!table?.options?.enableGlobalFilter}>
          <div className="flex items-center gap-2 py-3">
            <Search className="text-muted-400 size-6 shrink-0" />

            <Input
              name="data-table-search"
              placeholder={placeholder ?? 'Search Here'}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-auto w-40 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </Conditional.If>

        {children}

        <Conditional.If condition={filterableColumns.length > 0}>
          <button
            type="button"
            className={cn(
              'border-muted-200 relative flex cursor-pointer items-center gap-2 border-l px-6 text-sm font-normal',
              'rounded-tr-2xl',
              showFilters ? 'bg-primary-25' : 'rounded-br-2xl',
            )}
            onClick={handleToggleFilters}
          >
            <Conditional>
              <Conditional.If condition={showFilters}>
                <Minus className="text-primary-900 size-5" />
              </Conditional.If>

              <Conditional.Else>
                <Plus className="text-primary-900 size-5" />
              </Conditional.Else>
            </Conditional>
            Filter
            <span className={cn('bg-secondary invisible absolute top-2.5 right-3.5 size-3 rounded-full', isFiltered && 'visible')} />
          </button>
        </Conditional.If>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          showFilters && filterableColumns.length > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            role="toolbar"
            aria-orientation="horizontal"
            aria-label="Filters"
            className="bg-primary-25 flex items-center gap-6 rounded-b-2xl px-3 py-2"
          >
            <div className="flex flex-1 flex-wrap items-center gap-1">
              {filterableColumns.map((column) => (
                <DataTableFacetedFilter key={column.id} column={column} />
              ))}
            </div>

            <Conditional.If condition={isFiltered}>
              <Button
                aria-label="Clear all filters"
                variant="ghost"
                size="sm"
                className="text-error-500 hover:bg-error-50 hover:text-error-600 h-8 shrink-0 gap-1 px-3 text-xs font-medium"
                onClick={handleReset}
              >
                <X className="h-3 w-3" />
                Clear All
              </Button>
            </Conditional.If>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTableToolbar;
