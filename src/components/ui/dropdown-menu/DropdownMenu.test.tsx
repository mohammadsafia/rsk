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
  });
});
