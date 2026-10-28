// The members example on the server: the page's first data, fetched before it renders and sent along with it, under
// the key the members table reads, so the browser shows it without fetching again.
import 'server-only';

import type { QueryClient } from '@tanstack/react-query';
import { createLoader } from 'nuqs/server';

import type { Session } from '@contexts';
import { type DataTableQueryState, dataTableQueryKey, dataTableRequestParams, dataTableSearchParams } from '@hooks/shared';

import { type Member, MEMBERS_PAGE_SIZE, MEMBERS_QUERY_KEY } from '@api/handlers/members';
import type { PaginatedResult } from '@app-types';

import { callApi } from './api';

const loadTableState = createLoader(dataTableSearchParams(MEMBERS_PAGE_SIZE));

type SearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

/**
 * Prefetches the page of members the URL asks for (page, search) into `client`. A failed fetch isn't cached, so the
 * table fetches it again in the browser and shows its own error.
 */
export async function prefetchMembers(client: QueryClient, session: Session, searchParams: SearchParams): Promise<DataTableQueryState> {
  const state = loadTableState(searchParams);
  await client.prefetchQuery({
    queryKey: dataTableQueryKey(MEMBERS_QUERY_KEY, state),
    queryFn: async () => {
      const { status, body } = await callApi(session, { method: 'GET', path: '/members', search: `?${dataTableRequestParams(state)}` });
      if (status !== 200) throw new Error(`GET /members answered ${status}`);
      return body as PaginatedResult<Member>;
    },
  });
  return state;
}
