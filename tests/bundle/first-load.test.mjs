// tests/bundle/first-load.test.mjs — the pure parts of the first-load budget script.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  BUNDLE_BUDGET_KB,
  NEXT_BUDGET_KB,
  localeKeys,
  rawKeysIn,
  failuresOf,
  localizedRoutes,
  parseRedirects,
  resolveBudget,
  resolveFile,
  serve,
} from '../../scripts/bundle/first-load.mjs';

const locales = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'locales-'));
  writeFileSync(
    path.join(dir, 'common.json'),
    JSON.stringify({ empty: { title: 'Nothing here', description: 'Add one' }, close: 'Close' }),
  );
  return dir;
};

describe('first-load page check', () => {
  it('collects every dotted key path, with and without its namespace', () => {
    const keys = localeKeys(locales());
    expect(keys.has('empty.title')).toBe(true);
    expect(keys.has('common.empty.title')).toBe(true);
    expect(keys.has('close')).toBe(false); // an undotted key is ordinary text ("close")
  });

  it('finds a raw key on the page, and ignores translated text, emails and file names', () => {
    const keys = localeKeys(locales());
    // innerText puts block elements on their own lines, as the spike's broken page would read.
    expect(rawKeysIn('title\ndescription\nempty.title\nempty.description', keys)).toEqual(['empty.title', 'empty.description']);
    expect(rawKeysIn('Nothing here — write to layla@empty.title.com or open empty.title.json', keys)).toEqual([]);
  });

  it("resolves --budget: 'starter' is the starter's budget, a number is itself, nothing means report only", () => {
    expect(BUNDLE_BUDGET_KB).toBe(210);
    expect(resolveBudget('starter')).toBe(210);
    expect(resolveBudget('150')).toBe(150);
    expect(resolveBudget(undefined)).toBeUndefined();
    expect(() => resolveBudget('lots')).toThrow(/--budget/);
  });

  it('serves only files inside dist: an escaped ../ falls back to index.html, a malformed escape is refused', () => {
    const dist = mkdtempSync(path.join(tmpdir(), 'dist-'));
    mkdirSync(path.join(dist, 'assets'));
    writeFileSync(path.join(dist, 'index.html'), '<html></html>');
    writeFileSync(path.join(dist, 'assets', 'app.js'), '');
    expect(resolveFile(dist, '/assets/app.js?v=1')).toBe(path.join(dist, 'assets', 'app.js'));
    expect(resolveFile(dist, '/dashboard')).toBe(path.join(dist, 'index.html'));
    expect(resolveFile(dist, '/..%2f..%2f..%2fetc%2fpasswd')).toBe(path.join(dist, 'index.html'));
    expect(resolveFile(dist, '/%E0')).toBeNull();
  });

  it('listens on loopback only, never on every interface', async () => {
    const dist = mkdtempSync(path.join(tmpdir(), 'dist-'));
    writeFileSync(path.join(dist, 'index.html'), '');
    const server = await serve(dist);
    expect(server.address().address).toBe('127.0.0.1');
    server.close();
  });

  it('fails a route that landed somewhere else, unless that redirect was declared', () => {
    const result = { route: '/auth/login', landed: '/dashboard', gzipKb: 100, errors: [], rawKeys: [] };
    expect(failuresOf(result, { budget: 210, redirects: {} })).toEqual(['redirected to /dashboard']);
    expect(failuresOf({ ...result, route: '/' }, { budget: 210, redirects: parseRedirects('/=/dashboard') })).toEqual([]);
    expect(failuresOf({ ...result, landed: '/auth/login', gzipKb: 300 }, { budget: 210, redirects: {} })).toEqual(['over 210 KB']);
  });

  it('puts each route under each language when the language is in the path (a Next app), and leaves it alone otherwise', () => {
    expect(localizedRoutes(['/', '/dashboard'], 'path')).toEqual(['/en', '/en/dashboard', '/ar', '/ar/dashboard']);
    expect(localizedRoutes(['/', '/dashboard'], 'storage')).toEqual(['/', '/dashboard']);
    expect(() => localizedRoutes(['/'], 'query')).toThrow(/--lang-in/);
  });

  it("resolves --budget next-starter to the Next starter's own budget", () => {
    expect(NEXT_BUDGET_KB).toBeGreaterThan(BUNDLE_BUDGET_KB);
    expect(resolveBudget('next-starter')).toBe(NEXT_BUDGET_KB);
  });

  it('fails a route whose page logged a hydration error (the server and the browser rendered differently)', () => {
    const result = {
      route: '/en/login',
      landed: '/en/login',
      gzipKb: 100,
      errors: [],
      rawKeys: [],
      hydrationErrors: ['Hydration failed because …'],
    };
    expect(failuresOf(result, { budget: 400, redirects: {} })).toEqual(['hydration errors: Hydration failed because …']);
  });
});
