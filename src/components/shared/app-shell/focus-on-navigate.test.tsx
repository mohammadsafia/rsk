// @vitest-environment happy-dom
// After a route change the focus moves to the new page's heading, so a keyboard or screen reader user starts on the
// page they asked for. Before, it stayed on the sidebar link (or fell to <body> when the link re-rendered).
import { lazy, type ReactElement, Suspense } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { AppShell, Sidebar } from '@components/shared';
import { Tooltip } from '@components/ui';
import { usePathname } from '@contexts';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import { Home, Users } from 'lucide-react';

import '../../../i18n';

afterEach(cleanup);

const Members = lazy(async () => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { default: () => <h1>Members</h1> };
});

const Page = (): ReactElement => {
  const pathname = usePathname();
  if (pathname === '/members') return <Members />;
  if (pathname === '/plain') return <p>No heading here</p>;
  return <h1>Home</h1>;
};

const renderShell = (focusOnNavigate?: boolean) =>
  render(
    <MemoryKitRouter>
      <Tooltip.Provider>
        <AppShell
          sidebar={
            <Sidebar>
              <Sidebar.Content>
                <Sidebar.Item href="/" icon={Home}>
                  Home
                </Sidebar.Item>
                <Sidebar.Item href="/members" icon={Users}>
                  Members
                </Sidebar.Item>
                <Sidebar.Item href="/plain" icon={Users}>
                  Plain
                </Sidebar.Item>
              </Sidebar.Content>
            </Sidebar>
          }
        >
          <AppShell.Content focusOnNavigate={focusOnNavigate}>
            <Suspense fallback={<p>Loading</p>}>
              <Page />
            </Suspense>
          </AppShell.Content>
        </AppShell>
      </Tooltip.Provider>
    </MemoryKitRouter>,
  );

const follow = (name: string) => {
  const link = screen.getByRole('link', { name });
  link.focus();
  fireEvent.click(link);
};

describe('AppShell.Content focus on navigation', () => {
  it('leaves the focus alone on the first page load', async () => {
    renderShell();
    await screen.findByRole('heading', { name: 'Home' });
    expect(document.activeElement).toBe(document.body);
  });

  it('moves the focus to the new page’s heading, also when the page loads lazily', async () => {
    renderShell();
    follow('Members');
    const heading = await screen.findByRole('heading', { name: 'Members' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('moves it to the main region when the page has no heading', async () => {
    renderShell();
    follow('Plain');
    await screen.findByText('No heading here');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')));
  });

  it('stays where it is with focusOnNavigate={false}', async () => {
    renderShell(false);
    follow('Plain');
    await screen.findByText('No heading here');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Plain' }));
  });
});
