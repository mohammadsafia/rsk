// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { AuthProvider, useAuth } from './AuthContext';
import { notifyUnauthorized, type Session, SESSION_KEY } from './authSession';

const SESSION: Session = { token: 't-123', user: { userId: '7', name: 'Lina Haddad', email: 'lina@example.com', picture: '' } };

function Probe() {
  const { isAuthed, currentUser, signIn, signOut } = useAuth();
  return (
    <>
      <p>{isAuthed ? `in as ${currentUser?.email}` : 'signed out'}</p>
      <button type="button" onClick={() => signIn(SESSION)}>
        sign in
      </button>
      <button type="button" onClick={signOut}>
        sign out
      </button>
    </>
  );
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('AuthProvider', () => {
  it('starts signed out, signs in and remembers the session for the next visit', () => {
    renderProbe();
    expect(screen.getByText('signed out')).toBeTruthy();
    act(() => screen.getByRole('button', { name: 'sign in' }).click());
    expect(screen.getByText('in as lina@example.com')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual(SESSION);
    cleanup();
    renderProbe();
    expect(screen.getByText('in as lina@example.com')).toBeTruthy();
  });

  it('signs out and forgets the session', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    renderProbe();
    act(() => screen.getByRole('button', { name: 'sign out' }).click());
    expect(screen.getByText('signed out')).toBeTruthy();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('ends the session when the API says the token is no longer valid (401)', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    renderProbe();
    act(() => notifyUnauthorized(SESSION.token));
    expect(screen.getByText('signed out')).toBeTruthy();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('follows sign-in and sign-out in another tab', () => {
    renderProbe();
    act(() => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
      window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY }));
    });
    expect(screen.getByText('in as lina@example.com')).toBeTruthy();
    act(() => {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY }));
    });
    expect(screen.getByText('signed out')).toBeTruthy();
  });

  it('treats a damaged or partial stored session as signed out', () => {
    localStorage.setItem(SESSION_KEY, '{"token":');
    renderProbe();
    expect(screen.getByText('signed out')).toBeTruthy();
    cleanup();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: SESSION.user }));
    renderProbe();
    expect(screen.getByText('signed out')).toBeTruthy();
  });

  it('tells the app when a session ends (sign-out or a 401), so it can drop the last user’s cached data', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    const ended: string[] = [];
    render(
      <AuthProvider onSignOut={() => ended.push('ended')}>
        <Probe />
      </AuthProvider>,
    );
    act(() => screen.getByRole('button', { name: 'sign out' }).click());
    act(() => screen.getByRole('button', { name: 'sign in' }).click());
    act(() => notifyUnauthorized(SESSION.token));
    expect(ended).toEqual(['ended', 'ended']);
  });

  it('ignores a 401 for a token that is no longer the session’s (a slow request from before signing in again)', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    renderProbe();
    act(() => notifyUnauthorized('an-old-token'));
    expect(screen.getByText('in as lina@example.com')).toBeTruthy();
  });

  it('restores a stored session on the first render (Vite: no signed-out flash)', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    const seen: boolean[] = [];
    function Seen() {
      seen.push(useAuth().isAuthed);
      return null;
    }
    render(
      <AuthProvider>
        <Seen />
      </AuthProvider>,
    );
    expect(seen[0]).toBe(true);
  });

  it('on a server, renders the initial session and never reads storage', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    const html = renderToString(
      <AuthProvider initialSession={null}>
        <Probe />
      </AuthProvider>,
    );
    expect(html).toContain('signed out');
  });

  it("with persist 'none', keeps the session out of storage and signs in and out through the app's calls", async () => {
    const signInWith = vi.fn();
    const signOutWith = vi.fn();
    render(
      <AuthProvider persist="none" initialSession={null} signInWith={signInWith} signOutWith={signOutWith}>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => screen.getByRole('button', { name: 'sign in' }).click());
    expect(screen.getByText('in as lina@example.com')).toBeTruthy();
    expect(signInWith).toHaveBeenCalledWith(SESSION);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    await act(async () => screen.getByRole('button', { name: 'sign out' }).click());
    expect(screen.getByText('signed out')).toBeTruthy();
    expect(signOutWith).toHaveBeenCalled();
  });

  it("with persist 'none', starts from initialSession whatever storage holds", () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...SESSION, user: { ...SESSION.user, email: 'old@example.com' } }));
    render(
      <AuthProvider persist="none" initialSession={SESSION}>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByText('in as lina@example.com')).toBeTruthy();
  });
});
