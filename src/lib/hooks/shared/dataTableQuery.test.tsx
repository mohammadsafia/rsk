// @vitest-environment happy-dom
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createLoader } from 'nuqs/server';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { dataTableQueryKey, dataTableRequestParams, dataTableSearchParams } from './dataTableQuery';
import { useDataTableQuery } from './useDataTableQuery';

afterEach(cleanup);

const EMPTY = { data: [], pagination: { page: 1, pageSize: 30, total: 0, totalPage: 0 } };

/** Runs the hook on `search` and answers what it cached under and what it asked the API for. */
async function runHook(search: string, defaultPageSize?: number) {
  const client = new QueryClient();
  const queryFn = vi.fn(async (_params: string) => EMPTY);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NuqsTestingAdapter searchParams={search}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NuqsTestingAdapter>
  );
  renderHook(() => useDataTableQuery({ queryKey: ['members'], queryFn, defaultPageSize }), { wrapper });
  await waitFor(() => expect(queryFn).toHaveBeenCalled());
  return { key: client.getQueryCache().getAll()[0].queryKey, params: queryFn.mock.calls[0][0] };
}

describe('dataTableQuery: what a server prefetches', () => {
  it('gives the key and the request the hook uses, for the same URL', async () => {
    for (const [search, size] of [
      ['', undefined],
      ['?page=2&perPage=10&globalFilter=lay', 10],
    ] as const) {
      const state = createLoader(dataTableSearchParams(size))(new URLSearchParams(search));
      const { key, params } = await runHook(search, size);
      expect(key).toEqual(dataTableQueryKey(['members'], state));
      expect(params).toBe(dataTableRequestParams(state));
    }
  });

  it('builds the request as the hook always has: search, sort, then page and size', () => {
    const state = createLoader(dataTableSearchParams())(
      new URLSearchParams({ globalFilter: 'a', sorting: JSON.stringify([{ id: 'name', desc: false }]) }),
    );
    expect(dataTableRequestParams(state)).toBe('search=a&sort=name%3Aasc&page=1&pageSize=30');
  });
});
