// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTable } from '@tanstack/react-table';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { DataTable } from '@components/tables';
import { Tooltip } from '@components/ui';

import { useDataTableFilters } from '@hooks/shared';

import { createFilterMeta, inListFilterFn, type KitColumnDef, kitFeatures, numberRangeFilterFn } from '@utils';

import '../../../i18n';

type Row = { name: string; role: string; amount: number };

const columns: KitColumnDef<Row>[] = [
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
  const table = useTable({
    features: kitFeatures,
    data: rows,
    columns,
    state: filters.state,
    onColumnFiltersChange: filters.onColumnFiltersChange,
    onGlobalFilterChange: filters.onGlobalFilterChange,
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
    // The pill fades its values before clearing; the URL follows once it has.
    await vi.waitFor(() => expect(updates.at(-1)).not.toContain('amount='));
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

  it('opens a link with a stray percent sign instead of crashing', () => {
    mount({ urlSync: true }, '?role=%25');
    expect(names()).toBe('');
  });

  it("persists columns with nested accessor keys under TanStack's column id", () => {
    sessionStorage.setItem('rsk:table:clinics', JSON.stringify({ filters: { clinic_city: 'irbid' } }));
    render(
      <NuqsTestingAdapter>
        <NestedPage />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('nested').textContent).toBe('Irbid');
  });

  it('on a server-rendered page, restores the session’s filters once hydrated, and never erases them while hydrating', async () => {
    sessionStorage.setItem('rsk:table:members', JSON.stringify({ filters: { amount: '100..' }, q: 'om' }));
    const tree = (
      <NuqsTestingAdapter>
        <QueryClientProvider client={new QueryClient()}>
          <Tooltip.Provider>
            <Page storageKey="members" />
          </Tooltip.Provider>
        </QueryClientProvider>
      </NuqsTestingAdapter>
    );
    const container = document.createElement('div');
    // On a server the storage isn't readable: the table renders unfiltered.
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('no storage on a server');
    });
    container.innerHTML = renderToString(tree);
    getItem.mockRestore();
    expect(container.querySelector('[data-testid="names"]')?.textContent).toBe('Sara,Omar');
    document.body.append(container);
    await act(async () => void hydrateRoot(container, tree));
    expect(names()).toBe('Omar');
    expect(search().value).toBe('om');
    expect(JSON.parse(sessionStorage.getItem('rsk:table:members') ?? 'null')).toEqual({ filters: { amount: '100..' }, q: 'om' });
    container.remove();
  });
});

type Clinic = { name: string; clinic: { city: string } };
const nestedColumns: KitColumnDef<Clinic>[] = [
  {
    accessorKey: 'clinic.city',
    filterFn: inListFilterFn,
    meta: {
      filterMeta: createFilterMeta({
        variant: 'multiSelect',
        label: 'City',
        options: [{ id: 'irbid' }],
        getOptionLabel: (o: { id: string }) => o.id,
        getOptionValue: (o: { id: string }) => o.id,
      }),
    },
  },
];

function NestedPage() {
  const filters = useDataTableFilters({ columns: nestedColumns, storageKey: 'clinics' });
  const table = useTable({
    features: kitFeatures,
    data: [
      { name: 'Irbid', clinic: { city: 'irbid' } },
      { name: 'Amman', clinic: { city: 'amman' } },
    ],
    columns: nestedColumns,
    state: filters.state,
    onColumnFiltersChange: filters.onColumnFiltersChange,
  });
  return (
    <p data-testid="nested">
      {table
        .getFilteredRowModel()
        .rows.map((row) => row.original.name)
        .join(',')}
    </p>
  );
}
