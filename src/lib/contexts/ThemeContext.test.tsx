// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { THEME_TYPES, ThemeProvider, useTheme } from './ThemeContext';

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

const switching = () => document.documentElement.classList.contains('theme-switching');

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
  document.documentElement.classList.remove('theme-switching');
});

describe('ThemeProvider cross-fade', () => {
  it('never cross-fades on load', () => {
    render(
      <ThemeProvider defaultTheme={THEME_TYPES.LIGHT}>
        <Probe />
      </ThemeProvider>,
    );
    expect(switching()).toBe(false);
  });

  it('cross-fades while switching, then removes the class, even after rapid toggles', () => {
    render(
      <ThemeProvider defaultTheme={THEME_TYPES.LIGHT}>
        <Probe />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(switching()).toBe(true);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(switching()).toBe(true);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(switching()).toBe(false);
  });
});
