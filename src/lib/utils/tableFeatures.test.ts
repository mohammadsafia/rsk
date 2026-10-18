// src/lib/utils/tableFeatures.test.ts
// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { useTable } from '@tanstack/react-table';
import { describe, expect, it } from 'vite-plus/test';

import { type KitColumnDef, kitFeatures } from './tableFeatures';

type Row = { id: string; name: string; amount: number };
const data: Row[] = [
  { id: 'a', name: 'Sara', amount: 30 },
  { id: 'b', name: 'Omar', amount: 10 },
  { id: 'c', name: 'Dana', amount: 20 },
];
const columns: KitColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount', meta: { numeric: true } },
];

describe('kit table features on v9', () => {
  it('sorts, filters, paginates and pins with the kit feature set', () => {
    const { result } = renderHook(() =>
      useTable({
        features: kitFeatures,
        data,
        columns,
        getRowId: (row) => row.id,
        initialState: {
          sorting: [{ id: 'amount', desc: false }],
          pagination: { pageIndex: 0, pageSize: 2 },
          columnPinning: { start: ['name'], end: [] },
        },
      }),
    );
    const table = result.current;
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(['b', 'c']);
    expect(table.getColumn('amount')?.columnDef.meta?.numeric).toBe(true);
    expect(table.getStartLeafColumns().map((column) => column.id)).toEqual(['name']);
    expect(table.state.pagination.pageSize).toBe(2);
  });

  it('sorts strings and ISO dates with the default (auto) sort, ascending and descending', () => {
    const dated = [
      { id: 'a', name: 'Sara', issuedAt: '2026-10-02' },
      { id: 'b', name: 'Omar', issuedAt: '2026-10-09' },
      { id: 'c', name: 'Dana', issuedAt: '2026-09-30' },
    ];
    const datedColumns: KitColumnDef<(typeof dated)[number]>[] = [{ accessorKey: 'name' }, { accessorKey: 'issuedAt' }];
    const ids = (sorting: { id: string; desc: boolean }[]) =>
      renderHook(() =>
        useTable({ features: kitFeatures, data: dated, columns: datedColumns, getRowId: (row) => row.id, initialState: { sorting } }),
      )
        .result.current.getRowModel()
        .rows.map((row) => row.id);
    expect(ids([{ id: 'name', desc: false }])).toEqual(['c', 'b', 'a']);
    expect(ids([{ id: 'issuedAt', desc: true }])).toEqual(['b', 'a', 'c']);
  });

  it('sorts text the way people expect: ignoring case, with numbers in natural order (v8 "alphanumeric")', () => {
    const named = ['bob', 'Alice', 'Item 10', 'Item 2', 'carl'].map((name, index) => ({ id: String(index), name }));
    const { result } = renderHook(() =>
      useTable({
        features: kitFeatures,
        data: named,
        columns: [{ accessorKey: 'name' }] as KitColumnDef<(typeof named)[number]>[],
        getRowId: (row) => row.id,
        initialState: { sorting: [{ id: 'name', desc: false }] },
      }),
    );
    expect(result.current.getRowModel().rows.map((row) => row.original.name)).toEqual(['Alice', 'bob', 'carl', 'Item 2', 'Item 10']);
  });
});
