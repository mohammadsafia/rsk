// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vite-plus/test';

import { POST as forgotPassword } from './forgot-password/route';
import { POST as login } from './login/route';
import { POST as logout } from './logout/route';

const DEMO = { email: 'demo@example.com', password: 'demo-password' };

beforeAll(() => {
  process.env.SESSION_SECRET = 'r'.repeat(40);
  process.env.AUTH_MOCK = 'true';
});

const post = (path: string, body: unknown, { origin = 'http://localhost', type = 'application/json', base = 'http://localhost' } = {}) =>
  new Request(`${base}${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': type, Origin: origin } });

describe('sign-in route handlers', () => {
  it('signs the demo account in: the user back, the session in an httpOnly cookie, Secure only over https', async () => {
    const response = await login(post('/api/auth/login', DEMO));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ user: { email: 'demo@example.com' } });
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/rsk_session=[\w-]+/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).not.toMatch(/Secure/i);
    const secure = await login(post('/api/auth/login', DEMO, { base: 'https://localhost', origin: 'https://localhost' }));
    expect(secure.headers.get('set-cookie')).toMatch(/Secure/i);
  });

  it('never hands the token to the browser', async () => {
    const response = await login(post('/api/auth/login', DEMO));
    expect(JSON.stringify(await response.json())).not.toContain('demo-token');
  });

  it('answers a wrong password with a fixed message', async () => {
    const response = await login(post('/api/auth/login', { ...DEMO, password: 'nope' }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'The email or password is incorrect.' });
  });

  it('refuses requests from another site, a form post or a bad body, without a cookie', async () => {
    for (const response of [
      await login(post('/api/auth/login', DEMO, { type: 'text/plain' })),
      await login(post('/api/auth/login', DEMO, { origin: 'https://evil.example' })),
    ]) {
      expect(response.status).toBe(403);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
    expect((await login(post('/api/auth/login', { email: 1 }))).status).toBe(400);
  });

  it('compares the origin with the host the browser addressed (Next and proxies rewrite request.url)', async () => {
    const asServed = (origin: string) =>
      new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(DEMO),
        headers: { 'Content-Type': 'application/json', Origin: origin, Host: '127.0.0.1:5410' },
      });
    expect((await login(asServed('http://127.0.0.1:5410'))).status).toBe(200);
    expect((await login(asServed('http://evil.example'))).status).toBe(403);
    const forwarded = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(DEMO),
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://app.example.com',
        Host: 'internal:3000',
        'X-Forwarded-Host': 'app.example.com',
      },
    });
    expect((await login(forwarded)).status).toBe(200);
  });

  it('trusts the origin NEXT_PUBLIC_SITE_URL names, behind a proxy that rewrites Host without X-Forwarded-Host', async () => {
    // NEXT_PUBLIC_SITE_URL defaults to http://localhost:3000.
    const behindProxy = (origin: string) =>
      new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(DEMO),
        headers: { 'Content-Type': 'application/json', Origin: origin, Host: 'upstream:8080' },
      });
    expect((await login(behindProxy('http://localhost:3000'))).status).toBe(200);
    expect((await login(behindProxy('http://evil.example'))).status).toBe(403);
  });

  it('signs out by expiring the cookie', async () => {
    const response = await logout(post('/api/auth/logout', {}));
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toMatch(/rsk_session=;.*Max-Age=0/i);
  });

  it('answers a reset request the same way whether or not the email has an account', async () => {
    expect((await forgotPassword(post('/api/auth/forgot-password', { email: 'nobody@example.com' }))).status).toBe(204);
    expect((await forgotPassword(post('/api/auth/forgot-password', { email: 'x' }, { origin: 'https://evil.example' }))).status).toBe(403);
  });
});
