import { NextResponse } from 'next/server';

import { getServerEnv } from '@server/env';
import { cookieOptions, openSession, secretsOf, SESSION_COOKIE } from '@server/session';

import { requestCookie, sameOrigin } from '../same-origin';

/** Sign out: this browser's cookie expires; with a real API, its token is revoked too (best effort). */
export async function POST(request: Request): Promise<NextResponse> {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  try {
    const env = getServerEnv();
    const session = openSession(requestCookie(request, SESSION_COOKIE), secretsOf(env));
    if (session && env.AUTH_MOCK === 'false') {
      await fetch(`${env.API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(5_000),
      }).catch((error: unknown) => console.warn('Revoking the session at the API failed', error));
    }
  } catch (error) {
    console.warn(error);
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(request), maxAge: 0 });
  return response;
}
