// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

// The docs site is a development tool: `vp build` must not register it or link to it.
const load = async (dev: boolean) => {
  vi.stubEnv('DEV', dev);
  vi.resetModules();
  const { docsRoutes, APP_MENU } = await import('@routes');
  return { docsRoutes, menuIds: APP_MENU.map((item) => item.id) };
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('docs gate', () => {
  it('registers the docs routes and the Components menu item in development', async () => {
    const { docsRoutes, menuIds } = await load(true);

    expect(docsRoutes.map((route) => route.path)).toEqual(['/docs', '/components', '/components/:id']);
    expect(menuIds).toContain('components');
  }, 30_000);

  it('registers no docs routes and no Components menu item in a production build', async () => {
    const { docsRoutes, menuIds } = await load(false);

    expect(docsRoutes).toEqual([]);
    expect(menuIds).not.toContain('components');
  });
});
