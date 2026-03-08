import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';

import { Avatar, Button } from '@components/ui';
import { Breadcrumb, TooltipButton } from '@components/shared';
import { DataTable } from '@components/tables';

import { useUsersQuery } from '@hooks/queries';
import { ROUTES_PATH } from '@routes';

import { Pencil, User } from 'lucide-react';
import { useDataTable } from '@hooks/utils/useDataTable.ts';
import { useMemo } from 'react';

function UsersPage() {
  const navigate = useNavigate();

  const { data, tableUtils, isLoading, isFetching } = useUsersQuery();

  const {
    totalCount: rowCount,
    totalPages,
    state: { sorting, globalFilter, columnFilters, pagination },
    setPagination,
    setGlobalFilter,
    setSorting,
    setColumnFilters,
  } = tableUtils;

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Employees',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar>
              <Avatar.Image alt="User List Avatar" />

              <Avatar.Fallback className="text-primary border-accent rounded-full border">
                <User />
              </Avatar.Fallback>
            </Avatar>

            <div>
              <span className="font-semibold">{row.original.fullName?.firstName}</span>
            </div>
          </div>
        ),
        enableColumnFilter: false,
      },
      {
        header: 'Capacity',
        accessorKey: 'capacity.maxHours',
        enableColumnFilter: false,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        enableColumnFilter: false,
      },
      {
        header: 'Actions',
        accessorKey: 'id',
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TooltipButton
              title="Update User"
              variant="outline"
              size="icon"
              onClick={() => navigate(`${ROUTES_PATH.USERS.UPDATE}/${row.original.id}`)}
            >
              <Pencil size={16} />
            </TooltipButton>

            <TooltipButton title="User Profile" variant="outline" size="icon" onClick={() => navigate(row.original.id)}>
              <User />
            </TooltipButton>
          </div>
        ),
      },
    ],
    [],
  );

  const { table } = useDataTable<any>({
    data,
    columns,
    pageCount: totalPages,
    rowCount: rowCount,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      pagination,
      sorting,
      globalFilter,
      columnFilters,
      columnPinning: {
        right: ['actions'],
      },
    },
  });

  return (
    <section>
      <Breadcrumb links={[{ title: 'Team' }]} />

      <div className="mb-2 flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Team</h2>

        <Button>Create User</Button>
      </div>

      <DataTable isLoading={isLoading || isFetching} table={table}>
        <DataTable.Toolbar />
        <DataTable.Content />
        <DataTable.Pagination />
      </DataTable>
    </section>
  );
}

export default UsersPage;
