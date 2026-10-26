// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { listeners } from '../../lib/contexts/authSession';
import { membersApi } from './members';

afterEach(() => {
  vi.restoreAllMocks();
  listeners.clear();
});

describe('membersApi', () => {
  it('ends the session in the browser when /api answers 401, as the Vite app’s httpClient does', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ message: 'Sign in again.' }, { status: 401 }));
    const signedOut = vi.fn();
    listeners.add(signedOut);
    await expect(membersApi.list('page=1')).rejects.toMatchObject({ status: 401 });
    expect(signedOut).toHaveBeenCalled();
  });
});
