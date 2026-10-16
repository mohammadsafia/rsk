// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Sidebar } from '@components/shared';
import { Tooltip } from '@components/ui';

import { LayoutDashboard, Users } from 'lucide-react';

import '../../../i18n';

afterEach(cleanup);

const wrap = (ui: ReactNode) =>
  render(
    <MemoryRouter>
      <Tooltip.Provider>{ui}</Tooltip.Provider>
    </MemoryRouter>,
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
  it('marks the active item with aria-current and a hover tint, never a stripe', () => {
    wrap(menu());
    const active = screen.getByRole('link', { name: 'Dashboard' });
    expect(active.getAttribute('aria-current')).toBe('page');
    expect(active.className).toContain('aria-[current=page]:bg-hover');
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
});
