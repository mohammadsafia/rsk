// The members example's client side: the browser asks this app's /api route (app/api/[...path]/route.ts), which calls
// the API with the session's token. Delete this file with src/pages/members and app/[lang]/(app)/members.
import { notifyUnauthorized } from '@contexts';

import type { PaginatedResult } from '@app-types';

export type MemberRole = 'admin' | 'member';

export type Member = { id: string; name: string; email: string; role: MemberRole; joinedAt: string };

/** The members table's cache key and page size, shared by the server that prefetches it and the page that reads it. */
export const MEMBERS_QUERY_KEY = ['members'];
export const MEMBERS_PAGE_SIZE = 10;

export const membersApi = {
  /** A page of members; `params` is the query string the kit table builds (page, pageSize, search, sort). */
  list: async (params: string): Promise<PaginatedResult<Member>> => {
    const response = await fetch(`/api/members?${params}`, { headers: { Accept: 'application/json' } });
    // The session is over (here or at the API): the app signs out, as the Vite app's httpClient does on a 401.
    if (response.status === 401) notifyUnauthorized();
    if (!response.ok)
      throw { status: response.status, message: ((await response.json().catch(() => ({}))) as { message?: string }).message };
    return (await response.json()) as PaginatedResult<Member>;
  },
};
