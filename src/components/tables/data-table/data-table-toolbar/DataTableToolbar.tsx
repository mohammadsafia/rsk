import { type FC, type PropsWithChildren, useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Button, Input } from '@components/ui';
import { Conditional } from '@components/utils';
import { DataTableFacetedFilter, useDataTableContext } from '@components/tables';

import { useAppTranslation, useDebounce } from '@hooks/shared';

import { cn } from '@utils';

import { Search, SlidersHorizontal } from 'lucide-react';

type ToolbarProps = PropsWithChildren<{
  totalCount?: number;
  totalLabel?: string;
  className?: string;
  placeholder?: string;
}>;

const DataTableToolbar: FC<ToolbarProps> = ({ totalCount, totalLabel, placeholder, children, className }) => {
  const { t } = useAppTranslation('common');
  const { table } = useDataTableContext();
  const filtersId = useId();

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

  const hasFilters = filterableColumns.length > 0;
  const filtersOpen = showFilters && hasFilters;

  return (
    <div data-slot="data-table-toolbar" className={cn('bg-surface border-border flex w-full flex-col rounded-lg border', className)}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2">
        <div className="flex flex-1 items-center">
          <Conditional.If condition={totalCount !== undefined}>
            <span className="text-fg-muted text-xs font-medium whitespace-nowrap">
              <Conditional>
                <Conditional.If condition={!!totalLabel}>
                  {t('table.totalWithLabel', { label: totalLabel, count: totalCount })}
                </Conditional.If>

                <Conditional.Else>{t('table.total', { count: totalCount })}</Conditional.Else>
              </Conditional>
            </span>
          </Conditional.If>
        </div>

        <Conditional.If condition={!!table?.options?.enableGlobalFilter}>
          <div className="relative">
            <Search aria-hidden="true" className="text-fg-subtle pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />

            <Input
              type="search"
              size="sm"
              name="data-table-search"
              aria-label={placeholder ?? t('search')}
              placeholder={placeholder ?? t('searchHere')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-60 ps-8"
            />
          </div>
        </Conditional.If>

        {children}

        <Conditional.If condition={hasFilters}>
          <Button variant="ghost" size="sm" aria-expanded={filtersOpen} aria-controls={filtersId} onClick={onToggleFilters}>
            <SlidersHorizontal aria-hidden="true" />
            {t('filter')}
            <Conditional.If condition={isFiltered}>
              <span className="bg-accent-subtle text-accent text-2xs rounded-full px-1.5 font-mono tabular-nums">{activeFilterCount}</span>
            </Conditional.If>
          </Button>
        </Conditional.If>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          filtersOpen ? 'grid-rows-[1fr]' : 'invisible grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            id={filtersId}
            role="toolbar"
            aria-orientation="horizontal"
            aria-label={t('filters')}
            className="border-border-subtle flex items-center gap-3 border-t px-4 py-2"
          >
            <div className="flex flex-1 flex-wrap items-center gap-1">
              {filterableColumns.map((column) => (
                <DataTableFacetedFilter key={column.id} column={column} />
              ))}
            </div>

            <Conditional.If condition={isFiltered}>
              <Button variant="ghost" tone="accent" size="sm" onClick={onReset}>
                {t('clearAll')}
              </Button>
            </Conditional.If>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTableToolbar;
