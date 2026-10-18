// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ColumnFiltersState, useTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DataTable } from '@components/tables';
import { Tooltip } from '@components/ui';

import { createFilterMeta, type KitColumnDef, kitFeatures, type KitFilterFn } from '@utils';

import i18n from '../../../i18n';

type Member = { name: string; role: string; status: string };

const ROLES = [
  { id: 'admin', name: 'Admin' },
  { id: 'editor', name: 'Editor' },
  { id: 'viewer', name: 'Viewer' },
];
const STATUSES = [
  { id: 'active', name: 'Active' },
  { id: 'invited', name: 'Invited' },
];

const inValues: KitFilterFn<Member> = (row, id, value) => !Array.isArray(value) || value.length === 0 || value.includes(row.getValue(id));

const select = (label: string, options: typeof ROLES) =>
  createFilterMeta({
    variant: 'multiSelect',
    label,
    options,
    getOptionLabel: (option: { id: string; name: string }) => option.name,
    getOptionValue: (option: { id: string; name: string }) => option.id,
  });

const columns: KitColumnDef<Member>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role', filterFn: inValues, meta: { filterMeta: select('Role', ROLES) } },
  { accessorKey: 'status', header: 'Status', filterFn: inValues, meta: { filterMeta: select('Status', STATUSES) } },
];

const rows: Member[] = [
  { name: 'Sara Haddad', role: 'admin', status: 'active' },
  { name: 'Omar Nasser', role: 'editor', status: 'invited' },
  { name: 'Lina Khoury', role: 'viewer', status: 'active' },
];

function Harness({ filters = [] }: { filters?: ColumnFiltersState }) {
  const table = useTable({
    features: kitFeatures,
    data: rows,
    columns,
    initialState: { columnFilters: filters },
    enableGlobalFilter: true,
  });

  return (
    <DataTable table={table}>
      <DataTable.Toolbar totalCount={table.getFilteredRowModel().rows.length} totalLabel="Members" />
    </DataTable>
  );
}

const renderBar = (filters?: ColumnFiltersState) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Tooltip.Provider>
        <Harness filters={filters} />
      </Tooltip.Provider>
    </QueryClientProvider>,
  );

const pill = (label: string) => document.querySelector(`[data-slot="filter-pill"][data-filter="${label}"]`) as HTMLElement;

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('DataTable filter bar', () => {
  it('shows every filter straight away, with no toggle', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: /^Filter/ })).toBeNull();
    expect(pill('Role')).not.toBeNull();
    expect(pill('Status')).not.toBeNull();
    expect(pill('Role').hasAttribute('data-active')).toBe(false);
    expect(document.querySelector('[data-slot="filter-pill-remove"]')).toBeNull();
  });

  it('turns an applied filter into an active pill that names its values', () => {
    renderBar([{ id: 'role', value: ['admin', 'editor'] }]);
    expect(pill('Role').hasAttribute('data-active')).toBe(true);
    expect(pill('Role').textContent).toContain('Admin, Editor');
    expect(pill('Status').hasAttribute('data-active')).toBe(false);
  });

  it('summarises more than two values as the first value plus a count', () => {
    renderBar([{ id: 'role', value: ['admin', 'editor', 'viewer'] }]);
    expect(pill('Role').textContent).toContain('Admin +2');
  });

  it('removes one filter with a separate, named button', async () => {
    renderBar([
      { id: 'role', value: ['admin'] },
      { id: 'status', value: ['active'] },
    ]);
    const remove = screen.getByRole('button', { name: 'Remove Role filter' });
    expect(remove.closest('[role="combobox"]')).toBeNull();
    fireEvent.click(remove);
    await vi.waitFor(() => expect(pill('Role').hasAttribute('data-active')).toBe(false));
    expect(pill('Status').hasAttribute('data-active')).toBe(true);
  });

  it('clears every filter, and only offers to when something is applied', () => {
    renderBar([
      { id: 'role', value: ['admin'] },
      { id: 'status', value: ['active'] },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(document.querySelectorAll('[data-slot="filter-pill"][data-active]')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('reads "N of M" when filtered so the narrowed list is obvious', () => {
    renderBar([{ id: 'role', value: ['admin'] }]);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.textContent).toContain('Members: 1 of 3');
  });

  it('names the remove button in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderBar([{ id: 'role', value: ['admin'] }]);
    expect(screen.getByRole('button', { name: 'إزالة عامل التصفية Role' })).toBeTruthy();
  });

  it('keeps an applied filter in place instead of moving it to another row', () => {
    renderBar([{ id: 'status', value: ['active'] }]);
    const pills = [...document.querySelectorAll('[data-slot="filter-pill"]')].map((node) => node.getAttribute('data-filter'));
    expect(pills).toEqual(['Role', 'Status']);
    document
      .querySelectorAll('[data-slot="filter-pill"]')
      .forEach((node) => expect(node.parentElement?.className ?? '').not.toMatch(/(^|\s)order-/));
  });
});
