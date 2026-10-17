// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import MembersPage from './MembersPage';

import '../../i18n';

afterEach(cleanup);

describe('MembersPage', () => {
  it('has a page header with its primary action and token-only cells', () => {
    const { container } = render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={new QueryClient()}>
          <Tooltip.Provider>
            <MemoryRouter>
              <MembersPage />
            </MemoryRouter>
          </Tooltip.Provider>
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Members' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Member' })).toBeTruthy();
    const email = container.querySelector('td [data-slot="member-email"]') as HTMLElement;
    expect(email.getAttribute('dir')).toBe('ltr');
    expect(container.innerHTML).not.toMatch(/text-foreground|text-muted-foreground/);
  });
});

describe('MembersPage filters', () => {
  it('offers every filter type and keeps them across a remount', async () => {
    sessionStorage.clear();
    const mount = () =>
      render(
        <NuqsTestingAdapter>
          <QueryClientProvider client={new QueryClient()}>
            <Tooltip.Provider>
              <MemoryRouter>
                <MembersPage />
              </MemoryRouter>
            </Tooltip.Provider>
          </QueryClientProvider>
        </NuqsTestingAdapter>,
      );

    mount();
    const labels = [...document.querySelectorAll('[data-slot="filter-pill"]')].map((node) => node.getAttribute('data-filter'));
    expect(labels).toEqual(expect.arrayContaining(['Name', 'Role', 'Status', 'Two-factor', 'Sessions', 'Joined', 'Shift start']));

    fireEvent.click(document.querySelector('[data-slot="filter-pill"][data-filter="Two-factor"] button') as HTMLElement);
    fireEvent.click(await screen.findByRole('option', { name: 'On' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    cleanup();

    mount();
    expect(document.querySelector('[data-slot="filter-pill"][data-filter="Two-factor"]')?.hasAttribute('data-active')).toBe(true);
  });
});
