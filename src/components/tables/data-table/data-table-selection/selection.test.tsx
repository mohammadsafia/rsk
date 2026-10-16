// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button } from '@components/ui';
import { createSelectionColumn, DataTable } from '@components/tables';

import '../../../../i18n';

type Invoice = { id: string; patient: string };

const rows: Invoice[] = Array.from({ length: 5 }, (_, index) => ({ id: `INV-${index + 1}`, patient: `Patient ${index + 1}` }));

const columns: ColumnDef<Invoice>[] = [
  createSelectionColumn<Invoice>({ getRowLabel: (row) => row.id }),
  { accessorKey: 'patient', header: 'Patient' },
];

function Harness({ manualPagination = false }: { manualPagination?: boolean }) {
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
});
