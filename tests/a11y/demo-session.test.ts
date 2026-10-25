// tests/a11y/demo-session.test.ts — the gates' demo session is the one the mock backend signs in.
import { describe, expect, it } from 'vite-plus/test';

import { DEMO_CREDENTIALS as GATE_CREDENTIALS, DEMO_SESSION, SESSION_KEY } from '../../scripts/lib/demo-session.mjs';
import { DEMO_CREDENTIALS, mockAuth } from '../../src/api/mock/auth';
import { SESSION_KEY as APP_SESSION_KEY } from '../../src/lib/contexts/authSession';

describe('demo session for the gates', () => {
  it('matches the session the mock backend gives the demo account, under the key the app reads', async () => {
    expect(await mockAuth.signIn(DEMO_CREDENTIALS, 0)).toEqual(DEMO_SESSION);
    expect(SESSION_KEY).toBe(APP_SESSION_KEY);
  });

  it('signs in with the demo account the mock backend knows (a Next app’s gates post it to /api/auth/login)', () => {
    expect(GATE_CREDENTIALS).toEqual(DEMO_CREDENTIALS);
  });
});
