'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { type CurrentUser, listeners, readSession, type Session, SESSION_KEY } from './authSession';

type AuthState = {
  currentUser: CurrentUser | null;
  isAuthed: boolean;
  /** Starts a session (after the API accepted the person's credentials) and remembers it for the next visit. */
  signIn: (session: Session) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  /** Runs whenever a session ends (sign-out or a 401): drop what the last user loaded, e.g. the query cache. */
  onSignOut?: () => void;
};

export function AuthProvider({ children, onSignOut }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(readSession);
  const onSignOutRef = useRef(onSignOut);
  useEffect(() => {
    onSignOutRef.current = onSignOut;
  }, [onSignOut]);

  const signIn = useCallback((next: Session) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the session lasts for this visit only.
    }
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage blocked: nothing was kept.
    }
    setSession(null);
    onSignOutRef.current?.();
  }, []);

  useEffect(() => {
    const onUnauthorized = (token: string | undefined) => {
      if (token === undefined || token === readSession()?.token) signOut();
    };
    listeners.add(onUnauthorized);
    // Another tab signed in or out.
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) setSession(readSession());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(onUnauthorized);
      window.removeEventListener('storage', onStorage);
    };
  }, [signOut]);

  const value = useMemo(
    () => ({ currentUser: session?.user ?? null, isAuthed: session !== null, signIn, signOut }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
