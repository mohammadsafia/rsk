// Runs before every page: puts the language in the URL and sends signed-out visitors to sign in. Optimistic: the
// (app) layout and every route handler check the session again.
import { type NextRequest, NextResponse } from 'next/server';

import { LANG_COOKIE } from '@routes/paths';
import { getServerEnv } from '@server/env';
import { decideRoute } from '@server/route-decision';
import { openSession, SESSION_COOKIE } from '@server/seal';

/** The secrets to open a session with; none when the server isn't configured (everyone is signed out). */
const secrets = (): string[] => {
  try {
    const env = getServerEnv();
    return [env.SESSION_SECRET, env.SESSION_SECRET_PREVIOUS].filter((secret): secret is string => !!secret);
  } catch {
    return [];
  }
};

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? openSession(cookie, secrets()) : null;
  const decision = decideRoute({
    pathname,
    search,
    langCookie: request.cookies.get(LANG_COOKIE)?.value,
    acceptLanguage: request.headers.get('accept-language') ?? undefined,
    hasSession: !!session,
  });

  let response: NextResponse;
  if (decision.redirect) {
    response = NextResponse.redirect(new URL(decision.redirect, request.url));
  } else {
    // Where the page is, for the (app) layout's redirect to sign in; always this proxy's value, never the browser's.
    const headers = new Headers(request.headers);
    headers.set('x-pathname', `${pathname}${search}`);
    response = NextResponse.next({ request: { headers } });
  }
  // A cookie this server can't open (another secret, changed, expired) is dropped, so it can't loop sign-in. Not on
  // /api: the route handler sets or clears it there, and a second Set-Cookie could undo a fresh sign-in.
  if (cookie && !session && !pathname.startsWith('/api/')) response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon).*)'] };
