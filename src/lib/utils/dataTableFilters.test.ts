import { type ColumnDef, getCoreRowModel, getFilteredRowModel, createTable } from '@tanstack/react-table';
import { describe, expect, it } from 'vite-plus/test';

import type { DataTableFilterMeta } from '@app-types';

import {
  booleanFilterFn,
  containsFilterFn,
  filterCodecFor,
  getFilterQueryParams,
  inListFilterFn,
  numberRangeFilterFn,
} from './dataTableFilters';

const meta = (variant: string, extra: Record<string, unknown> = {}) =>
  ({ variant, label: 'X', ...extra }) as unknown as DataTableFilterMeta;
const select = meta('multiSelect', { options: [], getOptionLabel: String, getOptionValue: String });

describe('filter codecs', () => {
  const cases: Array<[string, DataTableFilterMeta, unknown, string]> = [
    ['multiSelect', select, ['admin', 'a,b'], 'admin,a%2Cb'],
    ['date', meta('date'), '2026-01-01', '2026-01-01'],
    ['dateRange', meta('dateRange'), { from: '2026-01-01', to: '2026-03-31' }, '2026-01-01..2026-03-31'],
    ['dateRange open end', meta('dateRange'), { from: '2026-01-01' }, '2026-01-01..'],
    ['time', meta('time'), '08:00 AM', '08:00 AM'],
    ['boolean', meta('boolean'), false, 'false'],
    ['text', meta('text'), 'urgent care', 'urgent care'],
    ['numberRange', meta('numberRange'), { min: 0, max: 250 }, '0..250'],
    ['numberRange open start', meta('numberRange'), { max: 250 }, '..250'],
  ];

  for (const [name, filterMeta, value, raw] of cases) {
    it(`${name} round-trips`, () => {
      const codec = filterCodecFor(filterMeta);
      expect(codec.serialize(value)).toBe(raw);
      expect(codec.parse(raw)).toEqual(value);
    });
  }

  it('omits empty values and ignores malformed input', () => {
    expect(filterCodecFor(select).serialize([])).toBeUndefined();
    expect(filterCodecFor(meta('text')).serialize('')).toBeUndefined();
    expect(filterCodecFor(meta('numberRange')).serialize({})).toBeUndefined();
    expect(filterCodecFor(meta('date')).parse('2026-13-45')).toBeUndefined();
    expect(filterCodecFor(meta('dateRange')).parse('nope')).toBeUndefined();
    expect(filterCodecFor(meta('numberRange')).parse('abc..')).toBeUndefined();
    expect(filterCodecFor(meta('boolean')).parse('yes')).toBeUndefined();
    expect(filterCodecFor(meta('time')).parse('25:99')).toBeUndefined();
  });
});

type Row = { name: string; role: string; insured: boolean; amount: number | null };

const rows: Row[] = [
  { name: 'مُحَمَّد Haddad', role: 'admin', insured: true, amount: 0 },
  { name: 'Lina Khoury', role: 'editor', insured: false, amount: 120 },
  { name: 'Omar Nasser', role: 'viewer', insured: true, amount: null },
];

const matches = (fn: typeof inListFilterFn, columnId: keyof Row, value: unknown) =>
  rows.filter((row) => fn({ getValue: (id: string) => row[id as keyof Row] } as never, columnId, value, () => {})).map((row) => row.role);

describe('filter functions', () => {
  it('inList keeps rows whose value is selected; no selection keeps all', () => {
    expect(matches(inListFilterFn, 'role', ['admin', 'viewer'])).toEqual(['admin', 'viewer']);
    expect(matches(inListFilterFn, 'role', undefined)).toHaveLength(3);
  });

  it('boolean compares strictly', () => {
    expect(matches(booleanFilterFn, 'insured', false)).toEqual(['editor']);
    expect(matches(booleanFilterFn, 'insured', undefined)).toHaveLength(3);
  });

  it('contains ignores case and Arabic diacritics', () => {
    expect(matches(containsFilterFn, 'name', 'محمد')).toEqual(['admin']);
    expect(matches(containsFilterFn, 'name', 'LINA')).toEqual(['editor']);
  });

  it('numberRange is inclusive, treats 0 as a value and drops non-numbers', () => {
    expect(matches(numberRangeFilterFn, 'amount', { min: 0 })).toEqual(['admin', 'editor']);
    expect(matches(numberRangeFilterFn, 'amount', { max: 0 })).toEqual(['admin']);
    expect(matches(numberRangeFilterFn, 'amount', {})).toHaveLength(3);
  });
});

describe('getFilterQueryParams', () => {
  it('serializes active filters and the search with the codecs', () => {
    const columns: ColumnDef<Row>[] = [
      { accessorKey: 'role', meta: { filterMeta: select } },
      { accessorKey: 'amount', meta: { filterMeta: meta('numberRange') } },
      { accessorKey: 'name' },
    ];
    const table = createTable<Row>({
      data: rows,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        columnFilters: [
          { id: 'role', value: ['admin'] },
          { id: 'amount', value: { min: 10 } },
        ],
        globalFilter: 'sara',
      },
      onStateChange: () => {},
      renderFallbackValue: null,
    });
    expect(getFilterQueryParams(table)).toEqual({ role: 'admin', amount: '10..', q: 'sara' });
  });
});
