// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

describe('next.config', () => {
  it("accepts server actions from the site's own origin, for proxies that rewrite Host (as sign-in does)", async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.example.com/base/');
    vi.resetModules();
    const { default: config } = await import('./next.config');
    expect(config.experimental?.serverActions?.allowedOrigins).toEqual(['app.example.com']);
    vi.unstubAllEnvs();
  });
});
