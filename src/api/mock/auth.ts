// A stand-in auth backend so the app signs in before it has a real API. Turn it off with AUTH_MOCK in
// src/app-config/appConfig.ts once your API answers /auth/login and /auth/forgot-password — then delete this file.
import type { Session } from '@contexts';

export const DEMO_CREDENTIALS = { email: 'demo@example.com', password: 'demo-password' } as const;

const DEMO_SESSION: Session = {
  token: 'demo-token',
  user: { userId: 'demo', name: 'Demo User', email: DEMO_CREDENTIALS.email, picture: '' },
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuth = {
  async signIn(credentials: { email: string; password: string }, latency = 400): Promise<Session> {
    await wait(latency);
    const known = credentials.email.trim().toLowerCase() === DEMO_CREDENTIALS.email && credentials.password === DEMO_CREDENTIALS.password;
    // The same shape a real API's 401 body has after httpClient unwraps it.
    if (!known) throw { status: 401, message: 'The email or password is incorrect.' };
    return DEMO_SESSION;
  },
  async requestPasswordReset(_email: string, latency = 400): Promise<void> {
    await wait(latency);
  },
};
