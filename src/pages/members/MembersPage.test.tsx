// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import MembersPage from './MembersPage';

import '../../i18n';

afterEach(cleanup);

describe('MembersPage', () => {
  it('has a page header with its primary action and token-only cells', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Tooltip.Provider>
          <MemoryRouter>
            <MembersPage />
          </MemoryRouter>
        </Tooltip.Provider>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Members' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Member' })).toBeTruthy();
    const email = container.querySelector('td [data-slot="member-email"]') as HTMLElement;
    expect(email.getAttribute('dir')).toBe('ltr');
    expect(container.innerHTML).not.toMatch(/text-foreground|text-muted-foreground/);
  });
});
