import type { DataTableFilterMeta, DateRangeFilterValue, NumberRangeFilterValue } from '@app-types';
import type { KitCoreTable, KitFilterFn, KitTable } from './tableFeatures';
import type { RowData } from '@tanstack/react-table';

export type FilterCodec = {
  /** `undefined` means "no filter": omit the URL param / storage entry. */
  serialize: (value: unknown) => string | undefined;
  /** `undefined` means "ignore": malformed or empty input never throws. */
  parse: (raw: string) => unknown;
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

// Only the list separator (and the escape char itself) is escaped: the same string is sent to servers as a plain
// value, so URL encoding is left to nuqs / the HTTP client. Unescaping is manual, so a stray `%` can never throw.
const escapeItem = (item: string) => item.replaceAll('%', '%25').replaceAll(',', '%2C');
const unescapeItem = (item: string) => item.replaceAll(/%2C/gi, ',').replaceAll('%25', '%');

const listCodec: FilterCodec = {
  serialize: (value) => (Array.isArray(value) && value.length > 0 ? value.map((item) => escapeItem(String(item))).join(',') : undefined),
  parse: (raw) => {
    const values = raw.split(',').filter(Boolean).map(unescapeItem);
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
  (typeof value === 'string' || typeof value === 'number' ? String(value) : '')
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟ]/g, '')
    .toLowerCase();

// Loosely typed (`KitFilterFn<any>`) so one fn is assignable to any column's KitFilterFn<TData>.

/** Pair with `select` / `multiSelect`. */
export const inListFilterFn: KitFilterFn<any> = (row, columnId, filterValue) =>
  !Array.isArray(filterValue) || filterValue.length === 0 || filterValue.includes(String(row.getValue(columnId)));

/** Pair with `boolean`. */
export const booleanFilterFn: KitFilterFn<any> = (row, columnId, filterValue) =>
  typeof filterValue !== 'boolean' || row.getValue(columnId) === filterValue;

/** Pair with `text`. */
export const containsFilterFn: KitFilterFn<any> = (row, columnId, filterValue) =>
  typeof filterValue !== 'string' || !filterValue.trim() || fold(row.getValue(columnId)).includes(fold(filterValue.trim()));

/** Pair with `numberRange`. */
export const numberRangeFilterFn: KitFilterFn<any> = (row, columnId, filterValue) => {
  const { min, max } = (filterValue ?? {}) as NumberRangeFilterValue;
  if (min === undefined && max === undefined) return true;
  const cell = row.getValue(columnId);
  if (typeof cell !== 'number' || !Number.isFinite(cell)) return false;
  return (min === undefined || cell >= min) && (max === undefined || cell <= max);
};

/** Serializes every active column filter (and the search as `q`) for a server request. */
/** Takes the core table or the one useTable returns (both carry the store). */
export const getFilterQueryParams = <TData extends RowData>(table: KitCoreTable<TData>): Record<string, string> => {
  const params: Record<string, string> = {};

  for (const { id, value } of table.store.state.columnFilters) {
    const meta = table.getColumn(id)?.columnDef.meta?.filterMeta;
    const raw = meta ? filterCodecFor(meta).serialize(value) : undefined;
    if (raw !== undefined) params[id] = raw;
  }

  const search = table.store.state.globalFilter;
  if (typeof search === 'string' && search.trim()) params.q = search.trim();

  return params;
};
