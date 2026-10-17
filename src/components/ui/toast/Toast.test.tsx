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
    expect(toast?.className).toContain('rule-top');
    expect(toast?.querySelector('[data-slot="section-marker"]')).toBeNull();
    expect(toast?.querySelector('[data-slot="toast-title"]')?.textContent).toBe('Saved');
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('keeps the close button visible on touch screens', () => {
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
    expect(close.className).toContain('pointer-fine:opacity-0');
  });
});
