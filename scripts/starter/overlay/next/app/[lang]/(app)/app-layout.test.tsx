// @vitest-environment happy-dom
import { act, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { type Session, useAuth } from '@contexts';

import { createMemoryKitRouter } from '../../../src/lib/contexts/testing';
import { KitRouterProvider } from '@contexts';
import { AppLayout } from './app-layout';

import '../../../src/i18n';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

const SESSION: Session = { token: '', user: { userId: 'demo', name: 'Demo User', email: 'demo@example.com', picture: '' } };

const tree = (ui: ReactElement, client = new QueryClient()) => (
  <QueryClientProvider client={client}>
    <KitRouterProvider router={createMemoryKitRouter({ initialPath: '/dashboard' })}>
      <Tooltip.Provider>{ui}</Tooltip.Provider>
    </KitRouterProvider>
  </QueryClientProvider>
);

afterEach(() => {
  document.body.innerHTML = '';
  document.cookie = 'rsk-sidebar=; max-age=0; path=/';
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const collapsed = () => document.querySelector('[data-slot="app-shell-sidebar"]')?.getAttribute('data-collapsed');

describe('the signed-in app layout', () => {
  it('renders the sidebar collapsed from the cookie on the server and keeps it through hydration', async () => {
    const page = tree(
      <AppLayout session={SESSION} sidebarCollapsed>
        <p>Dashboard</p>
      </AppLayout>,
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(page);
    expect(container.querySelector('[data-slot="app-shell-sidebar"]')?.getAttribute('data-collapsed')).toBe('true');
    document.body.append(container);
    await act(async () => void hydrateRoot(container, page));
    expect(collapsed()).toBe('true');
    fireEvent.click(screen.getAllByRole('button', { name: /expand|collapse/i })[0]);
    expect(document.cookie).toContain('rsk-sidebar=0');
  });

  it('signs out at the server, clears the cached data and refreshes into sign-in', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const client = new QueryClient();
    client.setQueryData(['patients'], [{ id: 1 }]);
    function SignOut() {
      return (
        <button type="button" onClick={useAuth().signOut}>
          sign out
        </button>
      );
    }
    render(
      tree(
        <AppLayout session={SESSION} sidebarCollapsed={false}>
          <SignOut />
        </AppLayout>,
        client,
      ),
    );
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'sign out' })));
    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
    expect(client.getQueryCache().getAll()).toEqual([]);
    expect(refresh).toHaveBeenCalled();
  });
});
