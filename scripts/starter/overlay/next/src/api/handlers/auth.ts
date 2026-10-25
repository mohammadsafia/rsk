// Sign-in and password reset for a Next app: the browser talks to this app's own route handlers (app/api/auth), which
// talk to the API and keep the token in an httpOnly cookie. The browser gets the user, never the token.
import type { Session } from '@contexts';

export type Credentials = { email: string; password: string };

/** POSTs JSON to this app; a failure throws `{ status, message }`, as the Vite app's httpClient does. */
async function post(path: string, body: unknown): Promise<Response> {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw { status: response.status, message: data.message };
  }
  return response;
}

export const authApi = {
  async signIn(credentials: Credentials): Promise<Session> {
    const { user } = (await (await post('/api/auth/login', credentials)).json()) as Pick<Session, 'user'>;
    return { token: '', user };
  },
  async requestPasswordReset(email: string): Promise<void> {
    await post('/api/auth/forgot-password', { email });
  },
};
