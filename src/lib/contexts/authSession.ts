// The session as storage keeps it, readable from anywhere (the API layer reads it outside React).

export type CurrentUser = { userId: string; name: string; email: string; picture?: string };

export type Session = { token: string; user: CurrentUser };

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

export const listeners = new Set<(token: string | undefined) => void>();

/**
 * For the API layer: the server rejected `token` (401), so that session is over. A 401 for an older token (a slow
 * request from before signing in again) leaves the current session alone.
 */
export const notifyUnauthorized = (token?: string) => listeners.forEach((listener) => listener(token));
