'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { type ReactNode, useEffect, useRef, useState } from 'react';

import { Button } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn, type KitRow } from '@utils';

import { useDataTableContext } from '../DataTableContext';
import type { RowData } from '@tanstack/react-table';

type DataTableBulkActionsProps<TData extends RowData> = {
  /**
   * Receives the selected rows that are loaded, and every selected id. With server-side paging,
   * rows selected on other pages appear only in `ids`.
   */
  children?: (rows: KitRow<TData>[], ids: string[]) => ReactNode;
  className?: string;
};

/** Replaces the toolbar while rows are selected: count, "select all results", your actions, Clear. */
function DataTableBulkActions<TData extends RowData>({ children, className }: DataTableBulkActionsProps<TData>) {
  const { t } = useAppTranslation('common');
  const { table, setBulkActionsMounted } = useDataTableContext<TData>();

  useEffect(() => {
    setBulkActionsMounted(true);
    return () => setBulkActionsMounted(false);
  }, [setBulkActionsMounted]);

  const barRef = useRef<HTMLDivElement>(null);
  const [cleared, setCleared] = useState(false);

  // Count from the selection state, not the row model: the row model only holds loaded rows.
  const rowSelection = table.state.rowSelection;
  const ids = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const count = ids.length;
  const selected = table.getSelectedRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const canSelectAll =
    !table.options.manualPagination && table.getIsAllPageRowsSelected() && !table.getIsAllRowsSelected() && total > count;

  // A new selection retires the "selection cleared" announcement.
  if (count > 0 && cleared) setCleared(false);

  const clear = () => {
    const root = barRef.current?.closest('[data-slot="data-table"]');
    table.resetRowSelection();
    setCleared(true);
    // The bar unmounts with the focused button, so hand focus to the page checkbox (or the search box).
    setTimeout(() => {
      const target =
        root?.querySelector<HTMLElement>('thead [role="checkbox"]') ?? root?.querySelector<HTMLElement>('input[type="search"]');
      target?.focus();
    }, 0);
  };

  return (
    <>
      <span aria-live="polite" className="sr-only">
        {count > 0 ? t('table.selected', { count }) : cleared ? t('table.selectionCleared') : ''}
      </span>

      <Conditional.If condition={count > 0}>
        <div
          ref={barRef}
          data-slot="data-table-bulk-actions"
          role="toolbar"
          aria-label={t('table.bulkActions')}
          className={cn(
            // Rises in on the spring; no exit — the toolbar takes the row back at once, so an exit would stack both bars.
            'bg-surface border-border animate-in fade-in slide-in-from-bottom-1 duration-base ease-spring flex w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-2 motion-reduce:animate-none',
            className,
          )}
        >
          <span className="text-fg text-sm font-medium tabular-nums">{t('table.selected', { count })}</span>

          <Conditional.If condition={canSelectAll}>
            <Button variant="link" tone="accent" size="sm" onClick={() => table.toggleAllRowsSelected(true)}>
              {t('table.selectAllResults', { count: total })}
            </Button>
          </Conditional.If>

          <div className="ms-auto flex flex-wrap items-center gap-2">
            {children?.(selected, ids)}
            <Button variant="ghost" size="sm" onClick={clear}>
              {t('table.clearSelection')}
            </Button>
          </div>
        </div>
      </Conditional.If>
    </>
  );
}

export default DataTableBulkActions;
