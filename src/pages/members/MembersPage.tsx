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

import { Badge, Button } from '@components/ui';
import { DataTable } from '@components/tables';

import { useAppTranslation } from '@hooks/shared';

import { createFilterMeta, dateFilterFn, dateRangeFilterFn, timeFilterFn } from '@utils';
import { PageHeader } from '@components/shared';

import { Plus } from 'lucide-react';

type Member = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Invited' | 'Suspended';
  joined: string;
  lastSeen: string;
  shiftStart: string;
};

const SHIFT_TIMES = ['08:00 AM', '09:30 AM', '01:00 PM', '03:45 PM'];

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

const STATUS_TONE: Record<Member['status'], 'success' | 'warning' | 'danger'> = {
  Active: 'success',
  Invited: 'warning',
  Suspended: 'danger',
};

const FIRST_NAMES = ['Sarah', 'Alex', 'Jordan', 'Taylor', 'Chris', 'Morgan', 'Jamie', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sam'];
const LAST_NAMES = ['Chen', 'Morgan', 'Lee', 'Kim', 'Park', 'Diaz', 'Patel', 'Khan', 'Reed', 'Cole', 'Ford', 'Hayes'];

const MEMBERS: Member[] = Array.from({ length: 24 }, (_, i) => {
  const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 5) % LAST_NAMES.length]}`;
  const role = ROLE_OPTIONS[i % ROLE_OPTIONS.length].id as Member['role'];
  const status = STATUS_OPTIONS[i % STATUS_OPTIONS.length].id as Member['status'];
  const day = String((i % 27) + 1).padStart(2, '0');
  const lastSeenDay = String(((i * 3) % 27) + 1).padStart(2, '0');

  return {
    id: `member-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@acme.io`,
    role,
    status,
    joined: `2026-${String((i % 12) + 1).padStart(2, '0')}-${day}`,
    lastSeen: `2026-${String(((i * 2) % 12) + 1).padStart(2, '0')}-${lastSeenDay}`,
    shiftStart: SHIFT_TIMES[i % SHIFT_TIMES.length],
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
      cell: ({ row }) => <span className="text-fg font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'email',
      header: t('columns.email'),
      cell: ({ row }) => (
        <span data-slot="member-email" dir="ltr" className="text-fg-muted">
          {row.original.email}
        </span>
      ),
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
      cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status]}>{t(`statuses.${row.original.status}`)}</Badge>,
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
      filterFn: dateRangeFilterFn,
      cell: ({ row }) => (
        <span dir="ltr" className="text-fg-muted tabular-nums">
          {row.original.joined}
        </span>
      ),
      meta: {
        label: t('columns.joined'),
        filterMeta: createFilterMeta({
          variant: 'dateRange',
          label: t('columns.joined'),
        }),
      },
    },
    {
      accessorKey: 'lastSeen',
      header: t('columns.lastSeen'),
      enableSorting: true,
      sortDescFirst: true,
      filterFn: dateFilterFn,
      cell: ({ row }) => (
        <span dir="ltr" className="text-fg-muted tabular-nums">
          {row.original.lastSeen}
        </span>
      ),
      meta: {
        label: t('columns.lastSeen'),
        filterMeta: createFilterMeta({
          variant: 'date',
          label: t('columns.lastSeen'),
        }),
      },
    },
    {
      accessorKey: 'shiftStart',
      header: t('columns.shiftStart'),
      filterFn: timeFilterFn,
      cell: ({ row }) => (
        <span dir="ltr" className="text-fg-muted tabular-nums">
          {row.original.shiftStart}
        </span>
      ),
      meta: {
        label: t('columns.shiftStart'),
        filterMeta: createFilterMeta({
          variant: 'time',
          label: t('columns.shiftStart'),
        }),
      },
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
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t('title')} description={t('description')}>
        <PageHeader.Actions>
          <Button>
            <Plus aria-hidden="true" />
            {t('addMember')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <DataTable table={table} className="min-h-0 flex-1">
        <DataTable.Toolbar totalCount={totalCount} totalLabel={t('totalLabel')} placeholder={t('searchPlaceholder')} />

        <DataTable.Content emptyState={{ title: t('emptyState.title'), description: t('emptyState.description') }} />

        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}

export default MembersPage;
