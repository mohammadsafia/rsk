import type { CSSProperties } from 'react';

import type { Column, ColumnSort } from '@tanstack/react-table';
import { createParser } from 'nuqs';

import type { AsyncOptionsFn } from '@hooks/shared';

import type { DataTableFilterMeta } from '@app-types';

/**
 * Returns CSS styles for pinned (sticky) columns.
 * Handles left/right pinning with proper z-index and positioning.
 */
export const getCommonPinningStyles = <TData>({
  column,
  withBorder = false,
}: {
  column: Column<TData>;
  withBorder?: boolean;
}): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? '-4px 0 4px -4px hsl(var(--border)) inset'
        : isFirstRightPinnedColumn
          ? '4px 0 4px -4px hsl(var(--border)) inset'
          : undefined
      : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
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
export const getSortingStateParser = (columnIds: Set<string>) =>
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
 * // Static options
 * filterMeta: createFilterMeta({
 *   variant: 'select',
 *   label: 'Status',
 *   options: [{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }],
 *   getOptionLabel: (option) => option.name, // option inferred from array
 *   getOptionValue: (option) => option.id,
 * })
 * ```
 */
export const createFilterMeta = <TOption>(config: {
  variant: 'select' | 'multiSelect';
  label: string;
  placeholder?: string;
  options: TOption[] | AsyncOptionsFn<TOption>;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  queryKey?: string;
  urlSearchParams?: URLSearchParams | string;
}): DataTableFilterMeta => config as unknown as DataTableFilterMeta;

/**
 * Type guard: checks if filter options are async (function) vs static (array).
 */
export const isAsyncFilterMeta = (meta: DataTableFilterMeta): boolean => typeof meta.options === 'function';
