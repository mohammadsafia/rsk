# DataTable filters: every type, persistent state

**Status:** approved design (brainstorm 2026-10-16)
**Branch:** `feat/ui-kit-composites`
**Builds on:**
- The filter bar redesign (commit `4886223`): one always-visible bar, `FilterPill`, active pills that stay in place.
- The SP3 composites spec.

## 1. Goal

A DataTable filter family that:
- **Covers every filter type a business table needs:** selects, dates and time, boolean, text and number range.
- **Keeps filters and search when the user navigates away and back** (sessionStorage).
- **Can put them in the URL** so a filtered view can be bookmarked and shared (opt-in per table).
- **Feeds the same filter state** to client-side filtering and to server-side API queries.

There is one filter implementation. The form-bound `shared/FacetedFilter` is removed.

## 2. Decisions (from the brainstorm)

| Question | Decision |
|---|---|
| Approach | **TanStack state + nuqs.** TanStack `columnFilters` + `globalFilter` stay the single source of truth; persistence and codecs are layered on. |
| URL | **Opt-in per table** (`urlSync`). Off by default. |
| Session | **Opt-in per table** (`storageKey`). Filters and search survive navigation. |
| Reset | "Clear filters" clears the column filters, the search, the URL params and the storage entry. |
| Filtering | **Both.** Client tables use ready-made `filterFns`; server tables get `getFilterQueryParams(table)`. |
| Forms | `shared/FacetedFilter` is deleted (used only by its own docs/demos). A form adapter is out of scope. |

## 3. Filter types

All types render through `FilterPill`:
- Inactive: a dashed `+ Label` pill.
- Active: `Label · summary`, with a separate ✕ remove button.
- Pills never move.

| Variant | Popover | Value (TanStack) | Codec string | Pill summary |
|---|---|---|---|---|
| `select` | Searchable list, radio | `string[]` (one) | `admin` | `Admin` |
| `multiSelect` | Searchable list, checkboxes | `string[]` | `admin,editor` | `Admin, Editor` / `Admin +2` |
| async (`select`/`multiSelect` with async `options`) | As above, server-searched | `string[]` | as above | Resolved labels |
| `date` | Calendar (single) | `yyyy-MM-dd` | `2026-01-01` | `Jan 01, 2026` |
| `dateRange` | Calendar (range, 2 months) | `{ from?, to? }` | `2026-01-01..2026-03-31`, open ends allowed (`2026-01-01..`) | `Jan 01 – Mar 31, 2026` |
| `time` | TimePicker | `HH:mm` / `hh:mm a` | `08:00` | `08:00` |
| **`boolean`** (new) | Two options: true label / false label | `boolean` | `true` / `false` | `Yes` / `No` (or the custom labels) |
| **`text`** (new) | One input, debounced 300 ms, "contains" | `string` | URL-encoded text | `"urgent"` |
| **`numberRange`** (new) | Min and max `FormattedNumber` fields + Apply | `{ min?, max? }` | `10..250`, `10..`, `..250` | `10 – 250`, `≥ 10`, `≤ 250` |

Rules for the new types:
- **`boolean`:**
  - Clearing (✕) means "Any".
  - `filterMeta.trueLabel` / `falseLabel` default to `common.yes` / `common.no`.
- **`text`:**
  - An empty input clears the filter.
  - The summary is truncated by the pill.
- **`numberRange`:**
  - Digits are Western and LTR-isolated.
  - Applying with min > max swaps the two.
  - Both ends empty clears the filter.
  - The optional `filterMeta.format` (`NumberFormatStyle`) formats the summary.

`createFilterMeta` gains overloads for `boolean`, `text` and `numberRange`.

`DataTableFilterMeta` becomes the union of:
- `SelectFilterMeta`
- `DateFilterMeta`
- `TimeFilterMeta`
- `BooleanFilterMeta`
- `TextFilterMeta`
- `NumberRangeFilterMeta`

## 4. Codecs

They live in `lib/utils/dataTableFilters.ts`. There is one codec per variant:

```ts
type FilterCodec<V> = { serialize: (value: V) => string | undefined; parse: (raw: string) => V | undefined };
export const filterCodecFor: (meta: DataTableFilterMeta) => FilterCodec<unknown>;
```

- `serialize(undefined | empty)` returns `undefined`, meaning the param or entry is omitted.
- `parse` of malformed input returns `undefined`, so the filter is ignored rather than throwing. Examples:
  - a bad date,
  - a non-number range bound,
  - an option value no longer in the list (kept for async lists, which resolve later).
- Round-trip law, tested per variant: `parse(serialize(v))` deep-equals `v` for every valid value.

## 5. Persistence: `useDataTableState`

```ts
useDataTableState(table, {
  urlSync?: boolean | { prefix: string };   // URL params: `${prefix}${columnId}`, plus `${prefix}q` for search
  storageKey?: string;                       // sessionStorage `rsk:table:${storageKey}`
}): { reset: () => void }
```

- **Hydration, once on mount:**
  - URL params when `urlSync` is on and any of this table's params is present.
  - Otherwise the session entry.
  - Otherwise the table's `initialState`.
  - Each column is decoded with its own codec. Unknown columns and bad values are dropped.
- **Writes, on every change of `columnFilters` / `globalFilter`:**
  - **URL:** nuqs, with `history: 'replace'`, so the filter changes don't fill the back stack.
  - **Session:** JSON of the serialized strings (`{ filters: { role: 'admin,editor' }, q: 'sara' }`).
  - Writes are wrapped in try/catch, so a blocked storage is ignored.
- **Reset:** `table.resetColumnFilters(true)`, `table.setGlobalFilter('')`, remove this table's URL params, and remove the storage entry.
  - The toolbar's "Clear filters" calls `reset` when the table registered one through `DataTable`'s context.
  - Otherwise it falls back to `resetColumnFilters(true)`, which is today's behaviour.
- **Search box:** the toolbar's local search state initialises from the hydrated `globalFilter`.
- **Pagination:** changing a filter resets `pageIndex` to 0. Page and sort persistence are out of scope.

## 6. Filtering functions

Exported from `@utils`:

| Name | Purpose |
|---|---|
| `inListFilterFn` | value in `string[]` |
| `booleanFilterFn` | strict equality with the boolean |
| `containsFilterFn` | case- and diacritic-insensitive substring; Arabic and Latin both work |
| `numberRangeFilterFn` | inclusive, open ends |

The existing `dateFilterFn`, `dateRangeFilterFn` and `timeFilterFn` stay.

A filter with an `undefined` value always passes.

`getFilterQueryParams(table): Record<string, string>` serializes every active column filter (and `q` for the global filter) with the codecs. Server pages pass it to their react-query key and fetch, with `manualFiltering: true`.

## 7. Removed

- `src/components/shared/faceted-filter/` and its docs page, plus the gallery demos that use it.
- The demos are replaced by a "Filters" demo on the DataTable docs page that shows every type.

## 8. i18n

New keys, EN and AR:
- `common.yes`, `common.no`
- `common.filterBar.{min, max, apply, any}`
- `common.filterBar.textPlaceholder`

Numbers stay Western in both languages.

## 9. Testing

- **Codecs:** a round-trip test per variant, and malformed input → `undefined`.
- **filterFns:** truth tables per type, including open-ended ranges and Arabic diacritics for `contains`.
- **`useDataTableState`:**
  - URL beats session beats `initialState`.
  - Writes reach the URL and session.
  - `reset` clears filters, search, URL and session.
  - A throwing `sessionStorage` does not crash anything.
  - Bad URL values are ignored.
- **Pills:** boolean, text and numberRange render inactive and active, and are removable. The numberRange min > max swap is covered. All in EN and AR.
- **Members page:**
  - Demonstrates `urlSync` + `storageKey` and a boolean column ("Two-factor").
  - Filters survive unmount and remount (sessionStorage).
- **Visual:** four-way screenshots of the bar with every type active.

## 10. Out of scope

- A form (react-hook-form) filter adapter.
- Saved or named views.
- Persisting sort and page.
- Server-side option counts.
