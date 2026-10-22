// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { ThemeProvider, useTheme } from './ThemeContext';
import { THEME_TYPES } from './themeTypes';

function Probe() {
  const { setTheme } = useTheme();
  return (
    <>
      <button type="button" onClick={() => setTheme(THEME_TYPES.DARK)}>
        Dark
      </button>
      <button type="button" onClick={() => setTheme(THEME_TYPES.LIGHT)}>
        Light
      </button>
    </>
  );
}

const root = document.documentElement;
// A test double for the View Transitions API, which happy-dom lacks: loose, so it need not build a full ViewTransition.
type Doc = { startViewTransition?: unknown };

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete (document as unknown as Doc).startViewTransition;
  delete root.dataset.motion;
  root.classList.remove('light', 'dark');
});

const renderProbe = () =>
  render(
    <ThemeProvider defaultTheme={THEME_TYPES.LIGHT}>
      <Probe />
    </ThemeProvider>,
  );

describe('ThemeProvider switch', () => {
  it('swaps the theme inside one view transition, so every pixel changes together', () => {
    const seen: string[] = [];
    (document as unknown as Doc).startViewTransition = vi.fn((update: () => void) => {
      seen.push(`before:${root.className}`);
      update();
      seen.push(`after:${root.className}`);
      return { finished: Promise.resolve(), ready: Promise.resolve(), updateCallbackDone: Promise.resolve() };
    });
    renderProbe();
    expect((document as unknown as Doc).startViewTransition).not.toHaveBeenCalled(); // never on load
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect((document as unknown as Doc).startViewTransition).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(['before:light', 'after:theme-switching dark']);
  });

  it("freezes elements' own colour transitions while the theme swaps, so nothing fades inside the reveal", async () => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let frozenDuringUpdate = false;
    (document as unknown as Doc).startViewTransition = vi.fn((update: () => void) => {
      update();
      frozenDuringUpdate = root.classList.contains('theme-switching');
      return { finished, ready: Promise.resolve(), updateCallbackDone: Promise.resolve() };
    });
    renderProbe();
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(frozenDuringUpdate).toBe(true);
    expect(root.classList.contains('theme-switching')).toBe(true);
    await act(async () => {
      finish();
      await finished;
    });
    expect(root.classList.contains('theme-switching')).toBe(false);
  });

  it('reveals the new theme as a circle from where the switch was pressed, wide enough to cover the far corner', () => {
    (document as unknown as Doc).startViewTransition = vi.fn((update: () => void) => {
      update();
      return { finished: Promise.resolve(), ready: Promise.resolve(), updateCallbackDone: Promise.resolve() };
    });
    renderProbe();
    window.innerWidth = 1000;
    window.innerHeight = 800;
    const dark = screen.getByRole('button', { name: 'Dark' });
    fireEvent.pointerDown(dark, { clientX: 100, clientY: 200 });
    fireEvent.click(dark, { clientX: 100, clientY: 200 });
    expect(root.style.getPropertyValue('--theme-reveal-x')).toBe('100px');
    expect(root.style.getPropertyValue('--theme-reveal-y')).toBe('200px');
    // The far corner (1000, 800) is hypot(900, 600) ≈ 1081.67px away.
    expect(root.style.getPropertyValue('--theme-reveal-r')).toBe('1082px');
  });

  it('switches at once without the View Transitions API, and under reduced motion', () => {
    renderProbe();
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(root.classList.contains('dark')).toBe(true);

    const start = vi.fn();
    (document as unknown as Doc).startViewTransition = start;
    root.dataset.motion = 'reduced';
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(start).not.toHaveBeenCalled();
    expect(root.classList.contains('light')).toBe(true);
  });
});

describe('ThemeProvider storage', () => {
  it('keeps a theme saved under the old vite-ui-theme key, and saves it under rsk-theme', () => {
    localStorage.setItem('vite-ui-theme', '"light"');
    render(
      <ThemeProvider defaultTheme={THEME_TYPES.DARK}>
        <Probe />
      </ThemeProvider>,
    );
    expect(root.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('rsk-theme')).toBe('"light"');
  });

  it('reads rsk-theme first and remembers a switch there', () => {
    localStorage.setItem('rsk-theme', '"light"');
    localStorage.setItem('vite-ui-theme', '"dark"');
    render(
      <ThemeProvider defaultTheme={THEME_TYPES.DARK}>
        <Probe />
      </ThemeProvider>,
    );
    expect(root.classList.contains('light')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(root.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('rsk-theme')).toBe('"dark"');
  });
});
