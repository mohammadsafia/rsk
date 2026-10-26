// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { Session } from '@contexts';

import { LOCALES } from '@locales';
import { sealSession, SESSION_COOKIE } from '@server/session';

import { inviteMember } from './actions';

// The API's answer, when a test sets one; otherwise the mock backend answers.
let answer: { status: number; body: unknown } | undefined;
vi.mock('@server/api', async (load) => {
  const actual = await load<typeof import('@server/api')>();
  return { ...actual, callApi: async (...args: Parameters<typeof actual.callApi>) => answer ?? actual.callApi(...args) };
});

const SECRET = 'r'.repeat(40);
const SESSION: Session = { token: 'demo-token', user: { userId: 'demo', name: 'Demo User', email: 'demo@example.com', picture: '' } };

// The request's cookies, as next/headers gives them to a server action.
let cookie: string | undefined;
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === SESSION_COOKIE && cookie ? { name, value: cookie } : undefined) }),
}));

type Copy = { invite: { errors: Record<string, string>; signedOut: string } };
const ar = LOCALES.AR.members as unknown as Copy;
const en = LOCALES.EN.members as unknown as Copy;

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.AUTH_MOCK = 'true';
});
beforeEach(() => {
  cookie = sealSession(SESSION, SECRET);
  answer = undefined;
});

describe('inviteMember', () => {
  it('validates on the server with the form’s schema, in the visitor’s language', async () => {
    expect(await inviteMember('ar', { name: '', email: 'nope', role: 'member' })).toEqual({
      ok: false,
      fieldErrors: { name: ar.invite.errors.name, email: ar.invite.errors.email },
    });
  });

  it('tells a signed-out visitor to sign in again, and calls nothing', async () => {
    cookie = undefined;
    const fetch = vi.spyOn(globalThis, 'fetch');
    expect(await inviteMember('en', { name: 'Rana Aziz', email: 'rana@example.com', role: 'member' })).toEqual({
      ok: false,
      formError: en.invite.signedOut,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("puts the API's 'already a member' under the email field", async () => {
    expect(await inviteMember('en', { name: 'Layla', email: 'layla.haddad@example.com', role: 'member' })).toEqual({
      ok: false,
      fieldErrors: { email: en.invite.errors.taken },
    });
  });

  it("tells the visitor to sign in again when the API no longer takes the session's token", async () => {
    answer = { status: 401, body: { message: 'Token expired' } };
    expect(await inviteMember('en', { name: 'Rana', email: 'rana.401@example.com', role: 'member' })).toEqual({
      ok: false,
      formError: en.invite.signedOut,
    });
  });

  it('adds the member', async () => {
    const result = await inviteMember('en', { name: ' Rana Aziz ', email: 'rana.aziz@example.com', role: 'admin' });
    expect(result).toMatchObject({ ok: true, member: { name: 'Rana Aziz', email: 'rana.aziz@example.com', role: 'admin' } });
  });
});
