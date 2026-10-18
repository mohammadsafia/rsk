// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const load = async () => (await import('./i18n')).default;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
afterEach(() => localStorage.clear());

describe('i18n language', () => {
  it('starts in the language the person chose last time (localStorage i18nextLng), with the matching direction', async () => {
    localStorage.setItem('i18nextLng', 'ar');
    const i18n = await load();
    expect(i18n.language).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('falls back to English with nothing stored, and remembers a change for next time', async () => {
    const i18n = await load();
    expect(i18n.resolvedLanguage).toBe('en');
    await i18n.changeLanguage('ar');
    expect(localStorage.getItem('i18nextLng')).toBe('ar');
  });

  it('ignores a stored language the app does not ship', async () => {
    localStorage.setItem('i18nextLng', 'fr');
    const i18n = await load();
    expect(i18n.resolvedLanguage).toBe('en');
  });

  it('needs no language-detector package', async () => {
    const { readFileSync } = await import('node:fs');
    const pkg = JSON.parse(readFileSync(`${process.cwd()}/package.json`, 'utf8')) as { dependencies: Record<string, string> };
    expect(Object.keys(pkg.dependencies)).not.toContain('i18next-browser-languagedetector');
  });
});
