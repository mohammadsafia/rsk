import { type ReactNode, useEffect } from 'react';

import type { Row } from '@tanstack/react-table';

import { Button } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { useDataTableContext } from '../DataTableContext';

type DataTableBulkActionsProps<TData> = {
  /** Receives the selected rows; render your action buttons. */
  children?: (rows: Row<TData>[]) => ReactNode;
  className?: string;
};

/** Replaces the toolbar while rows are selected: count, "select all results", your actions, Clear. */
function DataTableBulkActions<TData>({ children, className }: DataTableBulkActionsProps<TData>) {
  const { t } = useAppTranslation('common');
  const { table, setBulkActionsMounted } = useDataTableContext<TData>();

  useEffect(() => {
    setBulkActionsMounted(true);
    return () => setBulkActionsMounted(false);
  }, [setBulkActionsMounted]);

  const selected = table.getSelectedRowModel().rows;
  const count = selected.length;
  const total = table.getFilteredRowModel().rows.length;
  const canSelectAll =
    !table.options.manualPagination && table.getIsAllPageRowsSelected() && !table.getIsAllRowsSelected() && total > count;

  return (
    <>
      <span aria-live="polite" className="sr-only">
        {count > 0 ? t('table.selected', { count }) : ''}
      </span>

      <Conditional.If condition={count > 0}>
        <div
          data-slot="data-table-bulk-actions"
          role="toolbar"
          aria-label={t('table.bulkActions')}
          className={cn('bg-surface border-border flex w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-2', className)}
        >
          <span className="text-fg text-sm font-medium tabular-nums">{t('table.selected', { count })}</span>

          <Conditional.If condition={canSelectAll}>
            <Button variant="link" tone="accent" size="sm" onClick={() => table.toggleAllRowsSelected(true)}>
              {t('table.selectAllResults', { count: total })}
            </Button>
          </Conditional.If>

          <div className="ms-auto flex flex-wrap items-center gap-2">
            {children?.(selected)}
            <Button variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
              {t('table.clearSelection')}
            </Button>
          </div>
        </div>
      </Conditional.If>
    </>
  );
}

export default DataTableBulkActions;
