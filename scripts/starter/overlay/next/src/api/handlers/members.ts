// The members example's client side: the browser asks this app's /api route (app/api/[...path]/route.ts), which calls
// the API with the session's token. Delete this file with src/pages/members and app/[lang]/(app)/members.
import type { PaginatedResult } from '@app-types';

export type MemberRole = 'admin' | 'member';

export type Member = { id: string; name: string; email: string; role: MemberRole; joinedAt: string };

export const membersApi = {
  /** A page of members; `params` is the query string the kit table builds (page, pageSize, search, sort). */
  async list(params: string): Promise<PaginatedResult<Member>> {
    const response = await fetch(`/api/members?${params}`, { headers: { Accept: 'application/json' } });
    if (!response.ok)
      throw { status: response.status, message: ((await response.json().catch(() => ({}))) as { message?: string }).message };
    return (await response.json()) as PaginatedResult<Member>;
  },
};
