import { mockAuth } from '@api/mock/auth';
import { APP_CONFIGURATIONS } from '@app-config';
import type { Session } from '@contexts';

export type Credentials = { email: string; password: string };

// The HTTP client (axios) loads when a request is actually sent: the sign-in pages are an app's first load for a
// signed-out visitor, and in mock mode they never need it.
const http = () => import('@api/config');

/**
 * Sign-in and password reset. POST /auth/login answers `{ token, user }`; a wrong password answers 401 with
 * `{ message }`. Sent without the session token, so a 401 here is the form's to show, not a sign-out.
 */
export const authApi = {
  async signIn(credentials: Credentials): Promise<Session> {
    if (APP_CONFIGURATIONS.AUTH_MOCK) return mockAuth.signIn(credentials);
    const { ApiEndpoints, httpClient } = await http();
    return httpClient.post<Session, Credentials>(ApiEndpoints.AUTH.LOGIN, credentials, { withToken: false });
  },
  async requestPasswordReset(email: string): Promise<void> {
    if (APP_CONFIGURATIONS.AUTH_MOCK) return mockAuth.requestPasswordReset(email);
    const { ApiEndpoints, httpClient } = await http();
    return httpClient.post<void, { email: string }>(ApiEndpoints.AUTH.FORGOT_PASSWORD, { email }, { withToken: false });
  },
};
