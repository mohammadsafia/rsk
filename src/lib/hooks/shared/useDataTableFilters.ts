'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ColumnFiltersState, OnChangeFn } from '@tanstack/react-table';
import { parseAsString, useQueryStates } from 'nuqs';

import type { DataTableFilterMeta } from '@app-types';

import { filterCodecFor, type KitColumnDef } from '@utils';

import { useIsHydrated } from './useIsHydrated';
import type { RowData } from '@tanstack/react-table';

type Options<TData extends RowData> = {
  columns: KitColumnDef<TData, any>[];
  /** Mirror filters and search in the URL. `{ prefix }` namespaces params when a page has two tables. */
  urlSync?: boolean | { prefix: string };
  /** Keep filters and search in sessionStorage (`rsk:table:<storageKey>`) across navigation. */
  storageKey?: string;
};

type Stored = { filters: Record<string, string>; q?: string };

/** TanStack's own id rule: explicit id, else accessorKey with dots as underscores, else a string header. */
const columnIdOf = <TData extends RowData>(column: KitColumnDef<TData, any>): string | undefined => {
  if (column.id) return column.id;
  if ('accessorKey' in column && column.accessorKey !== undefined) return String(column.accessorKey).replaceAll('.', '_');
  return typeof column.header === 'string' ? column.header : undefined;
};

/** Leaf columns, descending into header groups. */
const leafColumnsOf = <TData extends RowData>(columns: KitColumnDef<TData, any>[]): KitColumnDef<TData, any>[] =>
  columns.flatMap((column) => ('columns' in column && Array.isArray(column.columns) ? leafColumnsOf(column.columns) : [column]));

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

export const useDataTableFilters = <TData extends RowData>({ columns, urlSync = false, storageKey }: Options<TData>) => {
  const prefix = typeof urlSync === 'object' ? urlSync.prefix : '';
  const sessionKey = storageKey ? `rsk:table:${storageKey}` : undefined;

  const filterable = useMemo(
    () =>
      leafColumnsOf<TData>(columns).flatMap((column) => {
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

  const hydrated = useIsHydrated();
  // Read once, synchronously, so the toolbar's search box starts with the restored text (on a server, and while
  // hydrating, storage isn't readable: the table starts unfiltered, as the server rendered it).
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
    const stored = hydrated ? readSession(sessionKey) : undefined;
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
