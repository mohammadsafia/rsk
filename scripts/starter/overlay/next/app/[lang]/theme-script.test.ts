// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { THEME_SCRIPT } from './theme-script';

const root = document.documentElement;
const run = (reduced = false) => {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes('reduced-motion'),
  })) as unknown as typeof window.matchMedia;
  new Function(THEME_SCRIPT)();
};

afterEach(() => {
  localStorage.clear();
  root.className = '';
  delete root.dataset.motion;
  vi.restoreAllMocks();
});

describe('theme script', () => {
  it('paints the stored theme before React runs, falling back to the old key, then dark', () => {
    localStorage.setItem('rsk-theme', '"light"');
    run();
    expect(root.className).toBe('light');
    root.className = '';
    localStorage.clear();
    localStorage.setItem('vite-ui-theme', '"light"');
    run();
    expect(root.className).toBe('light');
    root.className = '';
    localStorage.clear();
    run();
    expect(root.className).toBe('dark');
  });

  it('never writes the stored value into the page', () => {
    localStorage.setItem('rsk-theme', '"x onload"');
    run();
    expect(root.className).toBe('dark');
    localStorage.setItem('rsk-theme', '{not json');
    root.className = '';
    run();
    expect(root.className).toBe('dark');
  });

  it('sets the motion setting before the first paint', () => {
    run(true);
    expect(root.dataset.motion).toBe('reduced');
    run(false);
    expect(root.dataset.motion).toBe('expressive');
  });
});
