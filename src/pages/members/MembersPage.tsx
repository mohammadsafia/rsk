import {
  type ColumnDef,
  type FilterFn,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Badge } from '@components/ui';
import { DataTable } from '@components/tables';

import { createFilterMeta } from '@utils';
import { ActionPanel } from '@components/shared';
import { AddCircle } from 'iconsax-react';

type Member = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Invited' | 'Suspended';
  joined: string;
};

type Option = { id: string; name: string };

const ROLE_OPTIONS: Option[] = [
  { id: 'Admin', name: 'Admin' },
  { id: 'Editor', name: 'Editor' },
  { id: 'Viewer', name: 'Viewer' },
];

const STATUS_OPTIONS: Option[] = [
  { id: 'Active', name: 'Active' },
  { id: 'Invited', name: 'Invited' },
  { id: 'Suspended', name: 'Suspended' },
];

const STATUS_VARIANT: Record<Member['status'], 'success' | 'warning' | 'destructive'> = {
  Active: 'success',
  Invited: 'warning',
  Suspended: 'destructive',
};

const FIRST_NAMES = ['Sarah', 'Alex', 'Jordan', 'Taylor', 'Chris', 'Morgan', 'Jamie', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sam'];
const LAST_NAMES = ['Chen', 'Morgan', 'Lee', 'Kim', 'Park', 'Diaz', 'Patel', 'Khan', 'Reed', 'Cole', 'Ford', 'Hayes'];

const MEMBERS: Member[] = Array.from({ length: 24 }, (_, i) => {
  const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 5) % LAST_NAMES.length]}`;
  const role = ROLE_OPTIONS[i % ROLE_OPTIONS.length].id as Member['role'];
  const status = STATUS_OPTIONS[i % STATUS_OPTIONS.length].id as Member['status'];
  const day = String((i % 27) + 1).padStart(2, '0');

  return {
    id: `member-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@acme.io`,
    role,
    status,
    joined: `2026-${String((i % 12) + 1).padStart(2, '0')}-${day}`,
  };
});

/** Matches a scalar cell value against the array of selected filter values. */
const inSelectedValues: FilterFn<Member> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;

  return (filterValue as string[]).includes(String(row.getValue(columnId)));
};

const COLUMNS: ColumnDef<Member>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    cell: ({ row }) => <span className="text-foreground font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    filterFn: inSelectedValues,
    meta: {
      label: 'Role',
      filterMeta: createFilterMeta({
        variant: 'multiSelect',
        label: 'Role',
        options: ROLE_OPTIONS,
        getOptionLabel: (option: Option) => option.name,
        getOptionValue: (option: Option) => option.id,
      }),
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: inSelectedValues,
    cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>,
    meta: {
      label: 'Status',
      filterMeta: createFilterMeta({
        variant: 'multiSelect',
        label: 'Status',
        options: STATUS_OPTIONS,
        getOptionLabel: (option: Option) => option.name,
        getOptionValue: (option: Option) => option.id,
      }),
    },
  },
  {
    accessorKey: 'joined',
    header: 'Joined',
    enableSorting: true,
    sortDescFirst: true,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.joined}</span>,
  },
];

function MembersPage() {
  const table = useReactTable<Member>({
    data: MEMBERS,
    columns: COLUMNS,
    enableGlobalFilter: true,
    globalFilterFn: 'includesString',
    enableSortingRemoval: true,
    initialState: { pagination: { pageSize: 8 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <DataTable table={table}>
      <ActionPanel>
        <ActionPanel.Header>
          <ActionPanel.Title>Members</ActionPanel.Title>
        </ActionPanel.Header>

        <ActionPanel.Actions>
          <ActionPanel.Action>
            <AddCircle size={20} />
            Add Member
          </ActionPanel.Action>
        </ActionPanel.Actions>
      </ActionPanel>

      <DataTable.Toolbar totalCount={totalCount} totalLabel="Claims" />

      <DataTable.Content />

      <DataTable.Pagination />
    </DataTable>
  );
}

export default MembersPage;
