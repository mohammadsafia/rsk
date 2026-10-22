'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useIsHydrated } from '../hooks/shared/useIsHydrated';

import { type CurrentUser, listeners, readSession, type Session, SESSION_KEY } from './authSession';

type AuthState = {
  currentUser: CurrentUser | null;
  isAuthed: boolean;
  /**
   * Starts a session (after the API accepted the person's credentials) and remembers it for the next visit. Returns a
   * promise only when the app's `signInWith` does (the session starts once it settles).
   */
  signIn: (session: Session) => void | Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  /** Runs whenever a session ends (sign-out or a 401): drop what the last user loaded, e.g. the query cache. */
  onSignOut?: () => void;
  /** The session a server renders with (a Next app reads it from its cookie); storage is read only in the browser. */
  initialSession?: Session | null;
  /** 'storage' keeps the session in localStorage (a Vite app); 'none' leaves it to the server (a Next app's cookie). */
  persist?: 'storage' | 'none';
  /** Called before a session starts, e.g. to set the server's session cookie. */
  signInWith?: (session: Session) => Promise<void> | void;
  /** Called when a session ends by signing out, e.g. to clear the server's session cookie. */
  signOutWith?: () => Promise<void> | void;
};

const writeSession = (session: Session | null): void => {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: the session lasts for this visit only.
  }
};

export function AuthProvider({
  children,
  onSignOut,
  initialSession = null,
  persist = 'storage',
  signInWith,
  signOutWith,
}: AuthProviderProps) {
  const hydrated = useIsHydrated();
  const stored = persist === 'storage';
  const callbacks = useRef({ onSignOut, signInWith, signOutWith });
  useEffect(() => {
    callbacks.current = { onSignOut, signInWith, signOutWith };
  }, [onSignOut, signInWith, signOutWith]);

  // Until someone signs in or out: the stored session once storage is readable (from the first render under createRoot).
  const [chosen, setChosen] = useState<Session | null | undefined>(undefined);
  const session = chosen !== undefined ? chosen : stored && hydrated ? readSession() : initialSession;
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const signIn = useCallback(
    (next: Session) => {
      const start = () => {
        if (stored) writeSession(next);
        setChosen(next);
      };
      const pending = callbacks.current.signInWith?.(next);
      if (pending) return pending.then(start);
      start();
    },
    [stored],
  );

  const signOut = useCallback(() => {
    if (stored) writeSession(null);
    void callbacks.current.signOutWith?.();
    setChosen(null);
    callbacks.current.onSignOut?.();
  }, [stored]);

  useEffect(() => {
    const onUnauthorized = (token: string | undefined) => {
      const current = stored ? readSession() : sessionRef.current;
      if (token === undefined || token === current?.token) signOut();
    };
    listeners.add(onUnauthorized);
    // Another tab signed in or out.
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) setChosen(readSession());
    };
    if (stored) window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(onUnauthorized);
      window.removeEventListener('storage', onStorage);
    };
  }, [signOut, stored]);

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
