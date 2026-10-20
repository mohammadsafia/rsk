export const APP_CONFIGURATIONS = {
  APP_NAME: 'Starter',
  VITE_APP_API_URL: 'http://localhost:3000/api',
  /**
   * Sign in against the built-in mock (demo@example.com / demo-password) instead of the API. Set to false once your
   * API answers POST /auth/login and /auth/forgot-password (src/api/handlers/auth.ts), then delete src/api/mock.
   */
  AUTH_MOCK: true,
  /** Default ISO 4217 currency for <Money> and money-formatted charts. */
  CURRENCY: 'USD',
} as const;
