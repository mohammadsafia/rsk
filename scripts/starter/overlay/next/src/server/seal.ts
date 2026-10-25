// The session cookie's format: AES-256-GCM (key derived from the secret, random IV), so the browser can neither read
// the API token inside nor change anything without the cookie being refused. Pure crypto, usable from proxy.ts.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

import { z } from 'zod';

import type { CurrentUser, Session } from '@contexts';

export const SESSION_COOKIE = 'rsk_session';

/** How long a session lasts, in seconds (the cookie's Max-Age and the sealed expiry). */
export const SESSION_MAX_AGE = 60 * 60 * 8;

/** Browsers drop larger cookies without a word; refuse to write one. */
const MAX_COOKIE_BYTES = 3800;
const IV_BYTES = 12;
const TAG_BYTES = 16;

const sealed = z.object({
  token: z.string(),
  user: z.object({ userId: z.string(), name: z.string(), email: z.string(), picture: z.string().optional() }),
  exp: z.number(),
});

const keyOf = (secret: string): Buffer => Buffer.from(hkdfSync('sha256', secret, 'rsk', 'session', 32));

/** The session sealed for the cookie, expiring SESSION_MAX_AGE from `now`. */
export function sealSession(session: Session, secret: string, now = Date.now()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', keyOf(secret), iv);
  const plain = JSON.stringify({ token: session.token, user: session.user, exp: now + SESSION_MAX_AGE * 1000 });
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const value = Buffer.concat([iv, body, cipher.getAuthTag()]).toString('base64url');
  if (value.length > MAX_COOKIE_BYTES) throw new Error(`The session is too large for a cookie (${value.length} bytes)`);
  return value;
}

const openWith = (bytes: Buffer, secret: string, now: number): Session | null => {
  try {
    const decipher = createDecipheriv('aes-256-gcm', keyOf(secret), bytes.subarray(0, IV_BYTES));
    decipher.setAuthTag(bytes.subarray(bytes.length - TAG_BYTES));
    const plain = Buffer.concat([decipher.update(bytes.subarray(IV_BYTES, bytes.length - TAG_BYTES)), decipher.final()]).toString('utf8');
    const result = sealed.safeParse(JSON.parse(plain));
    if (!result.success || result.data.exp <= now) return null;
    return { token: result.data.token, user: result.data.user as CurrentUser };
  } catch {
    return null; // Wrong key, changed bytes or not JSON: not a session this server sealed.
  }
};

/** The session in a cookie value, trying each secret (current, then the previous while it rotates); null otherwise. */
export function openSession(value: string | undefined, secrets: string[], now = Date.now()): Session | null {
  if (!value) return null;
  const bytes = Buffer.from(value, 'base64url');
  // Not canonical base64url (stray characters, unused bits changed): refused, so no two values open alike.
  if (bytes.toString('base64url') !== value || bytes.length <= IV_BYTES + TAG_BYTES) return null;
  for (const secret of secrets) {
    const session = openWith(bytes, secret, now);
    if (session) return session;
  }
  return null;
}

/** What the browser may hold: the user, never the API token. */
export const toClientSession = (session: Session | null): Session | null => (session ? { token: '', user: session.user } : null);

/** The session cookie's attributes: httpOnly, and Secure whenever the request came over https. */
export const cookieOptions = (request: Request) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
  secure: new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
});
