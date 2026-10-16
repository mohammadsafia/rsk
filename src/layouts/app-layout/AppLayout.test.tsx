// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { ThemeProvider } from '@contexts';
import { AppLayout } from '@layouts';

import '../../i18n';

afterEach(cleanup);

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/members', element: <p>Members page</p> },
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
    renderAt('/members');
    expect(await screen.findByText('Members page')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Members' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('group', { name: 'Account' })).toBeTruthy();
    expect(screen.getByRole('main').textContent).toContain('Members page');
  });

  it('puts search, theme, language and the user menu in the header', async () => {
    renderAt('/dashboard');
    await screen.findByText('Dashboard page');
    const header = document.querySelector('[data-slot="app-shell-header"]') as HTMLElement;
    expect(header.querySelector('[aria-label="Open command palette"]')).not.toBeNull();
    expect(header.querySelector('[aria-label="Open user menu"]')).not.toBeNull();
    expect(header.querySelector('[aria-label="Notifications"]')).not.toBeNull();
    expect(header.innerHTML).not.toMatch(/text-muted-foreground|bg-secondary|ring-primary|bg-background/);
    expect(document.querySelector('[data-slot="sidebar-footer"]')?.textContent).toContain('Mohammad Safia');
  });
});
