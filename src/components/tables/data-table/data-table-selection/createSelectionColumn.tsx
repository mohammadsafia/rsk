// TanStack Table v8 hands out one mutable table object, so compiled memoization would render stale rows;
// opted out of the React Compiler until Table 9 (compiler-compatible).
'use no memo';

import type { ColumnDef, Row, Table } from '@tanstack/react-table';

import { Checkbox } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

function SelectPageCheckbox<TData>({ table }: { table: Table<TData> }) {
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

function SelectRowCheckbox<TData>({ row, label }: { row: Row<TData>; label?: string }) {
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
export function createSelectionColumn<TData>({ getRowLabel }: { getRowLabel?: (row: TData) => string } = {}): ColumnDef<TData> {
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
