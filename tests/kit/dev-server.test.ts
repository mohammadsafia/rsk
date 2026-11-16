// The dev server's port and API proxy come from the environment, so two copies of an app (parallel work, a QA run
// beside a developer's) can run side by side without editing vite.config.ts.
import { describe, expect, it } from 'vite-plus/test';

import { devServer } from '../../scripts/lib/dev-server';

describe('devServer', () => {
  it('keeps the defaults when nothing is set: port 3000, no proxy', () => {
    expect(devServer({})).toEqual({ port: 3000, open: true });
  });

  it('takes the port from DEV_PORT and refuses to drift to another one when it is taken', () => {
    expect(devServer({ DEV_PORT: '5101' })).toMatchObject({ port: 5101, strictPort: true });
  });

  it('proxies /api to DEV_API_TARGET, or the path DEV_API_PATH names', () => {
    expect(devServer({ DEV_API_TARGET: 'http://localhost:5097' }).proxy).toEqual({
      '/api': { target: 'http://localhost:5097', changeOrigin: true },
    });
    expect(devServer({ DEV_API_TARGET: 'http://localhost:5097', DEV_API_PATH: '/backend' }).proxy).toEqual({
      '/backend': { target: 'http://localhost:5097', changeOrigin: true },
    });
  });

  it('DEV_OPEN=false stops it opening a browser (headless runs)', () => {
    expect(devServer({ DEV_OPEN: 'false' }).open).toBe(false);
  });

  it('refuses a port or target it cannot use, instead of starting somewhere unexpected', () => {
    expect(() => devServer({ DEV_PORT: 'abc' })).toThrow(/DEV_PORT/);
    expect(() => devServer({ DEV_PORT: '70000' })).toThrow(/DEV_PORT/);
    expect(() => devServer({ DEV_API_TARGET: 'localhost:5080' })).toThrow(/DEV_API_TARGET/);
  });
});
