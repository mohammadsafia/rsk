// @vitest-environment happy-dom
import type { ReactElement } from 'react';

import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { AuthProvider, SESSION_KEY, ThemeProvider } from '@contexts';

import { renderWithKitRouter } from '../../lib/contexts/testing';
import { AuthLayoutShell } from '../auth-layout/AuthLayoutShell';
import { AppLayoutShell } from './AppLayoutShell';

import '../../i18n';

const SESSION = { token: 't', user: { userId: '1', name: 'Lina Haddad', email: 'lina@example.com', picture: '' } };

const providers = (ui: ReactElement) => (
  <ThemeProvider>
    <AuthProvider>
      <Tooltip.Provider>{ui}</Tooltip.Provider>
    </AuthProvider>
  </ThemeProvider>
);

beforeEach(() => localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION)));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AppLayoutShell', () => {
  it('renders the page inside the shell, marks the current route and navigates through the kit router', () => {
    const { history } = renderWithKitRouter(
      providers(
        <AppLayoutShell>
          <p>Page</p>
        </AppLayoutShell>,
      ),
      { initialPath: '/dashboard' },
    );
    expect(screen.getByText('Page').closest('[data-slot="app-shell"]')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('link', { name: 'Settings' }));
    expect(history.at(-1)).toBe('/settings');
  });

  it('takes the collapsed state from the app when there is no storage', () => {
    renderWithKitRouter(
      providers(
        <AppLayoutShell shell={{ storageKey: null, initialCollapsed: true }}>
          <p>Page</p>
        </AppLayoutShell>,
      ),
    );
    expect(document.querySelector('[data-slot="app-shell-sidebar"]')?.getAttribute('data-collapsed')).toBe('true');
  });
});

describe('AuthLayoutShell', () => {
  it('sends a signed-in visitor on to where they were going', async () => {
    const { history } = renderWithKitRouter(
      providers(
        <AuthLayoutShell redirectTo="/settings">
          <p>Sign in</p>
        </AuthLayoutShell>,
      ),
      { initialPath: '/auth/login' },
    );
    await act(async () => {});
    expect(history.at(-1)).toBe('/settings');
  });
});
