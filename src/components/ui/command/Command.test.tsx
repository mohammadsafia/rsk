// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Command } from '@components/ui';

afterEach(cleanup);

describe('Command', () => {
  it('is a raised surface with mono shortcut hints', () => {
    const { container } = render(
      <Command>
        <Command.List>
          <Command.Item>
            Duplicate <Command.Shortcut>⌘D</Command.Shortcut>
          </Command.Item>
        </Command.List>
      </Command>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain('bg-surface-raised');
    expect(screen.getByText('⌘D').className).toContain('font-mono');
  });

  it('lets an item grow for two-line content while keeping the control height as a minimum', () => {
    render(
      <Command>
        <Command.List>
          <Command.Item value="lina">
            <span>Dr. Lina Khoury</span>
            <span>Cardiology</span>
          </Command.Item>
        </Command.List>
      </Command>,
    );
    const item = document.querySelector('[data-slot="command-item"]') as HTMLElement;
    expect(item.className).toContain('min-h-control-sm');
    expect(item.className).not.toMatch(/(^|\s)h-control-sm(\s|$)/);
    expect(item.className).toContain('py-1.5');
  });

  it('marks the checked item with ink, not weight', () => {
    render(
      <Command>
        <Command.List>
          <Command.Item data-checked="true">Dr. Haddad</Command.Item>
        </Command.List>
      </Command>,
    );
    const item = screen.getByText('Dr. Haddad').closest('[cmdk-item]') as HTMLElement;
    expect(item.className).toContain('data-[checked=true]:ink');
    expect(item.className).not.toContain('data-[checked=true]:font-medium');
  });

  it('an empty list is not announced as a listbox (a listbox must hold options)', () => {
    render(
      <Command>
        <Command.List>
          <Command.Empty when>No results</Command.Empty>
        </Command.List>
      </Command>,
    );
    const list = document.querySelector('[data-slot="command-list"]')!;
    expect(list.getAttribute('role')).not.toBe('listbox');
  });

  it('a list with items stays a listbox', () => {
    render(
      <Command>
        <Command.List>
          <Command.Item>Duplicate</Command.Item>
        </Command.List>
      </Command>,
    );
    expect(document.querySelector('[data-slot="command-list"]')?.getAttribute('role')).toBe('listbox');
  });

  it('its separator is decorative: a listbox may only hold options and groups', () => {
    render(
      <Command>
        <Command.List>
          <Command.Group heading="Create">
            <Command.Item>New patient</Command.Item>
          </Command.Group>
          <Command.Separator />
          <Command.Group heading="Go to">
            <Command.Item>Reports</Command.Item>
          </Command.Group>
        </Command.List>
      </Command>,
    );
    const list = document.querySelector('[data-slot="command-list"]')!;
    expect(list.querySelector('[role="separator"]')).toBeNull();
    expect(document.querySelector('[data-slot="command-separator"]')?.getAttribute('role')).toBe('none');
  });
});
