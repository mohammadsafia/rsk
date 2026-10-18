// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { DataTable } from '@components/tables';

import '../../../i18n';

type Visit = { id: string; patient: string; amount: number };
const columns: ColumnDef<Visit>[] = [
  { accessorKey: 'patient', header: 'Patient' },
  { accessorKey: 'amount', header: 'Amount', meta: { numeric: true } },
];
const BASE: Visit[] = [
  { id: 'v1', patient: 'Sara Haddad', amount: 1250 },
  { id: 'v2', patient: 'Omar Nasser', amount: 80 },
  { id: 'v3', patient: 'Dana Khalil', amount: 300 },
];

function Harness({ data, pageSize = 10 }: { data: Visit[]; pageSize?: number }) {
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });
  return (
    <DataTable table={table}>
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable>
  );
}

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve() }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
});
afterEach(cleanup);

const tintedRows = () => animate.mock.contexts.map((element) => (element as HTMLElement).dataset.rowId).filter(Boolean);

describe('DataTable motion', () => {
  it('marks each row with its id', () => {
    render(<Harness data={BASE} />);
    expect(screen.getByText('Sara Haddad').closest('tr')?.dataset.rowId).toBe('v1');
  });

  it('tints a row whose data changed, never on first render', () => {
    const { rerender } = render(<Harness data={BASE} />);
    expect(tintedRows()).toEqual([]);
    rerender(<Harness data={[BASE[0], { ...BASE[1], amount: 95 }, BASE[2]]} />);
    expect(tintedRows()).toEqual(['v2']);
  });

  it('tints an added row, but not when the whole page of rows changes', () => {
    const { rerender } = render(<Harness data={BASE} />);
    rerender(<Harness data={[...BASE, { id: 'v4', patient: 'Sami Odeh', amount: 40 }]} />);
    expect(tintedRows()).toEqual(['v4']);
    animate.mockClear();
    rerender(
      <Harness
        data={[
          { id: 'x1', patient: 'A', amount: 1 },
          { id: 'x2', patient: 'B', amount: 2 },
        ]}
      />,
    );
    expect(tintedRows()).toEqual([]);
  });

  it('turns one arrow for the sort direction instead of swapping icons', () => {
    render(<Harness data={BASE} />);
    const header = screen.getByRole('button', { name: /Patient/ });
    fireEvent.click(header);
    fireEvent.click(header);
    const icon = header.querySelector('[data-slot="sort-icon"]') as HTMLElement;
    expect(icon.className).toContain('rotate-180');
    expect(icon.className).toContain('duration-spring');
  });

  it('sorts from the keyboard: a sortable header is a real button (WCAG 2.1.1), aria-sort stays on the th', () => {
    render(<Harness data={BASE} />);
    const header = screen.getByRole('button', { name: /Patient/ });
    expect(header.tagName).toBe('BUTTON');
    fireEvent.click(header);
    expect(header.closest('th')?.getAttribute('aria-sort')).toBe('ascending');
  });
});
