// The backend, called from the server with the session's token: by the /api route (app/api/[...path]/route.ts) for the
// browser, and directly by Server Components and server actions. While AUTH_MOCK is on, the mock backend answers.
import 'server-only';

import type { Session } from '@contexts';

import { type ApiRequest, type ApiResponse, mockApi } from '@api/mock/members';

import { getServerEnv, type ServerEnv } from './env';

export type { ApiRequest, ApiResponse };

const UNAVAILABLE: ApiResponse = { status: 502, body: { message: 'The API is unavailable.' } };

/** One call to the API as `session`'s user. Never throws: an unreachable API is a 502. */
export async function callApi(
  session: Session,
  { method, path, search = '', body }: ApiRequest,
  env: ServerEnv = getServerEnv(),
): Promise<ApiResponse> {
  if (env.AUTH_MOCK === 'true') return mockApi({ method, path, search, body });
  try {
    const response = await fetch(`${env.API_URL}${path}${search}`, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const text = await response.text();
    return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
  } catch {
    return UNAVAILABLE;
  }
}
