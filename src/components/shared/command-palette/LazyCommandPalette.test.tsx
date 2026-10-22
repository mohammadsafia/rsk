// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { LazyCommandPalette } from '@components/shared';

import { AuthProvider, CommandPaletteProvider, ThemeProvider } from '@contexts';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(cleanup);

const renderShell = () =>
  render(
    <MemoryKitRouter>
      <ThemeProvider>
        <AuthProvider>
          <CommandPaletteProvider>
            <LazyCommandPalette />
          </CommandPaletteProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryKitRouter>,
  );

describe('LazyCommandPalette', () => {
  it('renders nothing until first asked to open', () => {
    renderShell();
    expect(document.querySelector('[cmdk-root]')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on the very first ⌘K, once its chunk has loaded', async () => {
    renderShell();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
    });
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it("keeps the page when the palette's chunk fails to load (a deploy since the tab opened), and retries on the next ⌘K", async () => {
    vi.resetModules();
    let fail = true;
    vi.doMock('./CommandPalette', async (importOriginal) => {
      if (fail) throw new Error('Failed to fetch dynamically imported module');
      return importOriginal();
    });
    const { default: Lazy } = await import('./LazyCommandPalette');
    const { AuthProvider: Auth, CommandPaletteProvider: Provider, ThemeProvider: Theme } = await import('@contexts');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MemoryKitRouter>
        <Theme>
          <Auth>
            <Provider>
              <p>Page content</p>
              <Lazy />
            </Provider>
          </Auth>
        </Theme>
      </MemoryKitRouter>,
    );
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
    });
    await vi.waitFor(() => expect(errors).toHaveBeenCalled());
    expect(screen.getByText('Page content')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    // The failed open closed the palette; the next ⌘K tries a fresh import.
    fail = false;
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
    });
    expect(await screen.findByRole('dialog')).toBeTruthy();
    vi.doUnmock('./CommandPalette');
    errors.mockRestore();
  });
});
