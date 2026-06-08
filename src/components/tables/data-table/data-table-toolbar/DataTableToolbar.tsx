import { type FC, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Input } from '@components/ui';
import { Conditional } from '@components/utils';
import { DataTableFacetedFilter, useDataTableContext } from '@components/tables';

import { useDebounce } from '@hooks/shared';

import { cn } from '@utils';

import { Minus, Plus, Search } from 'lucide-react';

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

  const debouncedSearch = useDebounce(search, 500);

  const filterableColumns = useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter() && column.columnDef.meta?.filterMeta),
    [table],
  );

  const activeFilterCount = useMemo(() => table.getState().columnFilters.length, [table.getState().columnFilters?.length]);

  const isFiltered = activeFilterCount > 0;

  const onToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const onReset = useCallback(() => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
    setSearch('');
  }, [table]);

  useEffect(() => {
    table.setGlobalFilter(debouncedSearch);
  }, [debouncedSearch, table]);

  return (
    <div data-slot="data-table-toolbar" className={cn('flex w-full flex-col rounded-2xl shadow', className)}>
      <div className={cn('bg-background flex items-stretch gap-6 rounded-2xl ps-6 transition-all', showFilters && 'rounded-es-none')}>
        <div className="flex flex-1 items-center py-3">
          <Conditional.If condition={totalCount !== undefined}>
            <span className="text-muted-400 text-xs font-medium whitespace-nowrap">
              Total: {totalCount} {totalLabel}
            </span>
          </Conditional.If>
        </div>

        <Conditional.If condition={!!table?.options?.enableGlobalFilter}>
          <div className="flex items-center py-3">
            <Search size={16} className="text-primary" />

            <Input
              name="data-table-search"
              placeholder={placeholder ?? 'Search Here'}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-60 border-none px-2 py-0 text-sm shadow-none [&:hover,&:focus]:not-disabled:border-none [&:hover,&:focus]:not-disabled:ring-0 bg-transparent"
            />
          </div>
        </Conditional.If>

        {children}

        <Conditional.If condition={filterableColumns.length > 0}>
          <button
            type="button"
            className={cn(
              'border-muted-200 text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-se-2xl border-s px-6 text-sm font-normal',
              showFilters ? 'bg-primary-25' : 'rounded-ee-2xl',
            )}
            onClick={onToggleFilters}
          >
            <Conditional>
              <Conditional.If condition={showFilters}>
                <Minus size={16} />
              </Conditional.If>

              <Conditional.Else>
                <Plus size={16} />
              </Conditional.Else>
            </Conditional>
            Filter
            <span className={cn('bg-primary invisible absolute inset-e-3.5 inset-bs-2.5 size-2 rounded-full', isFiltered && 'visible')} />
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
              <Button variant="ghost-primary" size="xs" aria-label="Clear all filters" onClick={onReset}>
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
