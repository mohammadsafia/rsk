// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { AppShell, Sidebar } from '@components/shared';
import { Tooltip } from '@components/ui';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import { LayoutDashboard, Users } from 'lucide-react';

import '../../../i18n';

afterEach(cleanup);

const wrap = (ui: ReactNode) =>
  render(
    <MemoryKitRouter>
      <Tooltip.Provider>{ui}</Tooltip.Provider>
    </MemoryKitRouter>,
  );

const menu = (collapsed = false) => (
  <Sidebar collapsed={collapsed}>
    <Sidebar.Content>
      <Sidebar.Group label="Main">
        <Sidebar.Item href="/dashboard" icon={LayoutDashboard} active>
          Dashboard
        </Sidebar.Item>
        <Sidebar.Item href="/members" icon={Users} badge={12}>
          Members
        </Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar>
);

describe('Sidebar', () => {
  it('lets a long menu scroll (the viewport only scrolls while a vertical bar is mounted)', () => {
    const { container } = wrap(menu());
    const viewport = container.querySelector<HTMLElement>('[data-slot="sidebar"] [data-slot="scroll-area-viewport"]');

    expect(viewport?.style.overflowY).toBe('scroll');
  });

  it('marks the active item with aria-current and the Ledger ink, never a fill or a stripe', () => {
    wrap(menu());
    const active = screen.getByRole('link', { name: 'Dashboard' });
    expect(active.getAttribute('aria-current')).toBe('page');
    expect(active.className).not.toContain('aria-[current=page]:bg-');
    // The ink sits on the label (not the row), so it isn't clipped by truncate and doesn't spread to the count badge.
    expect(active.className).not.toMatch(/aria-\[current=page\]:ink(?!-)/);
    const label = active.querySelector<HTMLElement>('[data-slot="sidebar-item-label"]')!;
    expect(label.className).toContain('group-aria-[current=page]/sidebar-item:ink');
    expect(active.className).not.toMatch(/border-s-|border-l-|before:/);
    expect(screen.getByRole('link', { name: /Members/ }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeTruthy();
  });

  it('keeps collapsed items named, hides labels visually and adds tooltips', () => {
    wrap(menu(true));
    const members = screen.getByRole('link', { name: /Members/ });
    expect(members.getAttribute('data-slot')).toBe('sidebar-item');
    expect(members.getAttribute('data-state')).not.toBeNull(); // Radix tooltip trigger
    expect(members.querySelector('[data-slot="sidebar-item-label"]')?.className).toContain('md:sr-only');
    expect(screen.getByText('Main').className).toContain('md:sr-only');
  });

  it('gives a collapsed sub-menu a tooltip', () => {
    wrap(
      <Sidebar collapsed>
        <Sidebar.Content>
          <Sidebar.SubMenu icon={Users} label="Billing">
            <Sidebar.Item href="/invoices" icon={LayoutDashboard}>
              Invoices
            </Sidebar.Item>
          </Sidebar.SubMenu>
        </Sidebar.Content>
      </Sidebar>,
    );
    expect(screen.getByRole('button', { name: 'Billing' }).getAttribute('data-state')).not.toBeNull();
  });

  it('shows an open sub-menu in the mobile drawer even when the desktop sidebar is collapsed', () => {
    localStorage.setItem('rsk:sidebar-collapsed', 'true');
    wrap(
      <AppShell
        sidebar={
          <Sidebar>
            <Sidebar.Content>
              <Sidebar.SubMenu icon={Users} label="Billing" active>
                <Sidebar.Item href="/invoices" icon={LayoutDashboard}>
                  Invoices
                </Sidebar.Item>
              </Sidebar.SubMenu>
            </Sidebar.Content>
          </Sidebar>
        }
      >
        <AppShell.Header>
          <AppShell.MenuButton />
        </AppShell.Header>
      </AppShell>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Billing' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('link', { name: 'Invoices' })).toBeTruthy();
    localStorage.clear();
  });

  it('marks the current item without colour alone when collapsed: the ink bar sits under its icon', () => {
    wrap(menu(true));
    const active = document.querySelector<HTMLElement>('[data-slot="sidebar-item"][aria-current="page"]')!;
    expect(active.className).toContain('md:aria-[current=page]:ink-block');
  });
});
