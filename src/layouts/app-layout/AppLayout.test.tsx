// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { ThemeProvider } from '@contexts';
import { useAuth } from '@hooks/shared';
import { AppLayout } from '@layouts';

import '../../i18n';

afterEach(cleanup);

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/settings', element: <p>Settings page</p> },
          { path: '/dashboard', element: <p>Dashboard page</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  return render(
    <ThemeProvider>
      <Tooltip.Provider>
        <RouterProvider router={router} />
      </Tooltip.Provider>
    </ThemeProvider>,
  );
};

describe('AppLayout', () => {
  it('renders the page inside the shell and marks the current route', async () => {
    renderAt('/settings');
    expect(await screen.findByText('Settings page')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Settings' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('group', { name: 'Account' })).toBeTruthy();
    expect(screen.getByRole('main').textContent).toContain('Settings page');
  });

  it('puts search, theme, language and the user menu in the header', async () => {
    renderAt('/dashboard');
    await screen.findByText('Dashboard page');
    const header = document.querySelector('[data-slot="app-shell-header"]') as HTMLElement;
    expect(header.querySelector('[aria-label="Open command palette"]')).not.toBeNull();
    expect(header.querySelector('[aria-label="Open user menu"]')).not.toBeNull();
    expect(header.querySelector('[aria-label="Notifications"]')).not.toBeNull();
    expect(header.innerHTML).not.toMatch(/text-muted-foreground|bg-secondary|ring-primary|bg-background/);
    expect(document.querySelector('[data-slot="sidebar-footer"]')?.textContent).toContain(useAuth().currentUser.email);
  });
});
