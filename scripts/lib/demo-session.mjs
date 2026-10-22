// scripts/lib/demo-session.mjs — the mock backend's demo session, so the audit and the budget gate can see the pages
// behind sign-in. Kept equal to src/api/mock/auth.ts by tests/a11y/demo-session.test.ts.
export const SESSION_KEY = 'session';

export const DEMO_SESSION = {
  token: 'demo-token',
  user: { userId: 'demo', name: 'Demo User', email: 'demo@example.com', picture: '' },
};

/**
 * Signs a Playwright context in as the demo user before the app reads its session: in localStorage (a Vite app), or as
 * a `session` cookie for `url` (a Next app, whose server reads the cookie).
 */
export const seedDemoSession = async (context, { via = 'storage', url } = {}) => {
  if (via === 'cookie') {
    if (!url) throw new Error('seedDemoSession: a cookie needs the url it is for');
    await context.addCookies([{ name: SESSION_KEY, value: encodeURIComponent(JSON.stringify(DEMO_SESSION)), url }]);
    return;
  }
  if (via !== 'storage') throw new Error(`--seed must be storage or cookie, not "${via}"`);
  await context.addInitScript(([key, session]) => localStorage.setItem(key, JSON.stringify(session)), [SESSION_KEY, DEMO_SESSION]);
};
