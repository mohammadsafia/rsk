// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { AppShell, Sidebar, useAppShell } from '@components/shared';
import { Tooltip } from '@components/ui';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import { Users } from 'lucide-react';

import '../../../i18n';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderShell = () =>
  render(
    <MemoryKitRouter>
      <Tooltip.Provider>
        <AppShell
          sidebar={
            <Sidebar>
              <Sidebar.Header>
                <Sidebar.CollapseButton />
              </Sidebar.Header>
              <Sidebar.Content>
                <Sidebar.Item href="/members" icon={Users}>
                  Members
                </Sidebar.Item>
              </Sidebar.Content>
            </Sidebar>
          }
        >
          <AppShell.Header>
            <AppShell.MenuButton />
          </AppShell.Header>
          <AppShell.Content>Page</AppShell.Content>
        </AppShell>
      </Tooltip.Provider>
    </MemoryKitRouter>,
  );

const aside = () => document.querySelector('[data-slot="app-shell-sidebar"]') as HTMLElement;
const menuButton = () => screen.getByRole('button', { name: /^(Open|Close) menu$/ });

describe('AppShell', () => {
  it('persists the collapsed sidebar across mounts', () => {
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(aside().getAttribute('data-collapsed')).toBe('true');
    expect(localStorage.getItem('rsk:sidebar-collapsed')).toBe('true');

    cleanup();
    renderShell();
    expect(aside().getAttribute('data-collapsed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeTruthy();
  });

  it('survives a storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(aside().getAttribute('data-collapsed')).toBe('true');
  });

  it('opens the mobile drawer and closes it on Escape, returning focus to the menu button', () => {
    renderShell();
    fireEvent.click(menuButton());
    expect(aside().getAttribute('data-open')).toBe('true');
    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    expect(menuButton().getAttribute('aria-controls')).toBe(aside().id);

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(aside().getAttribute('data-open')).toBe('false');
    expect(document.activeElement).toBe(menuButton());
  });

  it('closes the drawer on the scrim and when an item is chosen', () => {
    renderShell();
    fireEvent.click(menuButton());
    fireEvent.click(document.querySelector('[data-slot="app-shell-scrim"]') as HTMLElement);
    expect(aside().getAttribute('data-open')).toBe('false');

    fireEvent.click(menuButton());
    fireEvent.click(screen.getByRole('link', { name: 'Members' }));
    expect(aside().getAttribute('data-open')).toBe('false');
  });

  it('scopes the closed-drawer offset to mobile, so RTL desktop keeps the sidebar in place', () => {
    renderShell();
    const classes = aside().className.split(/\s+/);
    expect(classes).toContain('max-md:invisible');
    expect(classes.filter((name) => /translate-x-full|^invisible$/.test(name) && !name.startsWith('max-md:'))).toEqual([]);
  });

  it('makes the content behind the open drawer inert and names the drawer', () => {
    renderShell();
    const behind = document.querySelector('[data-slot="app-shell-main"]') as HTMLElement;
    expect(behind.hasAttribute('inert')).toBe(false);
    fireEvent.click(menuButton());
    expect(behind.hasAttribute('inert')).toBe(true);
    expect(aside().getAttribute('aria-label')).toBe('Navigation');
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(behind.hasAttribute('inert')).toBe(false);
  });

  it('keeps the scroll sentinel out of flow so full-height pages do not overflow', () => {
    renderShell();
    const sentinel = screen.getByRole('main').firstElementChild as HTMLElement;
    expect(sentinel.className).toMatch(/(^|\s)absolute(\s|$)/);
  });

  it('stops the sidebar width transition under reduced motion', () => {
    renderShell();
    expect(aside().className).toContain('md:motion-reduce:transition-none');
  });

  it('moves focus to the page after choosing a drawer item', () => {
    renderShell();
    fireEvent.click(menuButton());
    fireEvent.click(screen.getByRole('link', { name: 'Members' }));
    expect(document.activeElement).toBe(screen.getByRole('main'));
  });

  it('closes the drawer when the viewport widens to desktop', () => {
    const listeners: Array<(event: { matches: boolean }) => void> = [];
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => listeners.push(listener),
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    renderShell();
    fireEvent.click(menuButton());
    expect(aside().getAttribute('data-open')).toBe('true');
    act(() => listeners.forEach((listener) => listener({ matches: true })));
    expect(aside().getAttribute('data-open')).toBe('false');
  });

  it('offers a skip link to the main content', () => {
    renderShell();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip.getAttribute('href')).toBe(`#${screen.getByRole('main').id}`);
    // The kit's outline ring: a box-shadow ring would be wiped out by shadow-overlay, leaving the browser default.
    expect(skip.className).toContain('focus-ring');
    expect(skip.className).not.toContain('focus-visible:ring-2');
  });

  it('restores the collapsed sidebar on the first render after a reload, with no flash (Vite)', () => {
    localStorage.setItem('rsk:sidebar-collapsed', 'true');
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useAppShell().collapsed);
      return null;
    }
    render(
      <MemoryKitRouter>
        <AppShell sidebar={<span />}>
          <Probe />
        </AppShell>
      </MemoryKitRouter>,
    );
    expect(seen[0]).toBe(true);
    expect(seen.every(Boolean)).toBe(true);
  });

  it('on a server, takes the collapsed state from initialCollapsed, not storage', () => {
    localStorage.setItem('rsk:sidebar-collapsed', 'false');
    const html = renderToString(
      <MemoryKitRouter>
        <AppShell sidebar={<span />} initialCollapsed>
          <p>x</p>
        </AppShell>
      </MemoryKitRouter>,
    );
    expect(html).toMatch(/data-slot="app-shell-sidebar"[^>]*data-collapsed="true"|data-collapsed="true"[^>]*data-slot="app-shell-sidebar"/);
  });

  it('with no storage (a Next app), keeps the server’s collapsed state through hydration and reports a toggle', async () => {
    const seen: boolean[] = [];
    const changes: boolean[] = [];
    function Probe() {
      const { collapsed, toggleCollapsed } = useAppShell();
      seen.push(collapsed);
      return (
        <button type="button" onClick={toggleCollapsed}>
          toggle
        </button>
      );
    }
    const tree = (
      <MemoryKitRouter>
        <AppShell sidebar={<span />} storageKey={null} initialCollapsed onCollapsedChange={(value) => changes.push(value)}>
          <Probe />
        </AppShell>
      </MemoryKitRouter>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(tree);
    document.body.append(container);
    seen.length = 0;
    await act(async () => void hydrateRoot(container, tree));
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(Boolean)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(changes).toEqual([false]);
    container.remove();
  });
});
