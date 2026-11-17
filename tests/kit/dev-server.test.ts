// The dev server's port and API proxy come from the environment, so two copies of an app (parallel work, a QA run
// beside a developer's) can run side by side without editing vite.config.ts.
import { describe, expect, it } from 'vite-plus/test';

import { devServer } from '../../scripts/lib/dev-server';

describe('devServer', () => {
  it('keeps the defaults when nothing is set: port 3000, no proxy', () => {
    expect(devServer({})).toEqual({ port: 3000, open: true });
  });

  it('takes the port from FRONTEND_PORT and refuses to drift to another one when it is taken', () => {
    expect(devServer({ FRONTEND_PORT: '5101' })).toMatchObject({ port: 5101, strictPort: true });
  });

  it('proxies /api to API_PROXY_TARGET, or the path API_PROXY_PATH names', () => {
    expect(devServer({ API_PROXY_TARGET: 'http://localhost:5097' }).proxy).toEqual({
      '/api': { target: 'http://localhost:5097', changeOrigin: true },
    });
    expect(devServer({ API_PROXY_TARGET: 'http://localhost:5097', API_PROXY_PATH: '/backend' }).proxy).toEqual({
      '/backend': { target: 'http://localhost:5097', changeOrigin: true },
    });
  });

  it('FRONTEND_OPEN=false stops it opening a browser (headless runs)', () => {
    expect(devServer({ FRONTEND_OPEN: 'false' }).open).toBe(false);
  });

  it('refuses a port or target it cannot use, instead of starting somewhere unexpected', () => {
    expect(() => devServer({ FRONTEND_PORT: 'abc' })).toThrow(/FRONTEND_PORT/);
    expect(() => devServer({ FRONTEND_PORT: '70000' })).toThrow(/FRONTEND_PORT/);
    expect(() => devServer({ API_PROXY_TARGET: 'localhost:5080' })).toThrow(/API_PROXY_TARGET/);
  });
});
