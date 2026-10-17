// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MotionProvider, useMotion } from '@contexts';

import i18n from '../../i18n';

let reduce = false;
let listeners: Array<() => void> = [];
const mockMatchMedia = () =>
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return query.includes('reduce') && reduce;
        },
        media: query,
        addEventListener: (_: string, fn: () => void) => listeners.push(fn),
        removeEventListener: (_: string, fn: () => void) => (listeners = listeners.filter((listener) => listener !== fn)),
      }) as unknown as MediaQueryList,
  );

const Probe = () => {
  const { mode, direction, tokens } = useMotion();
  return <p data-testid="probe">{`${mode} ${direction} ${tokens.durations.base}`}</p>;
};

afterEach(async () => {
  cleanup();
  reduce = false;
  listeners = [];
  vi.restoreAllMocks();
  delete document.documentElement.dataset.motion;
  await act(() => i18n.changeLanguage('en'));
});

describe('MotionProvider', () => {
  it('defaults to expressive and writes data-motion on <html>', () => {
    mockMatchMedia();
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe('expressive ltr 180');
    expect(document.documentElement.dataset.motion).toBe('expressive');
  });

  it('honours mode="calm"', () => {
    mockMatchMedia();
    render(
      <MotionProvider mode="calm">
        <Probe />
      </MotionProvider>,
    );
    expect(document.documentElement.dataset.motion).toBe('calm');
  });

  it('reduced overrides the provider', () => {
    reduce = true;
    mockMatchMedia();
    render(
      <MotionProvider mode="calm">
        <Probe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toMatch(/^reduced/);
    expect(document.documentElement.dataset.motion).toBe('reduced');
  });

  it('follows a live change of the OS setting', () => {
    mockMatchMedia();
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );
    act(() => {
      reduce = true;
      listeners.forEach((listener) => listener());
    });
    expect(document.documentElement.dataset.motion).toBe('reduced');
  });

  it('reports rtl direction in Arabic', async () => {
    mockMatchMedia();
    await act(() => i18n.changeLanguage('ar'));
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe('expressive rtl 180');
  });

  it('without a provider, still honours the OS reduced-motion setting', () => {
    reduce = true;
    mockMatchMedia();
    render(<Probe />);
    expect(screen.getByTestId('probe').textContent).toMatch(/^reduced/);
  });
});
