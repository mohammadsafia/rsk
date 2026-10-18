// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Toast } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('Toast', () => {
  it('centers a top-center viewport with logical insets, not a physical translate', () => {
    render(
      <Toast.Provider>
        <Toast.Viewport position="top-center" />
      </Toast.Provider>,
    );
    const viewport = document.querySelector('[data-slot="toast-viewport"]');
    expect(viewport?.className).toContain('inset-x-0');
    expect(viewport?.className).toContain('mx-auto');
    expect(viewport?.className).not.toMatch(/translate-x/);
  });

  it('keeps every tone on the raised surface and names its close button', () => {
    render(
      <Toast.Provider>
        <Toast open tone="success">
          <Toast.Title>Saved</Toast.Title>
          <Toast.Close />
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const toast = screen.getByText('Saved').closest('[data-slot="toast"]');
    expect(toast?.getAttribute('data-tone')).toBe('success');
    expect(toast?.className).toContain('bg-surface-raised');
    // The heavy top rule is the auto-close timer now; it pauses on hover and focus.
    expect(toast?.className).not.toContain('rule-top');
    const timer = toast?.querySelector<HTMLElement>('[data-slot="toast-timer"]');
    expect(timer?.getAttribute('aria-hidden')).toBe('true');
    expect(timer?.className).toContain('group-hover:[animation-play-state:paused]');
    expect(timer?.className).toContain('group-focus-within:[animation-play-state:paused]');
    expect(timer?.className).toContain('motion-reduce:animate-none');
    // The close button is always visible, not only on hover.
    expect(toast?.querySelector('[data-slot="toast-close"]')?.className).not.toContain('opacity-0');
    expect(toast?.querySelector('[data-slot="section-marker"]')).toBeNull();
    expect(toast?.querySelector('[data-slot="toast-title"]')?.textContent).toBe('Saved');
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('keeps the close button always visible (touch and mouse alike)', () => {
    render(
      <Toast.Provider>
        <Toast open>
          <Toast.Title>Saved</Toast.Title>
          <Toast.Close />
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close.className).not.toMatch(/(^|\s)opacity-0(\s|$)/);
    expect(close.className).not.toContain('opacity-0');
  });

  it('sits at the very top, above the app header', () => {
    render(
      <Toast.Provider>
        <Toast.Viewport label="Notifications" />
      </Toast.Provider>,
    );
    const viewport = document.querySelector<HTMLElement>('[data-slot="toast-viewport"]') ?? document.querySelector<HTMLElement>('ol');
    expect(viewport?.className).toContain('top-0');
    expect(viewport?.className).not.toContain('top-16');
  });
});
