// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { useTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DataTable } from '@components/tables';

import i18n from '../../../i18n';
import { type KitColumnDef, kitFeatures } from '@utils';

type Visit = { patient: string; amount: number };

const columns: KitColumnDef<Visit>[] = [
  { accessorKey: 'patient', header: 'Patient' },
  { accessorKey: 'amount', header: 'Amount', meta: { numeric: true } },
];

const rows: Visit[] = [
  { patient: 'Sara Haddad', amount: 1250 },
  { patient: 'Omar Nasser', amount: 80 },
];

function Harness({ total, label, pageSize }: { total?: number; label?: string; pageSize?: number }) {
  const table = useTable({
    features: kitFeatures,
    data: rows,
    columns,
    enableGlobalFilter: true,
    initialState: pageSize ? { pagination: { pageIndex: 0, pageSize } } : undefined,
  });

  return (
    <DataTable table={table}>
      <DataTable.Toolbar totalCount={total} totalLabel={label} />
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable>
  );
}

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('DataTable', () => {
  it('forwards meta.numeric to the header and cells', () => {
    render(<Harness />);
    expect(screen.getByRole('columnheader', { name: 'Amount' }).getAttribute('data-numeric')).toBe('true');
    expect(screen.getByText('1250').closest('td')?.getAttribute('data-numeric')).toBe('true');
    expect(screen.getByText('Sara Haddad').closest('td')?.getAttribute('data-numeric')).toBeNull();
  });

  it('translates the toolbar and pagination text', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Harness total={2} />);
    expect(screen.getByText(i18n.t('common:pagination.rowsPerPage'))).toBeTruthy();
    expect(screen.getByPlaceholderText(i18n.t('common:searchHere'))).toBeTruthy();
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.textContent).toContain('نتيجتان');
  });

  it('uses the Arabic many form for eleven and Western digits', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Harness total={11} />);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.textContent).toContain('11 نتيجةً');
  });

  it('keeps a caller label as "label: count"', () => {
    render(<Harness total={1} label="Members" />);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.textContent).toContain('Members: 1');
  });

  it('shows the current page size even when it is not one of the options', () => {
    render(<Harness pageSize={8} />);
    const trigger = document.querySelector('[data-slot="data-table-pagination"] [role="combobox"]') as HTMLElement;
    expect(trigger.textContent).toContain('8');
  });

  it('uses no legacy classes', () => {
    render(<Harness total={2} />);
    const html = document.querySelector('[data-slot="data-table"]')?.innerHTML ?? '';
    expect(html).not.toMatch(/bg-background|text-muted-400|bg-primary-25|muted-200|bg-muted-50|fill-primary|(^|\s)shadow(\s|")/);
  });

  it('labels the filter bar as a group, not an arrow-key toolbar', () => {
    render(<Harness total={2} />);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.getAttribute('role')).toBe('group');
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.getAttribute('aria-label')).toBe('Filters');
  });

  it('pins the search input to the document direction so the start icon and padding stay aligned', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Harness total={2} />);
    expect(document.querySelector('input[name="data-table-search"]')?.getAttribute('dir')).toBe('rtl');
  });
});
