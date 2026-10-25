// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
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
        <Toast open tone="success" duration={4000}>
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
    expect(timer?.className).toContain('group-data-paused:[animation-play-state:paused]');
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

  it('portals its viewport to <body>, so toasts sit above an open dialog even when the page recedes behind it', () => {
    render(
      <Toast.Provider>
        <div data-slot="app-shell">
          <Toast.Viewport />
        </div>
      </Toast.Provider>,
    );
    const viewport = document.querySelector('[data-slot="toast-viewport"]')!;
    expect(viewport.closest('[data-slot="app-shell"]')).toBeNull();
    expect(viewport.parentElement?.parentElement).toBe(document.body);
  });

  it('drains its timer over its own duration, outside the Toaster too; with no duration the rule stays whole', () => {
    render(
      <Toast.Provider>
        <Toast open duration={3000}>
          <Toast.Title>Timed</Toast.Title>
        </Toast>
        <Toast open>
          <Toast.Title>Untimed</Toast.Title>
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const timed = screen.getByText('Timed').closest<HTMLElement>('[data-slot="toast"]')!;
    expect(timed.style.getPropertyValue('--toast-duration')).toBe('3000ms');
    expect(timed.querySelector('[data-slot="toast-timer"]')?.className).toContain('rsk-drain');
    const untimed = screen.getByText('Untimed').closest<HTMLElement>('[data-slot="toast"]')!;
    expect(untimed.style.getPropertyValue('--toast-duration')).toBe('');
    // A 0ms drain would empty the rule at once; an untimed toast keeps it full.
    expect(untimed.querySelector('[data-slot="toast-timer"]')?.className).not.toContain('rsk-drain');
  });

  it('pauses its timer whenever Radix pauses the close timer (window blur, F8 into the region), not only on hover', () => {
    render(
      <Toast.Provider>
        <Toast open duration={3000}>
          <Toast.Title>Saved</Toast.Title>
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const toast = screen.getByText('Saved').closest<HTMLElement>('[data-slot="toast"]')!;
    expect(toast.dataset.paused).toBeUndefined();
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(toast.dataset.paused).toBe('');
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(toast.dataset.paused).toBeUndefined();
  });

  it('renders on a server and hydrates without a mismatch, then portals its viewport (a Next app)', async () => {
    const tree = (
      <Toast.Provider>
        <Toast.Viewport />
      </Toast.Provider>
    );
    // On a server there is no document: nothing to portal into.
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'document')!;
    Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true });
    let html = '';
    try {
      html = renderToString(tree);
    } finally {
      Object.defineProperty(globalThis, 'document', saved);
    }
    expect(() => renderToString(tree)).not.toThrow();
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors: unknown[] = [];
    await act(async () => void hydrateRoot(container, tree, { onRecoverableError: (error) => errors.push(error) }));
    expect(errors).toEqual([]);
    expect(document.body.querySelector(':scope > [data-slot="toast-viewport"], :scope > * > [data-slot="toast-viewport"]')).toBeTruthy();
    container.remove();
  });
});
