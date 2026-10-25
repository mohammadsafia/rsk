// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { proxy } from './proxy';
import { sealSession, SESSION_COOKIE } from './src/server/session';

const SECRET = 'p'.repeat(40);
const USER = { userId: '1', name: 'Demo User', email: 'demo@example.com', picture: '' };

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});
afterAll(() => {
  delete process.env.SESSION_SECRET;
});

const request = (url: string, headers: Record<string, string> = {}) => new NextRequest(new URL(url, 'http://localhost:3000'), { headers });

describe('proxy', () => {
  it('treats a damaged cookie as signed out, without a redirect loop, and clears it', () => {
    const response = proxy(request('/en/login', { cookie: `${SESSION_COOKIE}=garbage` }));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toMatch(new RegExp(`${SESSION_COOKIE}=;.*Max-Age=0`, 'i'));
  });

  it('leaves the session cookie alone on /api, where the route handler sets or clears it', () => {
    const response = proxy(request('/api/auth/login', { cookie: `${SESSION_COOKIE}=garbage` }));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('lets a valid session through, overwriting any x-pathname the browser sent', () => {
    const cookie = `${SESSION_COOKIE}=${sealSession({ token: 't', user: USER }, SECRET)}`;
    const response = proxy(request('/en/dashboard?tab=a', { cookie, 'x-pathname': '//evil.com' }));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-request-x-pathname')).toBe('/en/dashboard?tab=a');
  });

  it('redirects a signed-out visitor to sign in', () => {
    const response = proxy(request('/en/dashboard'));
    expect(new URL(response.headers.get('location') ?? '').pathname + new URL(response.headers.get('location') ?? '').search).toBe(
      '/en/login?next=%2Fen%2Fdashboard',
    );
  });
});
