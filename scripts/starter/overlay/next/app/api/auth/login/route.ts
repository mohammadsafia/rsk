import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { Session } from '@contexts';

import { mockAuth } from '@api/mock/auth';
import { getServerEnv, type ServerEnv } from '@server/env';
import { cookieOptions, sealSession, SESSION_COOKIE } from '@server/session';

import { sameOrigin } from '../same-origin';

const credentials = z.object({ email: z.string().max(254), password: z.string().max(1024) });

/** What the API answers POST /auth/login with, checked before it goes into a cookie. */
const apiSession = z.object({
  token: z.string().min(1),
  user: z.object({ userId: z.string(), name: z.string(), email: z.string(), picture: z.string().optional() }),
});

const INVALID = { message: 'The email or password is incorrect.' };
const UNAVAILABLE = { message: 'Sign-in is unavailable.' };

/** The API's (or the mock's) answer: a session, or why there is none. The API's own words never reach the browser. */
async function authenticate(input: z.infer<typeof credentials>, env: ServerEnv): Promise<Session | 'invalid' | 'unavailable'> {
  if (env.AUTH_MOCK === 'true') return mockAuth.signIn(input, 0).catch(() => 'invalid' as const);
  try {
    const response = await fetch(`${env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 400 || response.status === 401) return 'invalid';
    if (!response.ok) return 'unavailable';
    const session = apiSession.safeParse(await response.json());
    return session.success ? session.data : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/** Sign in: the session goes into an encrypted httpOnly cookie; the page gets the user. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const body = credentials.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: 'Enter an email and a password.' }, { status: 400 });

  let env: ServerEnv;
  try {
    env = getServerEnv();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Sign-in is not configured.' }, { status: 500 });
  }

  // Rate-limit sign-in attempts here (per address and per email), e.g. with your host's firewall or a store like Upstash.
  const result = await authenticate(body.data, env);
  if (result === 'invalid') return NextResponse.json(INVALID, { status: 401 });
  if (result === 'unavailable') return NextResponse.json(UNAVAILABLE, { status: 502 });

  let sealed: string;
  try {
    sealed = sealSession(result, env.SESSION_SECRET);
  } catch (error) {
    console.error(error);
    return NextResponse.json(UNAVAILABLE, { status: 500 });
  }
  const response = NextResponse.json({ user: result.user });
  response.cookies.set(SESSION_COOKIE, sealed, cookieOptions(request));
  return response;
}
