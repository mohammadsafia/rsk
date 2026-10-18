// tests/bundle/first-load.test.mjs — the pure parts of the first-load budget script.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { BUNDLE_BUDGET_KB, localeKeys, rawKeysIn, resolveBudget } from '../../scripts/bundle/first-load.mjs';

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
});
