// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type SortingState, useTable } from '@tanstack/react-table';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { DataTable } from '@components/tables';

import '../../../i18n';
import { type KitColumnDef, kitFeatures } from '@utils';

type Visit = { id: string; patient: string; amount: number };
const columns: KitColumnDef<Visit>[] = [
  { accessorKey: 'patient', header: 'Patient' },
  { accessorKey: 'amount', header: 'Amount', meta: { numeric: true } },
];
const BASE: Visit[] = [
  { id: 'v1', patient: 'Sara Haddad', amount: 1250 },
  { id: 'v2', patient: 'Omar Nasser', amount: 80 },
  { id: 'v3', patient: 'Dana Khalil', amount: 300 },
];

function Harness({ data, pageSize = 10 }: { data: Visit[]; pageSize?: number }) {
  const table = useTable({
    features: kitFeatures,
    data,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });
  return (
    <DataTable table={table}>
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable>
  );
}

/** A server-driven table: the sort state changes first, the sorted rows arrive in a later render. */
function ServerHarness({ data, sorting, onSort }: { data: Visit[]; sorting: SortingState; onSort: (sorting: SortingState) => void }) {
  const table = useTable({
    features: kitFeatures,
    data,
    columns,
    getRowId: (row) => row.id,
    manualSorting: true,
    state: { sorting },
    onSortingChange: (updater) => onSort(typeof updater === 'function' ? updater(sorting) : updater),
  });
  return (
    <DataTable table={table}>
      <DataTable.Content />
    </DataTable>
  );
}

let animate: ReturnType<typeof vi.fn>;
let topReads = 0;
beforeEach(() => {
  animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve() }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  // happy-dom has no layout: give each row a top from its place in the body, 40px apart.
  topReads = 0;
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      topReads += 1;
      return this.parentElement ? Array.from(this.parentElement.children).indexOf(this) * 40 : 0;
    },
  });
});
afterEach(cleanup);

type Call = { id?: string; first: Record<string, string | number> };
const calls = (): Call[] =>
  animate.mock.calls.map((args, index) => ({
    id: (animate.mock.contexts[index] as HTMLElement).dataset.rowId,
    first: (args[0] as Record<string, string | number>[])[0],
  }));
const tintedRows = () =>
  calls()
    .filter((c) => c.id && 'backgroundColor' in c.first)
    .map((c) => c.id);
const glidingRows = () =>
  calls()
    .filter((c) => c.id && String(c.first.transform ?? '').startsWith('translateY'))
    .map((c) => c.id);
const arrivingRows = () =>
  calls()
    .filter((c) => c.id && c.first.opacity === 0)
    .map((c) => c.id);
const sortBy = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));

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

  it("fades the tint into the row's own background (a selected row's tint), never through transparent", () => {
    const { rerender } = render(<Harness data={BASE} />);
    rerender(<Harness data={[BASE[0], { ...BASE[1], amount: 95 }, BASE[2]]} />);
    const tint = animate.mock.calls.find((args) => 'backgroundColor' in (args[0] as Keyframe[])[0])!;
    // One keyframe: WAAPI animates from it to the element's underlying value.
    expect(tint[0] as Keyframe[]).toHaveLength(1);
  });

  it('reads no layout on a render that neither sorts nor reorders rows (an edit)', () => {
    const { rerender } = render(<Harness data={BASE} />);
    topReads = 0;
    rerender(<Harness data={[BASE[0], { ...BASE[1], amount: 95 }, BASE[2]]} />);
    expect(topReads).toBe(0);
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

  it('on a sort, glides rows that stay on the page and fades in the rows it brings', () => {
    render(<Harness data={[...BASE, { id: 'v4', patient: 'Sami Odeh', amount: 2000 }]} pageSize={2} />);
    // Page 1 shows Sara (v1), Omar (v2). Amount sorts high-first: Sami (v4, arriving), Sara (v1, moving down).
    sortBy(/Amount/);
    expect(glidingRows()).toEqual(['v1']);
    expect(arrivingRows()).toEqual(['v4']);
    expect(tintedRows()).toEqual([]);
  });

  it('stays still when paging: no glide, no fade, no tint', () => {
    render(<Harness data={BASE} pageSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Dana Khalil')).toBeTruthy();
    expect(calls().filter((c) => c.id)).toEqual([]);
  });

  it('server-driven: glides when the sorted rows arrive after the sort, and does not tint them', () => {
    let sorting: SortingState = [];
    const onSort = (next: SortingState) => (sorting = next);
    const { rerender } = render(<ServerHarness data={BASE} sorting={sorting} onSort={onSort} />);
    sortBy(/Amount/);
    rerender(<ServerHarness data={BASE} sorting={sorting} onSort={onSort} />);
    expect(glidingRows()).toEqual([]);
    // The server answers with fresh objects in the new order (amount high-first).
    const answer = [BASE[0], BASE[2], BASE[1]].map((row) => ({ ...row }));
    rerender(<ServerHarness data={answer} sorting={sorting} onSort={onSort} />);
    expect(glidingRows().toSorted((a, b) => String(a).localeCompare(String(b)))).toEqual(['v2', 'v3']);
    expect(tintedRows()).toEqual([]);
  });

  it('never tints when most rows changed at once (fresh objects for the same rows)', () => {
    const { rerender } = render(<Harness data={BASE} />);
    rerender(<Harness data={BASE.map((row) => ({ ...row }))} />);
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
