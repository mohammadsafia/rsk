// scripts/lib/demo-session.mjs — the mock backend's demo session, so the audit and the budget gate can see the pages
// behind sign-in. Kept equal to src/api/mock/auth.ts by tests/a11y/demo-session.test.ts.
export const SESSION_KEY = 'session';

export const DEMO_SESSION = {
  token: 'demo-token',
  user: { userId: 'demo', name: 'Demo User', email: 'demo@example.com', picture: '' },
};

/** A Playwright init script that signs the page in as the demo user before the app reads storage. */
export const seedDemoSession = async (context) =>
  context.addInitScript(([key, session]) => localStorage.setItem(key, JSON.stringify(session)), [SESSION_KEY, DEMO_SESSION]);
