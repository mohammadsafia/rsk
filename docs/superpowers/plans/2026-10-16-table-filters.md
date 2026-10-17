# DataTable Filters — Every Type, Persistent State — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every filter type a business table needs (selects, dates and time, boolean, text, number range), with filters and search kept in sessionStorage and optionally in the URL. One shared codec drives client filtering, persistence and server query params.

**Architecture:**
- TanStack `columnFilters` + `globalFilter` remain the source of truth.
- A pure module (`lib/utils/dataTableFilters.ts`) holds the new filter-meta types, one string codec per variant, the client `filterFns`, and `getFilterQueryParams`.
- A hook `useDataTableFilters` turns that into **controlled** table state, read synchronously from the URL (nuqs) or sessionStorage on first render and written back on change.
- New filter components reuse `FilterPill`.

**Tech Stack:** React 18, TanStack Table 8, nuqs 2.8 (`useQueryStates`, `NuqsTestingAdapter`), react-i18next, Vite+ (`vp`), happy-dom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-16-table-filters-design.md`. This builds on commit `4886223` (FilterPill and the always-visible bar).

## Global Constraints

- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Gate commits on real exit codes. Package commands use `P() { corepack pnpm@10.34.7 "$@"; }`.
- UI rules:
  - Semantic tokens only.
  - JSX branches use `Conditional`.
  - `data-slot` on parts.
  - EN and AR keys land in the same commit.
  - Every control is `h-control-sm` (same as Input sm).
- Numbers are Western digits; number values and ranges are LTR-isolated (`dir="ltr"`, `tabular-nums`).
- Storage key: `rsk:table:<storageKey>`. Every read and write is in try/catch, so a blocked storage never breaks rendering.
- URL writes use `history: 'replace'`.
- Guards stay empty: `P ds:baseline` must write `{}`.
- Gate per task:

  ```bash
  P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P docs:lint && P exec vp test --run src tests
  ```

### Plan decisions not spelled out in the spec (keep them)

- **Hook shape (ruling against spec §5's `useDataTableState(table, …)` signature).** The plan uses `useDataTableFilters({ columns, urlSync?, storageKey? })`, which returns `{ state, onColumnFiltersChange, onGlobalFilterChange, reset }`, spread into `useReactTable`.
  - **Why:** an effect-based hydration runs after the toolbar's search box has initialised, and the toolbar's debounced `setGlobalFilter('')` would then wipe a restored query. Controlled state read on the first render avoids that race.
  - **Cost if wrong:** a rename.
- **Reset wiring.** `DataTable` gains an `onResetFilters?: () => void` prop and passes it through context. The toolbar's "Clear filters" calls it when present (otherwise `resetColumnFilters(true)` + `setGlobalFilter('')`), and always clears its own search box. "Clear filters" shows when a column filter **or** the search is active.
- **Value encoding.**
  - Option values: each is `encodeURIComponent`-ed, then joined with `,`.
  - Ranges use `..` with optional open ends.
  - Session storage holds the same serialized strings (`{ filters: Record<columnId, string>, q?: string }`), so the URL and session are interchangeable.
- **Column ids.** A column's id is `column.id ?? column.accessorKey` (strings only). Columns without `meta.filterMeta` are ignored by persistence.
- **Pagination.** TanStack's `autoResetPageIndex` (default on for client pagination) already returns to page 1 when filters change. No extra code.

## Review Focus

1. **A shared or bookmarked URL with bad values** (`?amount=abc..`, `?joined=2026-13-45`, an unknown column) must open the table normally, with only the valid filters applied. → Task 3 tests malformed and unknown params.
2. **Navigating away and back restores both filters and search text in the box**, not just the filtered rows. → Task 3 tests a remount restores `globalFilter` and the toolbar input value.
3. **Reset clears everything**: filters, search box, URL params and storage. A later remount must not resurrect them. → Task 3 tests a remount after reset.
4. **Number-range edge input**: min > max, a single open end, 0 as a bound. Zero is not "empty". → Tasks 1 and 2 test `0..` and the swap.
5. **Arabic text search ignores tashkeel**: "محمد" matches "مُحَمَّد". → Task 1 tests `containsFilterFn`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/types/DataTable.ts` | New meta types and value types | 1 |
| `src/lib/utils/dataTableFilters.ts` (new), `src/lib/utils/dataTable.ts` (`createFilterMeta` overloads), `src/lib/utils/index.ts` | Codecs, filterFns, query params | 1 |
| `src/components/tables/data-table-filters/{boolean,text,number-range}-filter/*` (new), `data-table-faceted-filter/DataTableFacetedFilter.tsx`, `src/locales/{en,ar}/common.json` | New filter UIs | 2 |
| `src/lib/hooks/shared/useDataTableFilters.ts` (new), `src/components/tables/data-table/DataTable.tsx`, `data-table-toolbar/DataTableToolbar.tsx` | Persistence and reset | 3 |
| delete `src/components/shared/faceted-filter/`, `src/component-docs/shared/FacetedFilter.mdx`; `src/pages/components/components.data.demos.tsx`; `src/component-docs/tables/DataTable.mdx`; `src/pages/members/MembersPage.tsx`; `src/locales/{en,ar}/members.json` | Cleanup, docs and the real page | 4 |
| — | Exit gate, screenshots, review | 5 |

---

### Task 1: Types, codecs, filter functions, query params

**Files:**
- Modify: `src/types/DataTable.ts` (after `TimeFilterMeta`)
- Create: `src/lib/utils/dataTableFilters.ts`, `src/lib/utils/dataTableFilters.test.ts`
- Modify: `src/lib/utils/dataTable.ts` (overloads), `src/lib/utils/index.ts` (export)

**Interfaces:**
- Produces:
  - **Types:**
    - `BooleanFilterMeta = FilterMetaBase & { variant: 'boolean'; trueLabel?: string; falseLabel?: string }`
    - `TextFilterMeta = FilterMetaBase & { variant: 'text' }`
    - `NumberRangeFilterMeta = FilterMetaBase & { variant: 'numberRange'; format?: NumberFormatStyle; min?: number; max?: number }`
    - `NumberRangeFilterValue = { min?: number; max?: number }`
    - `DataTableFilterMeta` widened to include the three new metas.
  - `type FilterCodec = { serialize(value: unknown): string | undefined; parse(raw: string): unknown | undefined }`
  - `filterCodecFor(meta: DataTableFilterMeta): FilterCodec`
  - `inListFilterFn`, `booleanFilterFn`, `containsFilterFn`, `numberRangeFilterFn`: `FilterFn<any>`
  - `getFilterQueryParams<TData>(table: Table<TData>): Record<string, string>`

- [ ] **Step 1: Write the failing test**

`src/lib/utils/dataTableFilters.test.ts`:

```ts
import { type ColumnDef, getCoreRowModel, getFilteredRowModel, createTable } from '@tanstack/react-table';
import { describe, expect, it } from 'vite-plus/test';

import type { DataTableFilterMeta } from '@app-types';

import { booleanFilterFn, containsFilterFn, filterCodecFor, getFilterQueryParams, inListFilterFn, numberRangeFilterFn } from './dataTableFilters';

const meta = (variant: string, extra: Record<string, unknown> = {}) => ({ variant, label: 'X', ...extra }) as unknown as DataTableFilterMeta;
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
      state: { columnFilters: [{ id: 'role', value: ['admin'] }, { id: 'amount', value: { min: 10 } }], globalFilter: 'sara' },
      onStateChange: () => {},
      renderFallbackValue: null,
    });
    expect(getFilterQueryParams(table)).toEqual({ role: 'admin', amount: '10..', q: 'sara' });
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/lib/utils/dataTableFilters.test.ts`
Expected: FAIL. `./dataTableFilters` does not exist.

- [ ] **Step 3: Types**

In `src/types/DataTable.ts`, after `TimeFilterMeta`, add the following and widen the union. `NumberFormatStyle` comes from `@utils`; if importing it into the types module creates a cycle, inline `'decimal' | 'currency' | 'percent'` and ledger it.

```ts
/** Yes / No filter; clearing it means "Any". */
export type BooleanFilterMeta = FilterMetaBase & {
  variant: 'boolean';
  /** @default t('common:yes') */
  trueLabel?: string;
  /** @default t('common:no') */
  falseLabel?: string;
};

/** Case- and diacritic-insensitive "contains" text filter. */
export type TextFilterMeta = FilterMetaBase & { variant: 'text' };

/** Inclusive numeric range; either end may be open. */
export type NumberRangeFilterMeta = FilterMetaBase & {
  variant: 'numberRange';
  /** Formats the pill summary. @default 'decimal' */
  format?: 'decimal' | 'currency' | 'percent';
  min?: number;
  max?: number;
};

export type DataTableFilterMeta = SelectFilterMeta | DateFilterMeta | TimeFilterMeta | BooleanFilterMeta | TextFilterMeta | NumberRangeFilterMeta;

/** Column filter value for the `numberRange` variant. */
export type NumberRangeFilterValue = { min?: number; max?: number };
```

Delete the old `export type DataTableFilterMeta = SelectFilterMeta | DateFilterMeta | TimeFilterMeta;` line.

Then fix the `isAsyncFilterMeta` guard and `DataTableFacetedFilter`'s `default:` branch, which assume "not date/time ⇒ select". `tsc -b` lists every narrowing site. In `DataTableFacetedFilter`, add `case 'select': case 'multiSelect':` explicitly. The new cases arrive in Task 2; until then, return `null` for `boolean`/`text`/`numberRange`.

- [ ] **Step 4: Implement `dataTableFilters.ts`**

```ts
import type { FilterFn, Table } from '@tanstack/react-table';

import type { DataTableFilterMeta, DateRangeFilterValue, NumberRangeFilterValue } from '@app-types';

export type FilterCodec = {
  /** `undefined` means "no filter": omit the URL param / storage entry. */
  serialize: (value: unknown) => string | undefined;
  /** `undefined` means "ignore": malformed or empty input never throws. */
  parse: (raw: string) => unknown | undefined;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^(\d{1,2}):(\d{2})(?:\s?(AM|PM))?$/i;
const RANGE = '..';

const isIsoDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const isTime = (value: unknown): value is string => {
  const match = typeof value === 'string' ? value.match(TIME) : null;
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return minutes < 60 && (match[3] ? hours >= 1 && hours <= 12 : hours < 24);
};

const listCodec: FilterCodec = {
  serialize: (value) => (Array.isArray(value) && value.length > 0 ? value.map((item) => encodeURIComponent(String(item))).join(',') : undefined),
  parse: (raw) => {
    const values = raw.split(',').filter(Boolean).map(decodeURIComponent);
    return values.length > 0 ? values : undefined;
  },
};

const dateCodec: FilterCodec = {
  serialize: (value) => (isIsoDate(value) ? value : undefined),
  parse: (raw) => (isIsoDate(raw) ? raw : undefined),
};

const dateRangeCodec: FilterCodec = {
  serialize: (value) => {
    const range = value as DateRangeFilterValue | undefined;
    const from = isIsoDate(range?.from) ? range.from : '';
    const to = isIsoDate(range?.to) ? range.to : '';
    return from || to ? `${from}${RANGE}${to}` : undefined;
  },
  parse: (raw) => {
    const parts = raw.split(RANGE);
    if (parts.length !== 2) return undefined;
    const [from, to] = parts;
    if ((from && !isIsoDate(from)) || (to && !isIsoDate(to)) || (!from && !to)) return undefined;
    return { ...(from && { from }), ...(to && { to }) } satisfies DateRangeFilterValue;
  },
};

const timeCodec: FilterCodec = {
  serialize: (value) => (isTime(value) ? value : undefined),
  parse: (raw) => (isTime(raw) ? raw : undefined),
};

const booleanCodec: FilterCodec = {
  serialize: (value) => (typeof value === 'boolean' ? String(value) : undefined),
  parse: (raw) => (raw === 'true' ? true : raw === 'false' ? false : undefined),
};

const textCodec: FilterCodec = {
  serialize: (value) => (typeof value === 'string' && value.trim() ? value : undefined),
  parse: (raw) => (raw.trim() ? raw : undefined),
};

const toNumber = (raw: string): number | undefined | null => {
  if (raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const numberRangeCodec: FilterCodec = {
  serialize: (value) => {
    const range = value as NumberRangeFilterValue | undefined;
    const min = typeof range?.min === 'number' && Number.isFinite(range.min) ? String(range.min) : '';
    const max = typeof range?.max === 'number' && Number.isFinite(range.max) ? String(range.max) : '';
    return min || max ? `${min}${RANGE}${max}` : undefined;
  },
  parse: (raw) => {
    const parts = raw.split(RANGE);
    if (parts.length !== 2) return undefined;
    const min = toNumber(parts[0]);
    const max = toNumber(parts[1]);
    if (min === null || max === null || (min === undefined && max === undefined)) return undefined;
    return { ...(min !== undefined && { min }), ...(max !== undefined && { max }) } satisfies NumberRangeFilterValue;
  },
};

export const filterCodecFor = (meta: DataTableFilterMeta): FilterCodec => {
  switch (meta.variant) {
    case 'date':
      return dateCodec;
    case 'dateRange':
      return dateRangeCodec;
    case 'time':
      return timeCodec;
    case 'boolean':
      return booleanCodec;
    case 'text':
      return textCodec;
    case 'numberRange':
      return numberRangeCodec;
    default:
      return listCodec;
  }
};

/** Lower-cases and strips Latin accents and Arabic tashkeel so "محمد" matches "مُحَمَّد". */
const fold = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟ]/g, '')
    .toLowerCase();

// Loosely typed (`FilterFn<any>`) so one fn is assignable to any column's FilterFn<TData>.

/** Pair with `select` / `multiSelect`. */
export const inListFilterFn: FilterFn<any> = (row, columnId, filterValue) =>
  !Array.isArray(filterValue) || filterValue.length === 0 || filterValue.includes(String(row.getValue(columnId)));

/** Pair with `boolean`. */
export const booleanFilterFn: FilterFn<any> = (row, columnId, filterValue) =>
  typeof filterValue !== 'boolean' || row.getValue(columnId) === filterValue;

/** Pair with `text`. */
export const containsFilterFn: FilterFn<any> = (row, columnId, filterValue) =>
  typeof filterValue !== 'string' || !filterValue.trim() || fold(row.getValue(columnId)).includes(fold(filterValue.trim()));

/** Pair with `numberRange`. */
export const numberRangeFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const { min, max } = (filterValue ?? {}) as NumberRangeFilterValue;
  if (min === undefined && max === undefined) return true;
  const cell = row.getValue(columnId);
  if (typeof cell !== 'number' || !Number.isFinite(cell)) return false;
  return (min === undefined || cell >= min) && (max === undefined || cell <= max);
};

/** Serializes every active column filter (and the search as `q`) for a server request. */
export const getFilterQueryParams = <TData>(table: Table<TData>): Record<string, string> => {
  const params: Record<string, string> = {};

  for (const { id, value } of table.getState().columnFilters) {
    const meta = table.getColumn(id)?.columnDef.meta?.filterMeta;
    const raw = meta ? filterCodecFor(meta).serialize(value) : undefined;
    if (raw !== undefined) params[id] = raw;
  }

  const search = table.getState().globalFilter;
  if (typeof search === 'string' && search.trim()) params.q = search.trim();

  return params;
};
```

Export from `src/lib/utils/index.ts`: `export * from './dataTableFilters';`.

The legacy `MembersPage` `inSelectedValues` stays until Task 4.

In `dataTable.ts`, add these `createFilterMeta` overloads before the implementation signature:

```ts
export function createFilterMeta(config: { variant: 'boolean'; label: string; trueLabel?: string; falseLabel?: string }): DataTableFilterMeta;
export function createFilterMeta(config: { variant: 'text'; label: string; placeholder?: string }): DataTableFilterMeta;
export function createFilterMeta(config: {
  variant: 'numberRange';
  label: string;
  format?: 'decimal' | 'currency' | 'percent';
  min?: number;
  max?: number;
}): DataTableFilterMeta;
```

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/lib/utils && P exec tsc -b`
Expected: PASS and exit 0.

Two implementation details that can bite:
- If `createTable` complains about missing options, add `state: {…}` as above.
- `getColumn` needs the columns' `accessorKey` ids.

- [ ] **Step 6: Commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(tables): filter codecs, boolean/text/number-range metas, filterFns and query params

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Boolean, text and number-range filter UIs

**Files:**
- Create: `src/components/tables/data-table-filters/boolean-filter/BooleanFilter.tsx`, `index.ts`; `text-filter/TextFilter.tsx`, `index.ts`; `number-range-filter/NumberRangeFilter.tsx`, `index.ts`
- Create: `src/components/tables/data-table-filters/new-filters.test.tsx`
- Modify: `data-table-filters/index.ts`, `data-table-faceted-filter/DataTableFacetedFilter.tsx`, `src/locales/{en,ar}/common.json` (`filterBar.{min,max,apply,textPlaceholder}`)

**Interfaces:**
- Consumes:
  - `FilterPill({ label, values, onClear })` (commit `4886223`)
  - `BooleanFilterMeta`, `TextFilterMeta`, `NumberRangeFilterMeta`, `NumberRangeFilterValue` (Task 1)
  - `FormattedNumber({ value, onChange, size })`
  - `useNumberFormat()` from `@utils`
- Produces:
  - `BooleanFilter`, `TextFilter`, `NumberRangeFilter`, each taking `{ column: Column<TData>; filterMeta }`.
  - `DataTableFacetedFilter` dispatches `boolean`, `text` and `numberRange`.

- [ ] **Step 1: Write the failing test**

`src/components/tables/data-table-filters/new-filters.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ColumnDef, type ColumnFiltersState, getCoreRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DataTable } from '@components/tables';
import { Tooltip } from '@components/ui';

import { booleanFilterFn, containsFilterFn, createFilterMeta, numberRangeFilterFn } from '@utils';

import i18n from '../../../i18n';

type Visit = { patient: string; insured: boolean; amount: number };

const columns: ColumnDef<Visit>[] = [
  { accessorKey: 'patient', filterFn: containsFilterFn, meta: { filterMeta: createFilterMeta({ variant: 'text', label: 'Patient' }) } },
  {
    accessorKey: 'insured',
    filterFn: booleanFilterFn,
    meta: { filterMeta: createFilterMeta({ variant: 'boolean', label: 'Insured', trueLabel: 'Insured', falseLabel: 'Self-pay' }) },
  },
  { accessorKey: 'amount', filterFn: numberRangeFilterFn, meta: { filterMeta: createFilterMeta({ variant: 'numberRange', label: 'Amount' }) } },
];

const rows: Visit[] = [
  { patient: 'Sara Haddad', insured: true, amount: 120 },
  { patient: 'Omar Nasser', insured: false, amount: 40 },
];

function Harness({ filters = [] }: { filters?: ColumnFiltersState }) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { columnFilters: filters },
  });
  return (
    <DataTable table={table}>
      <DataTable.Toolbar totalCount={table.getFilteredRowModel().rows.length} />
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
const open = (label: string) => fireEvent.click(pill(label).querySelector('button') as HTMLElement);

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('boolean filter', () => {
  it('shows its custom labels and applies a choice', async () => {
    renderBar();
    open('Insured');
    fireEvent.click(await screen.findByRole('option', { name: 'Self-pay' }));
    await waitFor(() => expect(pill('Insured').textContent).toContain('Self-pay'));
    expect(pill('Insured').hasAttribute('data-active')).toBe(true);
  });
});

describe('text filter', () => {
  it('applies typed text after a short debounce and summarises it in quotes', async () => {
    renderBar();
    open('Patient');
    fireEvent.change(await screen.findByRole('textbox', { name: 'Patient' }), { target: { value: 'sara' } });
    await waitFor(() => expect(pill('Patient').textContent).toContain('"sara"'), { timeout: 1500 });
  });
});

describe('number range filter', () => {
  it('summarises open and closed ranges with Western, LTR numbers', () => {
    renderBar([{ id: 'amount', value: { min: 0 } }]);
    const values = pill('Amount').querySelector('[data-slot="filter-pill-values"]') as HTMLElement;
    expect(values.textContent).toBe('≥ 0');
    expect(values.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('swaps min and max when applied backwards', async () => {
    renderBar();
    open('Amount');
    fireEvent.change(await screen.findByRole('textbox', { name: 'Minimum' }), { target: { value: '300' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Maximum' }), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(pill('Amount').textContent).toContain('100 – 300'));
  });

  it('labels its fields in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderBar();
    open('Amount');
    expect(await screen.findByRole('textbox', { name: 'الحد الأدنى' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/components/tables/data-table-filters/new-filters.test.tsx`
Expected: FAIL. The new variants render nothing.

- [ ] **Step 3: Keys**

EN `common.json`: `"filterBar": { "remove": …existing, "min": "Minimum", "max": "Maximum", "apply": "Apply", "textPlaceholder": "Contains…" }`.
AR: `"min": "الحد الأدنى", "max": "الحد الأقصى", "apply": "تطبيق", "textPlaceholder": "يحتوي على…"`.

`common.yes` and `common.no` already exist.

- [ ] **Step 4: Implement**

`boolean-filter/BooleanFilter.tsx`:

```tsx
import { useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { RadioGroup } from '@components/ui';
import { Combobox } from '@components/shared';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import type { BooleanFilterMeta } from '@app-types';

type BooleanFilterProps<TData> = { column: Column<TData>; filterMeta: BooleanFilterMeta };

function BooleanFilter<TData>({ column, filterMeta }: BooleanFilterProps<TData>) {
  const { t } = useAppTranslation('common');
  const [open, setOpen] = useState(false);
  const value = column.getFilterValue() as boolean | undefined;

  const options = [
    { value: true, label: filterMeta.trueLabel ?? t('yes') },
    { value: false, label: filterMeta.falseLabel ?? t('no') },
  ];
  const active = options.find((option) => option.value === value);

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <FilterPill label={filterMeta.label} values={active ? [active.label] : []} onClear={() => column.setFilterValue(undefined)} />

      <Combobox.Content className="min-w-48" shouldFilter={false}>
        <Combobox.List>
          {options.map((option) => (
            <Combobox.Item
              key={String(option.value)}
              value={option.label}
              data-checked={option.value === value || undefined}
              onSelect={() => {
                column.setFilterValue(option.value === value ? undefined : option.value);
                setOpen(false);
              }}
            >
              <Combobox.Indicator>
                <RadioGroup.Dot checked={option.value === value} />
              </Combobox.Indicator>

              {option.label}
            </Combobox.Item>
          ))}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}

export default BooleanFilter;
```

`text-filter/TextFilter.tsx`:

```tsx
import { useEffect, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Input, Popover } from '@components/ui';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation, useDebounce } from '@hooks/shared';

import type { TextFilterMeta } from '@app-types';

type TextFilterProps<TData> = { column: Column<TData>; filterMeta: TextFilterMeta };

function TextFilter<TData>({ column, filterMeta }: TextFilterProps<TData>) {
  const { t, direction } = useAppTranslation('common');
  const value = (column.getFilterValue() as string | undefined) ?? '';
  const [draft, setDraft] = useState(value);
  const debounced = useDebounce(draft, 300);

  useEffect(() => {
    if (debounced.trim() === value) return;
    column.setFilterValue(debounced.trim() || undefined);
  }, [debounced, value, column]);

  // A reset from outside (✕, Clear filters) empties the box too.
  useEffect(() => {
    if (!value) setDraft('');
  }, [value]);

  return (
    <Popover>
      <FilterPill label={filterMeta.label} values={value ? [`"${value}"`] : []} onClear={() => column.setFilterValue(undefined)} />

      <Popover.Content align="start" className="w-64 p-2">
        <Input
          size="sm"
          dir={direction}
          aria-label={filterMeta.label}
          placeholder={filterMeta.placeholder ?? t('filterBar.textPlaceholder')}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoFocus
        />
      </Popover.Content>
    </Popover>
  );
}

export default TextFilter;
```

`number-range-filter/NumberRangeFilter.tsx`:

```tsx
import { useEffect, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Button, FormattedNumber, Popover } from '@components/ui';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import { useNumberFormat } from '@utils';

import type { NumberRangeFilterMeta, NumberRangeFilterValue } from '@app-types';

type NumberRangeFilterProps<TData> = { column: Column<TData>; filterMeta: NumberRangeFilterMeta };

function NumberRangeFilter<TData>({ column, filterMeta }: NumberRangeFilterProps<TData>) {
  const { t } = useAppTranslation('common');
  const formatNumber = useNumberFormat();
  const value = (column.getFilterValue() as NumberRangeFilterValue | undefined) ?? {};
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState<number | null>(value.min ?? null);
  const [max, setMax] = useState<number | null>(value.max ?? null);

  useEffect(() => {
    if (!open) return;
    setMin(value.min ?? null);
    setMax(value.max ?? null);
  }, [open, value.min, value.max]);

  const format = (n: number) => formatNumber(n, { style: filterMeta.format ?? 'decimal' });
  const hasMin = value.min !== undefined;
  const hasMax = value.max !== undefined;
  const summary = hasMin && hasMax ? `${format(value.min!)} – ${format(value.max!)}` : hasMin ? `≥ ${format(value.min!)}` : hasMax ? `≤ ${format(value.max!)}` : '';

  const apply = () => {
    const [low, high] = min !== null && max !== null && min > max ? [max, min] : [min, max];
    const next: NumberRangeFilterValue = { ...(low !== null && { min: low }), ...(high !== null && { max: high }) };
    column.setFilterValue(next.min === undefined && next.max === undefined ? undefined : next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterPill
        label={filterMeta.label}
        values={summary ? [summary] : []}
        renderValues={(text) => (
          <span dir="ltr" className="tabular-nums">
            {text}
          </span>
        )}
        onClear={() => column.setFilterValue(undefined)}
      />

      <Popover.Content align="start" className="w-72 p-3">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <FormattedNumber size="sm" aria-label={t('filterBar.min')} placeholder={t('filterBar.min')} value={min} onChange={setMin} min={filterMeta.min} max={filterMeta.max} />
            <FormattedNumber size="sm" aria-label={t('filterBar.max')} placeholder={t('filterBar.max')} value={max} onChange={setMax} min={filterMeta.min} max={filterMeta.max} />
          </div>

          <Button type="submit" size="sm" className="self-end">
            {t('filterBar.apply')}
          </Button>
        </form>
      </Popover.Content>
    </Popover>
  );
}

export default NumberRangeFilter;
```

`summary`'s nested ternary computes a string value, not JSX, so it's allowed under the `Conditional` rule. If lint flags nested ternaries, extract `rangeSummary(value, format)`.

`FilterPill` gains an optional `renderValues?: (text: string) => ReactNode` prop, rendered inside the `filter-pill-values` span (default: the text). It's the only way to LTR-isolate the number summary without breaking the pill's layout. Add it to `FilterPill.tsx` with a one-line JSDoc.

Check `FormattedNumber`'s `aria-label` passthrough. If the rendered input's accessible name is not the `aria-label` (e.g. it wraps the input), use whatever prop it exposes for the input's label, and keep the test's names.

Add the `index.ts` files (`export { default as BooleanFilter } from './BooleanFilter';` and the others), export them from `data-table-filters/index.ts`, and dispatch them in `DataTableFacetedFilter`:

```tsx
    case 'boolean':
      return <BooleanFilter column={column} filterMeta={filterMeta} />;

    case 'text':
      return <TextFilter column={column} filterMeta={filterMeta} />;

    case 'numberRange':
      return <NumberRangeFilter column={column} filterMeta={filterMeta} />;
```

- [ ] **Step 5: Run tests and commit**

```bash
P exec vp test --run src/components/tables tests/i18n && P exec tsc -b && P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(tables): boolean, text and number-range filters on FilterPill

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `useDataTableFilters` — URL and session persistence, reset

**Files:**
- Create: `src/lib/hooks/shared/useDataTableFilters.ts`, `src/lib/hooks/shared/useDataTableFilters.test.tsx`
- Modify: `src/lib/hooks/shared/index.ts` (export); `src/components/tables/data-table/DataTable.tsx` (`onResetFilters` prop + context); `data-table-toolbar/DataTableToolbar.tsx` (Clear calls it, clears the search box, shows when searching)

**Interfaces:**
- Consumes: `filterCodecFor` (Task 1); nuqs `useQueryStates`, `parseAsString`.
- Produces: `useDataTableFilters<TData>({ columns, urlSync?, storageKey? })` → `{ state: { columnFilters, globalFilter }, onColumnFiltersChange, onGlobalFilterChange, reset }`.
  - `urlSync`: `boolean | { prefix: string }`.
  - `DataTable` prop `onResetFilters?: () => void`.

- [ ] **Step 1: Write the failing test**

`src/lib/hooks/shared/useDataTableFilters.test.tsx`:

```tsx
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
  { accessorKey: 'amount', filterFn: numberRangeFilterFn, meta: { filterMeta: createFilterMeta({ variant: 'numberRange', label: 'Amount' }) } },
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
      <p data-testid="names">{table.getFilteredRowModel().rows.map((row) => row.original.name).join(',')}</p>
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
```

If `UrlUpdateEvent` has a different field name than `queryString` in nuqs 2.8, check `node_modules/nuqs/dist/adapters/testing.d.ts` and use the real field (`searchParams.toString()` is fine too).

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/lib/hooks/shared/useDataTableFilters.test.tsx`
Expected: FAIL. `useDataTableFilters` is not exported.

- [ ] **Step 3: Implement the hook**

`src/lib/hooks/shared/useDataTableFilters.ts`:

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ColumnDef, ColumnFiltersState, OnChangeFn } from '@tanstack/react-table';
import { parseAsString, useQueryStates } from 'nuqs';

import type { DataTableFilterMeta } from '@app-types';

import { filterCodecFor } from '@utils';

type Options<TData> = {
  columns: ColumnDef<TData, any>[];
  /** Mirror filters and search in the URL. `{ prefix }` namespaces params when a page has two tables. */
  urlSync?: boolean | { prefix: string };
  /** Keep filters and search in sessionStorage (`rsk:table:<storageKey>`) across navigation. */
  storageKey?: string;
};

type Stored = { filters: Record<string, string>; q?: string };

const columnIdOf = (column: ColumnDef<any, any>) => column.id ?? ('accessorKey' in column ? String(column.accessorKey) : undefined);

const readSession = (key: string | undefined): Stored | undefined => {
  if (!key) return undefined;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stored) : undefined;
  } catch {
    return undefined;
  }
};

const writeSession = (key: string | undefined, value: Stored | undefined) => {
  if (!key) return;
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
  } catch {
    // Storage blocked: filters just aren't remembered.
  }
};

export const useDataTableFilters = <TData>({ columns, urlSync = false, storageKey }: Options<TData>) => {
  const prefix = typeof urlSync === 'object' ? urlSync.prefix : '';
  const sessionKey = storageKey ? `rsk:table:${storageKey}` : undefined;

  const filterable = useMemo(
    () =>
      columns.flatMap((column) => {
        const id = columnIdOf(column);
        const meta = column.meta?.filterMeta as DataTableFilterMeta | undefined;
        return id && meta ? [{ id, codec: filterCodecFor(meta) }] : [];
      }),
    [columns],
  );

  const parsers = useMemo(
    () => Object.fromEntries([...filterable.map(({ id }) => [`${prefix}${id}`, parseAsString]), [`${prefix}q`, parseAsString]]),
    [filterable, prefix],
  );
  const [params, setParams] = useQueryStates(parsers, { history: 'replace' });

  const decode = useCallback(
    (source: Stored): { columnFilters: ColumnFiltersState; globalFilter: string } => ({
      columnFilters: filterable.flatMap(({ id, codec }) => {
        const raw = source.filters[id];
        const value = raw === undefined ? undefined : codec.parse(raw);
        return value === undefined ? [] : [{ id, value }];
      }),
      globalFilter: source.q ?? '',
    }),
    [filterable],
  );

  const encode = useCallback(
    (columnFilters: ColumnFiltersState, globalFilter: string): Stored | undefined => {
      const filters: Record<string, string> = {};
      for (const { id, value } of columnFilters) {
        const raw = filterable.find((entry) => entry.id === id)?.codec.serialize(value);
        if (raw !== undefined) filters[id] = raw;
      }
      const q = globalFilter.trim();
      return Object.keys(filters).length > 0 || q ? { filters, ...(q && { q }) } : undefined;
    },
    [filterable],
  );

  // Read once, synchronously, so the toolbar's search box starts with the restored text.
  const [initial] = useState(() => {
    if (urlSync) {
      const fromUrl: Stored = { filters: {} };
      for (const { id } of filterable) {
        const raw = params[`${prefix}${id}`];
        if (typeof raw === 'string') fromUrl.filters[id] = raw;
      }
      const q = params[`${prefix}q`];
      if (typeof q === 'string') fromUrl.q = q;
      if (Object.keys(fromUrl.filters).length > 0 || fromUrl.q) return decode(fromUrl);
    }
    const stored = readSession(sessionKey);
    return stored?.filters ? decode(stored) : { columnFilters: [], globalFilter: '' };
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initial.columnFilters);
  const [globalFilter, setGlobalFilter] = useState<string>(initial.globalFilter);

  useEffect(() => {
    const stored = encode(columnFilters, globalFilter);
    writeSession(sessionKey, stored);

    if (!urlSync) return;
    const next: Record<string, string | null> = { [`${prefix}q`]: stored?.q ?? null };
    for (const { id } of filterable) next[`${prefix}${id}`] = stored?.filters[id] ?? null;
    void setParams(next);
  }, [columnFilters, globalFilter, encode, sessionKey, urlSync, prefix, filterable, setParams]);

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = useCallback(
    (updater) => setColumnFilters((current) => (typeof updater === 'function' ? updater(current) : updater)),
    [],
  );
  const onGlobalFilterChange: OnChangeFn<string> = useCallback(
    (updater) => setGlobalFilter((current) => String((typeof updater === 'function' ? updater(current) : updater) ?? '')),
    [],
  );

  const reset = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter('');
  }, []);

  return { state: { columnFilters, globalFilter }, onColumnFiltersChange, onGlobalFilterChange, reset };
};
```

The URL write and the session write happen in the same effect. Reset empties state, and the effect then removes both: the URL params are set to `null` and the session item is removed.

Export from `src/lib/hooks/shared/index.ts`: `export * from './useDataTableFilters';`.

A `nuqs` import in `hooks/shared` makes every `@hooks/shared` consumer need a nuqs adapter **only when the hook is called**. Importing it is harmless. Pages that don't call it are unaffected.

- [ ] **Step 4: DataTable and toolbar**

In `DataTable.tsx`:
- Add `onResetFilters?: () => void` to `DataTableRootProps`.
- Add it to the context value type, the `useMemo`, and its dependency list.

In `DataTableToolbar.tsx`:
- Read `onResetFilters` from `useDataTableContext()`.
- `const isSearching = !!table.getState().globalFilter;`
- The Clear button shows when `hasActive || isSearching`. Its handler:

```tsx
          onClick={() => {
            if (onResetFilters) onResetFilters();
            else {
              table.resetColumnFilters(true);
              table.setGlobalFilter('');
            }
            setSearch('');
          }}
```

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/lib/hooks src/components/tables && P exec tsc -b`
Expected: PASS (5 hook tests plus the existing table tests) and exit 0.

The "writes" test waits for nuqs's throttled URL update (≈ 50 ms). If 50 ms is too short in happy-dom, raise it to 150 ms and ledger it. Never mock nuqs.

- [ ] **Step 6: Commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(tables): useDataTableFilters — URL (opt-in) and session persistence; Clear resets URL, session and search

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Retire `FacetedFilter`; Members and docs show every type

**Files:**
- Delete: `src/components/shared/faceted-filter/`, `src/component-docs/shared/FacetedFilter.mdx`; drop the barrel line in `src/components/shared/index.ts`
- Modify: `src/pages/components/components.data.demos.tsx` (remove `FacetedFilterDemo` and its import, and its registration wherever demos are listed: `grep -rn "FacetedFilterDemo" src`)
- Modify: `src/pages/members/MembersPage.tsx` (persistence + boolean, text and number-range columns), `src/locales/{en,ar}/members.json`
- Modify: `src/component-docs/tables/DataTable.mdx` ("Filters" section: every type, `useDataTableFilters`, `getFilterQueryParams`)
- Modify: `src/pages/members/MembersPage.test.tsx`

**Interfaces:**
- Consumes: Tasks 1–3.

- [ ] **Step 1: Write the failing test**

Append to `src/pages/members/MembersPage.test.tsx`:

```tsx
describe('MembersPage filters', () => {
  it('offers every filter type and keeps them across a remount', async () => {
    sessionStorage.clear();
    const mount = () =>
      render(
        <NuqsTestingAdapter>
          <QueryClientProvider client={new QueryClient()}>
            <Tooltip.Provider>
              <MemoryRouter>
                <MembersPage />
              </MemoryRouter>
            </Tooltip.Provider>
          </QueryClientProvider>
        </NuqsTestingAdapter>,
      );

    mount();
    const labels = [...document.querySelectorAll('[data-slot="filter-pill"]')].map((node) => node.getAttribute('data-filter'));
    expect(labels).toEqual(expect.arrayContaining(['Name', 'Role', 'Status', 'Two-factor', 'Sessions', 'Joined', 'Shift start']));

    fireEvent.click(document.querySelector('[data-slot="filter-pill"][data-filter="Two-factor"] button') as HTMLElement);
    fireEvent.click(await screen.findByRole('option', { name: 'On' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    cleanup();

    mount();
    expect(document.querySelector('[data-slot="filter-pill"][data-filter="Two-factor"]')?.hasAttribute('data-active')).toBe(true);
  });
});
```

Add the imports this needs: `act`, `fireEvent` from testing-library, `NuqsTestingAdapter` from `nuqs/adapters/testing`, and `describe`. Then wrap the **existing** MembersPage test's render in `NuqsTestingAdapter` too: the page now calls `useDataTableFilters`.

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/pages/members`
Expected: FAIL. There are no `Two-factor`/`Sessions`/`Name` filters.

- [ ] **Step 3: Members page**

- **Data:** extend `Member` with `twoFactor: boolean` (`i % 3 !== 0`) and `sessions: number` (`(i * 7) % 40`).
- **Name column:** gets `filterFn: containsFilterFn` and `meta.filterMeta: createFilterMeta({ variant: 'text', label: t('columns.name') })`.
- **Role/Status:** replace `inSelectedValues` with `inListFilterFn` and delete the local helper.
- **New columns:**

```tsx
    {
      accessorKey: 'twoFactor',
      header: t('columns.twoFactor'),
      filterFn: booleanFilterFn,
      cell: ({ row }) => (
        <Badge variant="dot" tone={row.original.twoFactor ? 'success' : 'neutral'}>
          {t(row.original.twoFactor ? 'twoFactor.on' : 'twoFactor.off')}
        </Badge>
      ),
      meta: {
        label: t('columns.twoFactor'),
        filterMeta: createFilterMeta({ variant: 'boolean', label: t('columns.twoFactor'), trueLabel: t('twoFactor.on'), falseLabel: t('twoFactor.off') }),
      },
    },
    {
      accessorKey: 'sessions',
      header: t('columns.sessions'),
      filterFn: numberRangeFilterFn,
      cell: ({ row }) => <span className="tabular-nums">{row.original.sessions}</span>,
      meta: { label: t('columns.sessions'), numeric: true, filterMeta: createFilterMeta({ variant: 'numberRange', label: t('columns.sessions'), min: 0 }) },
    },
```

- **Persistence:**

```tsx
  const filters = useDataTableFilters({ columns, urlSync: true, storageKey: 'members' });
```

  Pass `state: filters.state, onColumnFiltersChange: filters.onColumnFiltersChange, onGlobalFilterChange: filters.onGlobalFilterChange` to `useReactTable`, and `onResetFilters={filters.reset}` to `<DataTable>`.

- **Keys:**
  - EN `members.json`: `columns.twoFactor: "Two-factor"`, `columns.sessions: "Sessions"`, `twoFactor: { on: "On", off: "Off" }`.
  - AR: `"columns.twoFactor": "التحقق بخطوتين"`, `"columns.sessions": "الجلسات"`, `"twoFactor": { "on": "مفعّل", "off": "غير مفعّل" }`.

  The test uses English names: the test renders under `en`.

- [ ] **Step 4: Retire FacetedFilter**

```bash
git rm -rq src/components/shared/faceted-filter src/component-docs/shared/FacetedFilter.mdx
sed -i '' "/faceted-filter/d" src/components/shared/index.ts
grep -rn "FacetedFilterDemo\|from '@components/shared'.*FacetedFilter" src
```

Remove `FacetedFilterDemo` (lines around 738–770) and `FacetedFilter` from the `components.data.demos.tsx` import, plus any registration the grep shows.

The DataTable's own `DataTableFacetedFilter` stays. It is the table dispatcher and is unrelated to the deleted component.

`grep -rn "FacetedFilter" src | grep -v DataTableFacetedFilter` must print nothing.

- [ ] **Step 5: DataTable docs**

Add a `## Filters` section to `DataTable.mdx` after "Usage Pattern":
1. A table of every variant: variant / popover / value / URL form / client `filterFn`. These are the spec §3 rows plus the `filterFn` column.
2. A code block for a column with each new type (`createFilterMeta({ variant: 'boolean' | 'text' | 'numberRange', … })`).
3. A code block for persistence:

```tsx
const filters = useDataTableFilters({ columns, urlSync: true, storageKey: 'patients' });
const table = useReactTable({ ..., state: filters.state, onColumnFiltersChange: filters.onColumnFiltersChange, onGlobalFilterChange: filters.onGlobalFilterChange });
<DataTable table={table} onResetFilters={filters.reset}>…</DataTable>
```

4. A code block for server tables:

```tsx
const params = getFilterQueryParams(table);
useQuery({ queryKey: ['patients', params, pagination], queryFn: () => api.patients.list({ ...params, page }) });
// useReactTable({ manualFiltering: true, ... })
```

5. One sentence: the URL is opt-in, the session survives navigation, and "Clear filters" clears both.

- [ ] **Step 6: Run tests and commit**

```bash
P exec vp test --run src tests && P exec tsc -b && P docs:lint && P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(tables): Members on persistent filters with every type; retire the form-bound FacetedFilter; docs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Exit — full gate, four-way screenshots

- [ ] **Step 1: Full gate**

```bash
P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && \
P exec vp build > /tmp/build.log 2>&1 && P docs:lint && P exec vp test --run src tests; echo "exit $?"
```

Expected: `exit 0` and baseline `{}`.

- [ ] **Step 2: Screenshots**

With `vp dev --port 5199` and playwright-cli, take `/members` in dark/light × EN/AR with these active:
- Two-factor: Off
- Sessions ≥ 10
- Name "a"
- Role: two values
- Joined: a range

Then:
- open each new popover once;
- reload the page and confirm the filters and search come back;
- check the URL shows `?twoFactor=false&sessions=10..`;
- click "Clear filters" and confirm the URL and session are clean.

Read each shot. Fix anything clipped, misaligned, or not LTR-isolated, and record each fix.

- [ ] **Step 3: Commit**

```bash
git add -A src tests && git commit -m "test(tables): filter family exit — every type, persistence, four-way screenshots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
