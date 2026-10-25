// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { Session } from '@contexts';

import { callApi } from './api';
import type { ServerEnv } from './env';

const SESSION: Session = { token: 'api-token-123', user: { userId: '7', name: 'Lina', email: 'lina@example.com', picture: '' } };
const env = (mock: 'true' | 'false'): ServerEnv => ({ SESSION_SECRET: 's'.repeat(40), API_URL: 'https://api.example', AUTH_MOCK: mock });

afterEach(() => vi.restoreAllMocks());

describe('callApi', () => {
  it('answers from the mock backend while AUTH_MOCK is on, without the network', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const response = await callApi(SESSION, { method: 'GET', path: '/members', search: '?pageSize=5' }, env('true'));
    expect(response.status).toBe(200);
    expect((response.body as { data: unknown[] }).data).toHaveLength(5);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls the API with the session's token", async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: 1 }, { status: 201 }));
    const response = await callApi(SESSION, { method: 'POST', path: '/members', search: '?x=1', body: { name: 'A' } }, env('false'));
    expect(response).toEqual({ status: 201, body: { ok: 1 } });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.example/members?x=1');
    expect(init).toMatchObject({ method: 'POST', body: '{"name":"A"}', redirect: 'error' });
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer api-token-123');
  });

  it('answers 502 when the API is unreachable, and an empty body as null', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('fetch failed'));
    expect((await callApi(SESSION, { method: 'GET', path: '/members' }, env('false'))).status).toBe(502);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await callApi(SESSION, { method: 'DELETE', path: '/members/1' }, env('false'))).toEqual({ status: 204, body: null });
  });
});
