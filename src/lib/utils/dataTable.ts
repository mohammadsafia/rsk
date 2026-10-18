import type { CSSProperties, MouseEvent } from 'react';

import { ColumnSort } from '@tanstack/react-table';
import { createParser } from 'nuqs';

import type { AsyncOptionsFn, DateFormat } from '@hooks/shared';

import type { DataTableFilterMeta, DateRangeFilterValue } from '@app-types';
import type { KitColumn, KitFilterFn } from './tableFeatures';
import type { RowData } from '@tanstack/react-table';

const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="switch"]',
  '[data-disable-row-click]',
].join(',');

/**
 * Detects whether a row-level click originated from an interactive element.
 * Mark non-semantic clickable elements with `data-disable-row-click`.
 */
export const isInteractiveClick = (event: MouseEvent<HTMLElement>): boolean => {
  const target = event.target as HTMLElement | null;

  return !!target?.closest(INTERACTIVE_SELECTOR);
};

/**
 * Returns CSS styles for pinned (sticky) columns.
 * Handles start/end pinning (logical, so it mirrors in RTL) with proper z-index and positioning.
 */
export const getCommonPinningStyles = <TData extends RowData>({
  column,
  withBorder = false,
}: {
  column: KitColumn<TData>;
  withBorder?: boolean;
}): CSSProperties => {
  const isPinned = column.getIsPinned();
  // v9 pins to logical sides (start / end), so the sticky offsets are logical too and mirror in RTL.
  const isLastStartPinnedColumn = isPinned === 'start' && column.getIsLastColumn('start');
  const isFirstEndPinnedColumn = isPinned === 'end' && column.getIsFirstColumn('end');

  return {
    boxShadow: withBorder
      ? isLastStartPinnedColumn
        ? // box-shadow has no logical offsets: --inline-sign (utilities.css) flips the x for RTL.
          'calc(var(--inline-sign, 1) * -4px) 0 4px -4px var(--border) inset'
        : isFirstEndPinnedColumn
          ? 'calc(var(--inline-sign, 1) * 4px) 0 4px -4px var(--border) inset'
          : undefined
      : undefined,
    insetInlineStart: isPinned === 'start' ? `${column.getStart('start')}px` : undefined,
    insetInlineEnd: isPinned === 'end' ? `${column.getAfter('end')}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
};

/**
 * Creates a nuqs parser for URL-synced sorting state.
 * Serializes/deserializes sorting columns to/from URL query params.
 *
 * Format: "column.asc" or "column.desc", comma-separated for multi-sort
 */
export const getSortingStateParser = <TData extends Record<string, unknown>>(columnIds: Set<string>) =>
  createParser<ColumnSort[]>({
    parse: (value: string) => {
      if (!value) return [];

      return value
        .split(',')
        .map((segment) => {
          const [id, direction] = segment.split('.') as [string, string];
          if (!id || !columnIds.has(id)) return null;

          return {
            id,
            desc: direction === 'desc',
          } satisfies ColumnSort;
        })
        .filter(Boolean) as ColumnSort[];
    },
    serialize: (value: ColumnSort[]) => {
      return value.map((sort) => `${sort.id}.${sort.desc ? 'desc' : 'asc'}`).join(',');
    },
    eq: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });

/**
 * Type-safe helper for creating filter configs (both static and async).
 *
 * TanStack Table's ColumnMeta erases per-column option generics.
 * This helper provides full type inference at the definition site
 * (TS infers `TOption` from the options prop) and safely casts
 * to the stored type.
 *
 * @example
 * ```tsx
 * // Async options
 * filterMeta: createFilterMeta({
 *   variant: 'multiSelect',
 *   label: 'Roles',
 *   options: LookupService.roles.request,
 *   getOptionLabel: (option) => option.displayName, // option inferred as RoleLookupDto
 *   getOptionValue: (option) => option.id,
 * })
 *
 * // Date / date-range (no options)
 * filterMeta: createFilterMeta({ variant: 'dateRange', label: 'Created' })
 *
 * // Time of day
 * filterMeta: createFilterMeta({ variant: 'time', label: 'Start time', use24hFormat: true })
 * ```
 */
export function createFilterMeta<TOption>(config: {
  variant: 'select' | 'multiSelect';
  label: string;
  placeholder?: string;
  options: TOption[] | AsyncOptionsFn<TOption>;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  queryKey?: string;
  urlSearchParams?: URLSearchParams | string;
}): DataTableFilterMeta;
export function createFilterMeta(config: {
  variant: 'date' | 'dateRange';
  label: string;
  placeholder?: string;
  dateFormat?: DateFormat;
}): DataTableFilterMeta;
export function createFilterMeta(config: {
  variant: 'time';
  label: string;
  placeholder?: string;
  use24hFormat?: boolean;
  min?: string;
  max?: string;
  step?: number;
}): DataTableFilterMeta;
export function createFilterMeta(config: {
  variant: 'boolean';
  label: string;
  trueLabel?: string;
  falseLabel?: string;
}): DataTableFilterMeta;
export function createFilterMeta(config: { variant: 'text'; label: string; placeholder?: string }): DataTableFilterMeta;
export function createFilterMeta(config: {
  variant: 'numberRange';
  label: string;
  format?: 'decimal' | 'currency' | 'percent';
  min?: number;
  max?: number;
}): DataTableFilterMeta;
export function createFilterMeta(config: unknown): DataTableFilterMeta {
  return config as DataTableFilterMeta;
}

/**
 * Type guard: checks if a select filter's options are async (function) vs static (array).
 * Safe on the full union — date/time variants have no `options` and return `false`.
 */
export const isAsyncFilterMeta = (meta: DataTableFilterMeta): boolean => 'options' in meta && typeof meta.options === 'function';

/* -------------------------------------------------------------------------- */
/*                           Date / time filter fns                           */
/* -------------------------------------------------------------------------- */

/** Normalizes a cell/filter value to a comparable local `yyyy-MM-dd` string (empty when invalid). */
const toComparableDate = (input: unknown): string => {
  if (input == null || input === '') return '';

  let date: Date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    // Parse date-only ISO strings in local time to avoid UTC day-shift.
    const [year, month, day] = input.slice(0, 10).split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(input as string | number);
  }

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/** Normalizes a `'h:mm a'` / `'HH:mm'` value to minutes-since-midnight (null when invalid). */
const toComparableMinutes = (input: unknown): number | null => {
  if (input == null || input === '') return null;

  const match = String(input)
    .trim()
    .toUpperCase()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (meridiem === 'PM' && hours !== 12) hours += 12;

  return hours * 60 + minutes;
};

// Filter predicates are loosely typed (`KitFilterFn<any>`) so a single shared fn stays
// assignable to any column's `KitFilterFn<TData>` regardless of its row type.

/** Matches rows whose date cell equals the selected day. Pair with `variant: 'date'`. */
export const dateFilterFn: KitFilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue) return true;

  const cell = toComparableDate(row.getValue(columnId));

  return cell !== '' && cell === toComparableDate(filterValue);
};

/** Matches rows whose date cell falls within the inclusive `[from, to]` range. Pair with `variant: 'dateRange'`. */
export const dateRangeFilterFn: KitFilterFn<any> = (row, columnId, filterValue) => {
  const range = filterValue as DateRangeFilterValue | undefined;
  if (!range || (!range.from && !range.to)) return true;

  const cell = toComparableDate(row.getValue(columnId));
  if (!cell) return false;

  const from = range.from ? toComparableDate(range.from) : '';
  const to = range.to ? toComparableDate(range.to) : '';

  if (from && cell < from) return false;
  return !(to && cell > to);
};

/** Matches rows whose time cell equals the selected time. Pair with `variant: 'time'`. */
export const timeFilterFn: KitFilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue) return true;

  const cell = toComparableMinutes(row.getValue(columnId));
  const target = toComparableMinutes(filterValue);

  return cell !== null && target !== null && cell === target;
};
