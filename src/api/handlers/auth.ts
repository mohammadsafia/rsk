import { ApiEndpoints, httpClient } from '@api/config';
import { mockAuth } from '@api/mock/auth';
import { APP_CONFIGURATIONS } from '@app-config';
import type { Session } from '@contexts';

export type Credentials = { email: string; password: string };

const URL = ApiEndpoints.AUTH;

/**
 * Sign-in and password reset. POST /auth/login answers `{ token, user }`; a wrong password answers 401 with
 * `{ message }`. Sent without the session token, so a 401 here is the form's to show, not a sign-out.
 */
export const authApi = {
  signIn(credentials: Credentials): Promise<Session> {
    if (APP_CONFIGURATIONS.AUTH_MOCK) return mockAuth.signIn(credentials);
    return httpClient.post<Session, Credentials>(URL.LOGIN, credentials, { withToken: false });
  },
  requestPasswordReset(email: string): Promise<void> {
    if (APP_CONFIGURATIONS.AUTH_MOCK) return mockAuth.requestPasswordReset(email);
    return httpClient.post<void, { email: string }>(URL.FORGOT_PASSWORD, { email }, { withToken: false });
  },
};
