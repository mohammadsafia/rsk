'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { Checkbox } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';
import { type KitColumnDef, type KitRow, type KitCoreTable } from '@utils';
import type { RowData } from '@tanstack/react-table';

/** Header cells get the core table (v9), not the one useTable returns. */
function SelectPageCheckbox<TData extends RowData>({ table }: { table: KitCoreTable<TData> }) {
  const { t } = useAppTranslation('common');
  const checked = table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false;

  return (
    <Checkbox
      aria-label={t('table.selectPage')}
      checked={checked}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
    />
  );
}

function SelectRowCheckbox<TData extends RowData>({ row, label }: { row: KitRow<TData>; label?: string }) {
  const { t } = useAppTranslation('common');

  return (
    <Checkbox
      aria-label={label ? t('table.selectRowNamed', { name: label }) : t('table.selectRow')}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(value === true)}
    />
  );
}

/** A pinned-start checkbox column. Rows are keyed by the table's `getRowId`, so selection survives paging and sorting. */
export function createSelectionColumn<TData extends RowData>({
  getRowLabel,
}: { getRowLabel?: (row: TData) => string } = {}): KitColumnDef<TData> {
  return {
    id: 'select',
    size: 44,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    meta: { disableRowClick: true },
    header: ({ table }) => <SelectPageCheckbox table={table} />,
    cell: ({ row }) => <SelectRowCheckbox row={row} label={getRowLabel?.(row.original)} />,
  };
}
