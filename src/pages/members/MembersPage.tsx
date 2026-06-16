import { useMemo } from 'react';

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

import { useAppTranslation } from '@hooks/shared';

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

type Option = { id: string; labelKey: string };

const ROLE_OPTIONS: Option[] = [
  { id: 'Admin', labelKey: 'roles.Admin' },
  { id: 'Editor', labelKey: 'roles.Editor' },
  { id: 'Viewer', labelKey: 'roles.Viewer' },
];

const STATUS_OPTIONS: Option[] = [
  { id: 'Active', labelKey: 'statuses.Active' },
  { id: 'Invited', labelKey: 'statuses.Invited' },
  { id: 'Suspended', labelKey: 'statuses.Suspended' },
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

type TranslateFn = ReturnType<typeof useAppTranslation>['t'];

const buildColumns = (t: TranslateFn): ColumnDef<Member>[] => {
  const roleOptions = ROLE_OPTIONS.map((option) => ({ id: option.id, name: t(option.labelKey) }));
  const statusOptions = STATUS_OPTIONS.map((option) => ({ id: option.id, name: t(option.labelKey) }));

  return [
    {
      accessorKey: 'name',
      header: t('columns.name'),
      enableSorting: true,
      cell: ({ row }) => <span className="text-foreground font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'email',
      header: t('columns.email'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: 'role',
      header: t('columns.role'),
      filterFn: inSelectedValues,
      meta: {
        label: t('columns.role'),
        filterMeta: createFilterMeta({
          variant: 'multiSelect',
          label: t('columns.role'),
          options: roleOptions,
          getOptionLabel: (option: { id: string; name: string }) => option.name,
          getOptionValue: (option: { id: string; name: string }) => option.id,
        }),
      },
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      filterFn: inSelectedValues,
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{t(`statuses.${row.original.status}`)}</Badge>,
      meta: {
        label: t('columns.status'),
        filterMeta: createFilterMeta({
          variant: 'multiSelect',
          label: t('columns.status'),
          options: statusOptions,
          getOptionLabel: (option: { id: string; name: string }) => option.name,
          getOptionValue: (option: { id: string; name: string }) => option.id,
        }),
      },
    },
    {
      accessorKey: 'joined',
      header: t('columns.joined'),
      enableSorting: true,
      sortDescFirst: true,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.joined}</span>,
    },
  ];
};

function MembersPage() {
  const { t } = useAppTranslation('members');

  const columns = useMemo(() => buildColumns(t), [t]);

  const table = useReactTable<Member>({
    data: MEMBERS,
    columns,
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
          <ActionPanel.Title>{t('title')}</ActionPanel.Title>
        </ActionPanel.Header>

        <ActionPanel.Actions>
          <ActionPanel.Action>
            <AddCircle size={20} />
            {t('addMember')}
          </ActionPanel.Action>
        </ActionPanel.Actions>
      </ActionPanel>

      <DataTable.Toolbar totalCount={totalCount} totalLabel={t('totalLabel')} placeholder={t('searchPlaceholder')} />

      <DataTable.Content emptyState={{ title: t('emptyState.title'), description: t('emptyState.description') }} />

      <DataTable.Pagination />
    </DataTable>
  );
}

export default MembersPage;
