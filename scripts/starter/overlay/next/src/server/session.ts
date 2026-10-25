// The signed-in person, on the server. The proxy and the (app) layout send signed-out visitors to sign in; they are not
// authorization: route handlers and server actions call getServerSession() themselves.
import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { KitLanguage, Session } from '@contexts';

import { getServerEnv, type ServerEnv } from './env';
import { openSession, SESSION_COOKIE } from './seal';

export * from './seal';

/** The secrets a session cookie may be sealed with: the current one, then the previous one while it rotates. */
export const secretsOf = (env: ServerEnv): string[] =>
  [env.SESSION_SECRET, env.SESSION_SECRET_PREVIOUS].filter((secret): secret is string => !!secret);

/** This request's session, or null (read once per request). */
export const getServerSession = cache(async (): Promise<Session | null> =>
  openSession((await cookies()).get(SESSION_COOKIE)?.value, secretsOf(getServerEnv())),
);

/** This request's session; without one, to sign in. */
export async function requireSession(lang: KitLanguage): Promise<Session> {
  const session = await getServerSession();
  if (!session) redirect(`/${lang}/login`);
  return session;
}
