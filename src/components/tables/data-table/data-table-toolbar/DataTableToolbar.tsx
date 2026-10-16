import { type FC, type PropsWithChildren, useEffect, useState } from 'react';

import { Button, Input } from '@components/ui';
import { Conditional } from '@components/utils';
import { DataTableFacetedFilter, useDataTableContext } from '@components/tables';

import { useAppTranslation, useDebounce } from '@hooks/shared';

import { cn } from '@utils';

import { Search } from 'lucide-react';

type ToolbarProps = PropsWithChildren<{
  totalCount?: number;
  totalLabel?: string;
  className?: string;
  placeholder?: string;
}>;

/**
 * One always-visible bar: search, then every filter pill, then the result count.
 * Applied filters change appearance in place — they never move, so the bar stays predictable.
 */
const DataTableToolbar: FC<ToolbarProps> = ({ totalCount, totalLabel, placeholder, children, className }) => {
  const { t, direction } = useAppTranslation('common');
  const { table, onResetFilters } = useDataTableContext();

  const [search, setSearch] = useState(table.getState().globalFilter ?? '');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    table.setGlobalFilter(debouncedSearch);
  }, [debouncedSearch, table]);

  const filterableColumns = table.getAllColumns().filter((column) => column.getCanFilter() && column.columnDef.meta?.filterMeta);
  const activeCount = filterableColumns.filter((column) => column.getIsFiltered()).length;
  const hasActive = activeCount > 0;
  const isSearching = !!table.getState().globalFilter;

  // Client-side tables can say how much the list was narrowed; server-side ones only know the filtered total.
  const unfilteredTotal = table.options.manualFiltering ? undefined : table.getCoreRowModel().rows.length;
  const isNarrowed = (hasActive || !!table.getState().globalFilter) && unfilteredTotal !== undefined && totalCount !== unfilteredTotal;

  return (
    <div
      data-slot="data-table-toolbar"
      role="group"
      aria-label={t('filters')}
      className={cn('bg-surface border-border flex w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-2', className)}
    >
      <Conditional.If condition={!!table?.options?.enableGlobalFilter}>
        <div className="relative w-full sm:w-60">
          <Search aria-hidden="true" className="text-fg-subtle pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />

          <Input
            type="search"
            size="sm"
            name="data-table-search"
            dir={direction}
            aria-label={placeholder ?? t('search')}
            placeholder={placeholder ?? t('searchHere')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ps-8"
          />
        </div>
      </Conditional.If>

      <Conditional.If condition={filterableColumns.length > 0}>
        <span aria-hidden="true" className="bg-border-subtle hidden h-5 w-px sm:block" />
      </Conditional.If>

      {filterableColumns.map((column) => (
        <DataTableFacetedFilter key={column.id} column={column} />
      ))}

      <Conditional.If condition={hasActive || isSearching}>
        <Button
          variant="ghost"
          tone="accent"
          size="sm"
          onClick={() => {
            if (onResetFilters) onResetFilters();
            else {
              table.resetColumnFilters(true);
              table.setGlobalFilter('');
            }
            setSearch('');
          }}
        >
          {t('clearFilters')}
        </Button>
      </Conditional.If>

      {children}

      <Conditional.If condition={totalCount !== undefined}>
        <span data-slot="data-table-count" className="text-fg-muted ms-auto font-mono text-xs whitespace-nowrap tabular-nums">
          <Conditional>
            <Conditional.If condition={isNarrowed && !!totalLabel}>
              {t('table.filteredWithLabel', { label: totalLabel, count: totalCount, total: unfilteredTotal })}
            </Conditional.If>

            <Conditional.If condition={isNarrowed}>{t('table.filtered', { count: totalCount, total: unfilteredTotal })}</Conditional.If>

            <Conditional.If condition={!!totalLabel}>{t('table.totalWithLabel', { label: totalLabel, count: totalCount })}</Conditional.If>

            <Conditional.Else>{t('table.total', { count: totalCount })}</Conditional.Else>
          </Conditional>
        </span>
      </Conditional.If>
    </div>
  );
};

export default DataTableToolbar;
