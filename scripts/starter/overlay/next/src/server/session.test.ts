// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import type { Session } from '@contexts';

import { openSession, sealSession, SESSION_MAX_AGE, toClientSession } from './session';

const SECRET = 's'.repeat(40);
const OTHER = 'o'.repeat(40);
const SESSION: Session = { token: 'api-token-123', user: { userId: '7', name: 'Lina Haddad', email: 'lina@example.com', picture: '' } };
const NOW = Date.UTC(2026, 9, 25, 9);

describe('session cookie', () => {
  it('seals a session that only this server can open, and keeps the token out of sight', () => {
    const sealed = sealSession(SESSION, SECRET, NOW);
    expect(openSession(sealed, [SECRET], NOW)).toEqual(SESSION);
    expect(sealed).not.toContain('api-token-123');
    expect(Buffer.from(sealed, 'base64url').toString('latin1')).not.toContain('api-token-123');
    expect(sealed).toMatch(/^[\w-]+$/);
  });

  it('refuses a cookie changed anywhere, sealed with another secret, or expired', () => {
    const sealed = sealSession(SESSION, SECRET, NOW);
    for (const at of [0, Math.floor(sealed.length / 2), sealed.length - 1]) {
      const flipped = sealed.slice(0, at) + (sealed[at] === 'A' ? 'B' : 'A') + sealed.slice(at + 1);
      expect(openSession(flipped, [SECRET], NOW), `flipped at ${at}`).toBeNull();
    }
    expect(openSession(sealSession(SESSION, OTHER, NOW), [SECRET], NOW)).toBeNull();
    expect(openSession(sealed, [SECRET], NOW + SESSION_MAX_AGE * 1000 + 1)).toBeNull();
  });

  it('opens a cookie sealed with the previous secret while it rotates', () => {
    expect(openSession(sealSession(SESSION, OTHER, NOW), [SECRET, OTHER], NOW)).toEqual(SESSION);
  });

  it('never throws on what a browser sends', () => {
    const sealed = sealSession(SESSION, SECRET, NOW);
    for (const value of [undefined, '', 'garbage', 'a.', '.b', sealed.slice(0, 10), '%%%'])
      expect(openSession(value, [SECRET], NOW), String(value)).toBeNull();
  });

  it('refuses to seal a session too big for a cookie', () => {
    expect(() => sealSession({ ...SESSION, token: 't'.repeat(4000) }, SECRET, NOW)).toThrow(/too large/);
  });

  it('gives the browser the user, never the token', () => {
    expect(toClientSession(SESSION)).toEqual({ token: '', user: SESSION.user });
    expect(toClientSession(null)).toBeNull();
  });
});
