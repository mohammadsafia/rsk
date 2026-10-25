// @vitest-environment happy-dom
import type { ReactNode } from 'react';

import { dehydrate, HydrationBoundary, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import type { Session } from '@contexts';

import { getQueryClient } from '@api/config/getQueryClient';
import { membersApi } from '@api/handlers/members';
import { prefetchMembers } from '@server/members';

import { renderWithKitRouter } from '../../lib/contexts/testing';
import MembersPage from './MembersPage';

import '../../i18n';

const SESSION: Session = { token: 'demo-token', user: { userId: 'demo', name: 'Demo User', email: 'demo@example.com', picture: '' } };

beforeAll(() => {
  process.env.SESSION_SECRET = 'r'.repeat(40);
  process.env.AUTH_MOCK = 'true';
});
afterEach(() => {
  cleanup();
  getQueryClient().clear();
  vi.restoreAllMocks();
});

/** What the members page does: the server prefetches for the URL, then the browser renders from what it sent. */
async function serverRender(search: string) {
  const server = getQueryClient();
  const state = await prefetchMembers(server, SESSION, new URLSearchParams(search));
  const sent = JSON.parse(JSON.stringify(dehydrate(server)));
  server.clear();
  const list = vi.spyOn(membersApi, 'list');
  const wrap = (children: ReactNode) => (
    <NuqsTestingAdapter searchParams={search}>
      <QueryClientProvider client={getQueryClient()}>
        <HydrationBoundary state={sent}>
          <Tooltip.Provider>{children}</Tooltip.Provider>
        </HydrationBoundary>
      </QueryClientProvider>
    </NuqsTestingAdapter>
  );
  renderWithKitRouter(wrap(<MembersPage invite={vi.fn()} />));
  return { list, state };
}

describe('MembersPage', () => {
  it('shows the first page the server fetched, without asking the API again', async () => {
    const { list } = await serverRender('');
    expect(await screen.findByText('Dina Nasser')).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(list).not.toHaveBeenCalled();
  });

  it('shows the page and search in the URL from the server too (?page=2&globalFilter=a)', async () => {
    const { list, state } = await serverRender('?page=2&globalFilter=a');
    expect(state).toMatchObject({ page: 2, globalFilter: 'a', perPage: 10 });
    expect((await screen.findAllByRole('row')).length).toBeGreaterThan(1);
    expect(list).not.toHaveBeenCalled();
  });
});
