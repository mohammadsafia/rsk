// tests/a11y/audit.test.mjs — route discovery of the a11y audit, against a fake browser.
import { describe, expect, it } from 'vite-plus/test';

import { discoverRoutes } from '../../scripts/a11y/audit.mjs';

const BASE = 'http://localhost:5173';

/** A browser whose pages link as `site` says; `redirects` maps a path to where it lands. */
const fakeBrowser = (site, redirects = {}) => ({
  newPage: async () => {
    let current = `${BASE}/`;
    return {
      goto: async (url) => {
        const path = new URL(url).pathname;
        current = `${BASE}${redirects[path] ?? path}`;
      },
      url: () => current,
      waitForTimeout: async () => {},
      // The page resolves each anchor's href against its own URL, as `anchor.href` does in a browser.
      $$eval: async () => (site[new URL(current).pathname] ?? []).map((href) => new URL(href, current).href),
      close: async () => {},
    };
  },
});

describe('a11y audit route discovery', () => {
  it('follows a redirecting "/" to the page it lands on, and resolves relative links from there', async () => {
    const browser = fakeBrowser(
      { '/app/': ['patients', '/app/billing', 'https://elsewhere.test/x'], '/app/patients': [] },
      { '/': '/app/' },
    );
    const { routes } = await discoverRoutes(browser, { base: BASE, max: 50 });
    expect(routes).toEqual(expect.arrayContaining(['/app/', '/app/patients', '/app/billing']));
    expect(routes.some((route) => route.includes('elsewhere'))).toBe(false);
  });

  it('says when it stopped at --max, so a capped audit is never mistaken for a full one', async () => {
    const browser = fakeBrowser({ '/': ['/a', '/b', '/c', '/d'] });
    const capped = await discoverRoutes(browser, { base: BASE, max: 3 });
    expect(capped.routes).toHaveLength(3);
    expect(capped.truncated).toBe(true);
    const full = await discoverRoutes(browser, { base: BASE, max: 50 });
    expect(full.truncated).toBe(false);
  });
});
