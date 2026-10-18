// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DropdownMenu } from '@components/ui';

afterEach(cleanup);

const renderMenu = () =>
  render(
    <DropdownMenu defaultOpen>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>
          Edit
          <DropdownMenu.Shortcut>⌘E</DropdownMenu.Shortcut>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item tone="danger">Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>,
  );

describe('DropdownMenu', () => {
  it('exposes the item tone', () => {
    renderMenu();
    expect(screen.getByRole('menuitem', { name: 'Delete' }).dataset.tone).toBe('danger');
    expect(screen.getByRole('menuitem', { name: /Edit/ }).dataset.tone).toBe('neutral');
  });

  it('renders shortcuts in the mono face on the raised surface', () => {
    renderMenu();
    expect(screen.getByText('⌘E').className).toContain('font-mono');
    expect(screen.getByRole('menu').className).toContain('bg-surface-raised');
    expect(screen.getByRole('menu').className).toContain('origin-(--radix-dropdown-menu-content-transform-origin)');
    expect(screen.getByRole('menu').className).toContain('data-[state=closed]:duration-instant');
  });

  it('marks a checked item with ink and keeps aria-checked', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenu.Trigger>View</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.CheckboxItem checked>Show archived</DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show archived' });
    expect(item.getAttribute('aria-checked')).toBe('true');
    expect(item.className).toContain('data-[state=checked]:ink');
  });

  it('its items cascade in as the menu unfolds', () => {
    renderMenu();
    expect(document.querySelector('[data-slot="dropdown-content"]')?.className).toContain('cascade');
  });
});
