import { describe, expect, it } from 'vite-plus/test';

import { DEMO_CREDENTIALS, mockAuth } from './auth';

describe('mock auth backend', () => {
  it('signs the demo account in with a token and its user', async () => {
    const session = await mockAuth.signIn(DEMO_CREDENTIALS, 0);
    expect(session.token).toMatch(/\S+/);
    expect(session.user.email).toBe(DEMO_CREDENTIALS.email);
  });

  it('accepts the email in any case, and refuses a wrong password with a 401-shaped error', async () => {
    await expect(mockAuth.signIn({ ...DEMO_CREDENTIALS, email: 'DEMO@example.com' }, 0)).resolves.toBeTruthy();
    await expect(mockAuth.signIn({ ...DEMO_CREDENTIALS, password: 'nope' }, 0)).rejects.toMatchObject({
      status: 401,
      message: expect.any(String),
    });
  });

  it('accepts any reset request, so it never tells whether an account exists', async () => {
    await expect(mockAuth.requestPasswordReset('nobody@example.com', 0)).resolves.toBeUndefined();
  });
});
