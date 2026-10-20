// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { AuthProvider, SESSION_KEY, useAuth } from '@contexts';

import instance from './AxiosInstance';

const SESSION = { token: 't-123', user: { userId: '7', name: 'Lina', email: 'lina@example.com' } };
let seen: InternalAxiosRequestConfig | null = null;
const respond =
  (status: number): AxiosAdapter =>
  async (config) => {
    seen = config;
    const response = { data: { message: status === 401 ? 'expired' : 'ok' }, status, statusText: '', headers: {}, config };
    if (status >= 400) throw new AxiosError('failed', String(status), config, null, response);
    return response;
  };

function Probe() {
  return <p>{useAuth().isAuthed ? 'in' : 'out'}</p>;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
  seen = null;
});
afterEach(cleanup);

describe('AxiosInstance', () => {
  it('sends the session token as a Bearer token on requests that ask for it, and not on the rest', async () => {
    await instance.get('/me', { withToken: true, adapter: respond(200) });
    expect(seen?.headers.get('Authorization')).toBe('Bearer t-123');
    await instance.get('/public', { adapter: respond(200) });
    expect(seen?.headers.get('Authorization')).toBeUndefined();
  });

  it('ends the session when the API rejects the token (401)', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByText('in')).toBeTruthy();
    await act(async () => {
      await instance.get('/me', { withToken: true, adapter: respond(401) }).catch(() => {});
    });
    expect(screen.getByText('out')).toBeTruthy();
  });

  it('keeps the session on a 401 from a request sent without the token (a wrong password at sign-in)', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await instance.post('/auth/login', {}, { adapter: respond(401) }).catch(() => {});
    });
    expect(screen.getByText('in')).toBeTruthy();
  });
});
