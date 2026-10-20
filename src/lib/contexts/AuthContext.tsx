import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

const listeners = new Set<() => void>();

/** For the API layer: the server rejected the token (401), so the session is over. */
export const notifyUnauthorized = () => listeners.forEach((listener) => listener());

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

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
  }, []);

  useEffect(() => {
    listeners.add(signOut);
    // Another tab signed in or out.
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) setSession(readSession());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(signOut);
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
