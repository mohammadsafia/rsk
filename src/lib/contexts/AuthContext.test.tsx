// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { AuthProvider, notifyUnauthorized, SESSION_KEY, type Session, useAuth } from './AuthContext';

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
    act(() => notifyUnauthorized());
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
});
