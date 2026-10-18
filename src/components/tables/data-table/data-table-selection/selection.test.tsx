// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { type PaginationState, useTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button } from '@components/ui';
import { createSelectionColumn, DataTable } from '@components/tables';

import '../../../../i18n';
import { type KitColumnDef, kitFeatures } from '@utils';

type Invoice = { id: string; patient: string };

const rows: Invoice[] = Array.from({ length: 5 }, (_, index) => ({ id: `INV-${index + 1}`, patient: `Patient ${index + 1}` }));

const columns: KitColumnDef<Invoice>[] = [
  createSelectionColumn<Invoice>({ getRowLabel: (row) => row.id }),
  { accessorKey: 'patient', header: 'Patient' },
];

function Harness({ manualPagination = false }: { manualPagination?: boolean }) {
  const table = useTable({
    features: kitFeatures,
    data: rows,
    columns,
    getRowId: (row) => row.id,
    manualPagination,
    pageCount: manualPagination ? 3 : undefined,
    initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
  });

  return (
    <DataTable table={table}>
      <DataTable.Toolbar totalCount={rows.length} />
      <DataTable.BulkActions>{(selected) => <Button size="sm">Export {selected.length}</Button>}</DataTable.BulkActions>
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable>
  );
}

// Server-side paging: only the current page is in `data`, like useDataTable with manualPagination.
function ServerHarness() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 2 });
  const page = rows.slice(pagination.pageIndex * 2, pagination.pageIndex * 2 + 2);
  const table = useTable({
    features: kitFeatures,
    data: page,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: 3,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <DataTable table={table}>
      <DataTable.BulkActions>{(selected, ids) => <Button size="sm">Export {ids.length}</Button>}</DataTable.BulkActions>
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable>
  );
}

afterEach(cleanup);

describe('DataTable selection', () => {
  it('labels row checkboxes and swaps the toolbar for the bulk bar while rows are selected', () => {
    render(<Harness />);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')).not.toBeNull();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));

    const bar = screen.getByRole('toolbar', { name: 'Actions for selected rows' });
    expect(bar.textContent).toContain('1 selected');
    expect(screen.getByRole('button', { name: 'Export 1' })).toBeTruthy();
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('1 selected');
  });

  it('rises in on the spring when selection starts, leaves at once so the returning toolbar never stacks under it', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));
    const bar = screen.getByRole('toolbar', { name: 'Actions for selected rows' });
    expect(bar.className).toContain('animate-in');
    expect(bar.className).toContain('slide-in-from-bottom-1');
    expect(bar.className).toContain('duration-base');
    expect(bar.className).toContain('ease-spring');
    expect(bar.className).toContain('motion-reduce:animate-none');

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.hasAttribute('hidden')).toBe(false);
  });

  it('header checkbox selects the page (indeterminate when partial), then offers all filtered results', () => {
    render(<Harness />);
    const header = screen.getByRole('checkbox', { name: 'Select all rows on this page' });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));
    expect(header.getAttribute('aria-checked')).toBe('mixed');

    fireEvent.click(header);
    expect(screen.getByRole('toolbar').textContent).toContain('2 selected');

    fireEvent.click(screen.getByRole('button', { name: 'Select all 5 results' }));
    expect(screen.getByRole('toolbar').textContent).toContain('5 selected');
  });

  it('does not offer "select all results" when pagination is server-side', () => {
    render(<Harness manualPagination />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(screen.queryByRole('button', { name: /Select all .* results/ })).toBeNull();
  });

  it('clears with the Clear button and with Escape inside the table', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('toolbar')).toBeNull();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-2' }));
    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select INV-2' }), { key: 'Escape' });
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('keeps counting rows selected on other server-side pages', () => {
    render(<ServerHarness />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

    expect(screen.getByRole('toolbar').textContent).toContain('2 selected');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-3' }));
    expect(screen.getByRole('toolbar').textContent).toContain('3 selected');
    expect(screen.getByRole('button', { name: 'Export 3' })).toBeTruthy();
  });

  it('leaves the selection alone when something inside the table already handled Escape', () => {
    render(<Harness />);
    const box = screen.getByRole('checkbox', { name: 'Select INV-1' });
    fireEvent.click(box);
    box.addEventListener('keydown', (event) => event.preventDefault());
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(screen.getByRole('toolbar').textContent).toContain('1 selected');
  });

  it('keeps keyboard focus and announces it after Clear selection', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('Selection cleared');
  });
});
