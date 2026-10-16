// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ColumnDef, getCoreRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { DataTable } from '@components/tables';
import { Tooltip } from '@components/ui';

import { useDataTableFilters } from '@hooks/shared';

import { createFilterMeta, inListFilterFn, numberRangeFilterFn } from '@utils';

import '../../../i18n';

type Row = { name: string; role: string; amount: number };

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'role',
    filterFn: inListFilterFn,
    meta: {
      filterMeta: createFilterMeta({
        variant: 'multiSelect',
        label: 'Role',
        options: [{ id: 'admin' }, { id: 'editor' }],
        getOptionLabel: (o: { id: string }) => o.id,
        getOptionValue: (o: { id: string }) => o.id,
      }),
    },
  },
  {
    accessorKey: 'amount',
    filterFn: numberRangeFilterFn,
    meta: { filterMeta: createFilterMeta({ variant: 'numberRange', label: 'Amount' }) },
  },
];

const rows: Row[] = [
  { name: 'Sara', role: 'admin', amount: 10 },
  { name: 'Omar', role: 'editor', amount: 300 },
];

function Page({ urlSync, storageKey }: { urlSync?: boolean; storageKey?: string }) {
  const filters = useDataTableFilters({ columns, urlSync, storageKey });
  const table = useReactTable({
    data: rows,
    columns,
    state: filters.state,
    onColumnFiltersChange: filters.onColumnFiltersChange,
    onGlobalFilterChange: filters.onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableGlobalFilter: true,
  });
  return (
    <DataTable table={table} onResetFilters={filters.reset}>
      <DataTable.Toolbar totalCount={table.getFilteredRowModel().rows.length} />
      <p data-testid="names">
        {table
          .getFilteredRowModel()
          .rows.map((row) => row.original.name)
          .join(',')}
      </p>
    </DataTable>
  );
}

const mount = (props: { urlSync?: boolean; storageKey?: string }, searchParams = '', onUrlUpdate?: (event: UrlUpdateEvent) => void) =>
  render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <QueryClientProvider client={new QueryClient()}>
        <Tooltip.Provider>
          <Page {...props} />
        </Tooltip.Provider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );

const names = () => screen.getByTestId('names').textContent;
const search = () => document.querySelector('input[name="data-table-search"]') as HTMLInputElement;

beforeEach(() => sessionStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useDataTableFilters', () => {
  it('hydrates from the URL first, ignoring bad and unknown params', () => {
    sessionStorage.setItem('rsk:table:members', JSON.stringify({ filters: { role: 'editor' } }));
    mount({ urlSync: true, storageKey: 'members' }, '?role=admin&amount=abc..&ghost=1');
    expect(names()).toBe('Sara');
  });

  it('falls back to the session, restoring the search text in the box', () => {
    sessionStorage.setItem('rsk:table:members', JSON.stringify({ filters: { amount: '100..' }, q: 'om' }));
    mount({ storageKey: 'members' });
    expect(names()).toBe('Omar');
    expect(search().value).toBe('om');
  });

  it('writes filters to the URL and the session', async () => {
    const updates: string[] = [];
    mount({ urlSync: true, storageKey: 'members' }, '?amount=100..', (event) => updates.push(event.queryString));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(JSON.parse(sessionStorage.getItem('rsk:table:members') ?? '{}')).toEqual({ filters: { amount: '100..' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Amount filter' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(updates.at(-1) ?? '').not.toContain('amount=');
  });

  it('reset clears filters, search, URL and session, and a remount stays clean', async () => {
    sessionStorage.setItem('rsk:table:members', JSON.stringify({ filters: { role: 'admin' }, q: 'sa' }));
    mount({ storageKey: 'members' });
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(sessionStorage.getItem('rsk:table:members')).toBeNull();
    expect(search().value).toBe('');
    cleanup();
    mount({ storageKey: 'members' });
    expect(names()).toBe('Sara,Omar');
  });

  it('survives a storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mount({ storageKey: 'members' });
    expect(names()).toBe('Sara,Omar');
  });
});
