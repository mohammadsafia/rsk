import { NextResponse } from 'next/server';

import { callApi } from '@server/api';
import { getServerEnv, type ServerEnv } from '@server/env';
import { openSession, secretsOf, SESSION_COOKIE } from '@server/session';

import { requestCookie, sameOrigin } from '../auth/same-origin';

type Context = { params: Promise<{ path: string[] }> };

/** A segment that could leave the API's path, or isn't one segment. */
const unsafe = (segment: string) => segment === '' || segment === '.' || segment === '..' || /[/\\]/.test(segment);

/**
 * The browser's API: /api/<path> is the backend's /<path>, called with the signed-in person's token from the session
 * cookie. The browser never sees the token; changes must come from this app's own pages (sameOrigin).
 */
async function forward(request: Request, { params }: Context): Promise<NextResponse> {
  if (request.method !== 'GET' && !sameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const { path } = await params;
  if (path.some(unsafe)) return NextResponse.json({ message: 'Bad path' }, { status: 400 });

  let env: ServerEnv;
  try {
    env = getServerEnv();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'The API is not configured.' }, { status: 500 });
  }
  const session = openSession(requestCookie(request, SESSION_COOKIE), secretsOf(env));
  if (!session) return NextResponse.json({ message: 'Sign in again.' }, { status: 401 });

  const body = request.method === 'GET' ? undefined : await request.json().catch(() => undefined);
  const { status, body: answer } = await callApi(
    session,
    { method: request.method, path: `/${path.map(encodeURIComponent).join('/')}`, search: new URL(request.url).search, body },
    env,
  );
  return answer === null ? new NextResponse(null, { status }) : NextResponse.json(answer, { status });
}

export { forward as DELETE, forward as GET, forward as PATCH, forward as POST, forward as PUT };
