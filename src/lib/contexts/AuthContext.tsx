import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type CurrentUser = { userId: string; name: string; email: string; picture?: string };
export type Session = { token: string; user: CurrentUser };

type AuthState = {
  currentUser: CurrentUser | null;
  isAuthed: boolean;
  /** Starts a session (after the API accepted the person's credentials) and remembers it for the next visit. */
  signIn: (session: Session) => void;
  signOut: () => void;
};

/** Where the session is kept between visits (and how other tabs hear about sign-in and sign-out). */
export const SESSION_KEY = 'session';

const isSession = (value: unknown): value is Session => {
  const session = value as Partial<Session> | null;
  return typeof session?.token === 'string' && !!session.token && typeof session.user?.email === 'string';
};

/** The stored session, or null when there is none, it is damaged, or storage is blocked. */
export function readSession(): Session | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    return isSession(value) ? value : null;
  } catch {
    return null;
  }
}

const listeners = new Set<(token: string | undefined) => void>();

/**
 * For the API layer: the server rejected `token` (401), so that session is over. A 401 for an older token (a slow
 * request from before signing in again) leaves the current session alone.
 */
export const notifyUnauthorized = (token?: string) => listeners.forEach((listener) => listener(token));

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
