// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import type { Session } from '@contexts';

import { sealSession, SESSION_COOKIE } from '@server/session';

import { GET, POST } from './route';

const SECRET = 'r'.repeat(40);
const SESSION: Session = { token: 'demo-token', user: { userId: 'demo', name: 'Demo User', email: 'demo@example.com', picture: '' } };

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.AUTH_MOCK = 'true';
});
afterEach(() => vi.restoreAllMocks());

const signedIn = { cookie: `${SESSION_COOKIE}=${sealSession(SESSION, SECRET)}` };
const call = (handler: typeof GET, segments: string[], init: RequestInit & { search?: string } = {}) =>
  handler(new Request(`http://localhost/api/${segments.join('/')}${init.search ?? ''}`, init), {
    params: Promise.resolve({ path: segments }),
  });

describe('the API route', () => {
  it('answers a signed-in request from the backend, and never shows the browser the token', async () => {
    const response = await call(GET, ['members'], { headers: signedIn, search: '?page=2&pageSize=10' });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(JSON.parse(text).pagination).toMatchObject({ page: 2, total: 23 });
    expect(text).not.toContain('demo-token');
  });

  it('answers 401 without a session, and never calls the backend', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    expect((await call(GET, ['members'])).status).toBe(401);
    expect((await call(GET, ['members'], { headers: { cookie: `${SESSION_COOKIE}=garbage` } })).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a change from another site', async () => {
    const response = await call(POST, ['members'], {
      method: 'POST',
      headers: { ...signedIn, 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ name: 'X', email: 'x@example.com', role: 'member' }),
    });
    expect(response.status).toBe(403);
  });

  it('refuses a path that would climb out of the API', async () => {
    for (const segments of [['..', 'admin'], ['members', '.'], ['a/b'], ['members', '']])
      expect((await call(GET, segments, { headers: signedIn })).status, segments.join('|')).toBe(400);
  });
});
