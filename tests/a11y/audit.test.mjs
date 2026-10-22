// tests/a11y/audit.test.mjs — route discovery of the a11y audit, against a fake browser.
import { describe, expect, it } from 'vite-plus/test';

import { mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { discoverRoutes, isEntry, languageFree, routesFor } from '../../scripts/a11y/audit.mjs';

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

  it('knows it was run directly even through a symlinked path (Node resolves import.meta.url, not argv)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'audit-entry-'));
    const real = path.join(dir, 'audit.mjs');
    writeFileSync(real, '');
    const link = path.join(dir, 'linked.mjs');
    symlinkSync(real, link);
    const metaUrl = pathToFileURL(realpathSync(real)).href;
    expect(isEntry(metaUrl, link)).toBe(true);
    expect(isEntry(metaUrl, real)).toBe(true);
    expect(isEntry(metaUrl, path.join(dir, 'other.mjs'))).toBe(false);
    expect(isEntry(metaUrl, undefined)).toBe(false);
  });

  it('with the language in the path (a Next app), audits each language-free route under /{lang}', () => {
    expect(languageFree(['/en', '/en/dashboard', '/ar/dashboard', '/about'])).toEqual(['/', '/dashboard', '/about']);
    expect(routesFor(['/', '/dashboard'], 'ar', 'path')).toEqual(['/ar', '/ar/dashboard']);
    expect(routesFor(['/', '/dashboard'], 'ar', 'storage')).toEqual(['/', '/dashboard']);
  });
});
