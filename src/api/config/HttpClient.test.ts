import { AxiosError, type AxiosAdapter } from 'axios';
import { describe, expect, it } from 'vite-plus/test';

import { httpClient } from './HttpClient';

const reject =
  (status: number, data: unknown): AxiosAdapter =>
  async (config) => {
    throw new AxiosError('failed', String(status), config, null, { data, status, statusText: '', headers: {}, config });
  };

describe('httpClient errors', () => {
  it("throws the API's body with the HTTP status on it, so a caller can tell a wrong password (401) from an outage", async () => {
    await expect(
      httpClient.post('/auth/login', {}, { withToken: false, adapter: reject(401, { message: 'Bad credentials' }) }),
    ).rejects.toEqual({
      message: 'Bad credentials',
      status: 401,
    });
  });

  it('keeps a non-object body intact', async () => {
    await expect(httpClient.get('/x', { adapter: reject(500, 'Server down') })).rejects.toBe('Server down');
  });
});
