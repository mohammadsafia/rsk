// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { LazyCommandPalette } from '@components/shared';

import { CommandPaletteProvider, ThemeProvider } from '@contexts';

import '../../../i18n';

afterEach(cleanup);

const renderShell = () =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <CommandPaletteProvider>
          <LazyCommandPalette />
        </CommandPaletteProvider>
      </ThemeProvider>
    </MemoryRouter>,
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
});
