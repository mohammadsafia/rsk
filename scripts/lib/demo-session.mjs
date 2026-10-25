// scripts/lib/demo-session.mjs — the mock backend's demo account, so the audit and the budget gate can see the pages
// behind sign-in. Kept equal to src/api/mock/auth.ts by tests/a11y/demo-session.test.ts.
export const SESSION_KEY = 'session';

export const DEMO_CREDENTIALS = { email: 'demo@example.com', password: 'demo-password' };

export const DEMO_SESSION = {
  token: 'demo-token',
  user: { userId: 'demo', name: 'Demo User', email: DEMO_CREDENTIALS.email, picture: '' },
};

/**
 * Signs a Playwright context in as the demo user before the app reads its session: in localStorage (a Vite app), or
 * through the app's own sign-in endpoint (a Next app: its server sets the session cookie, kept by the context).
 */
export const seedDemoSession = async (context, { via = 'storage', url } = {}) => {
  if (via === 'api') {
    if (!url) throw new Error('seedDemoSession: signing in through the API needs the app url');
    const response = await context.request.post(`${url}/api/auth/login`, {
      data: DEMO_CREDENTIALS,
      headers: { Origin: url, 'Content-Type': 'application/json' },
    });
    if (!response.ok()) throw new Error(`Signing in the demo account failed: HTTP ${response.status()}`);
    return;
  }
  if (via !== 'storage') throw new Error(`--seed must be storage or api, not "${via}"`);
  await context.addInitScript(([key, session]) => localStorage.setItem(key, JSON.stringify(session)), [SESSION_KEY, DEMO_SESSION]);
};
