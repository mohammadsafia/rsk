// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Select } from '@components/ui';

afterEach(cleanup);

const renderSelect = (open: boolean) =>
  render(
    <Select defaultValue="haddad" defaultOpen={open}>
      <Select.Trigger aria-label="Doctor" size="sm" invalid>
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="aziz">
          <Select.Text>Dr. Aziz</Select.Text>
        </Select.Item>
        <Select.Item value="haddad">
          <Select.Text>Dr. Haddad</Select.Text>
        </Select.Item>
      </Select.Content>
    </Select>,
  );

describe('Select', () => {
  it('the trigger uses the field shape and reports invalid', () => {
    renderSelect(false);
    const trigger = screen.getByRole('combobox', { name: 'Doctor' });
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.className).toContain('h-control-sm');
  });

  it('the selected item is marked selected', () => {
    renderSelect(true);
    // Radix reserves aria-selected for the focused option; the chosen value is data-state="checked".
    expect(screen.getByRole('option', { name: 'Dr. Haddad' }).dataset.state).toBe('checked');
    const chosen = screen.getByRole('option', { name: 'Dr. Haddad' });
    expect(chosen.className).toContain('data-[state=checked]:ink');
    expect(screen.getByRole('listbox').className).toContain('origin-(--radix-select-content-transform-origin)');
  });

  it('its options cascade in from above, so the rise never counts as overflow (no stray scroll-down arrow)', () => {
    renderSelect(true);
    const className = document.querySelector('[data-slot="select-viewport"]')?.className ?? '';
    expect(className).toContain('cascade');
    expect(className).toContain('[--cascade-rise:-4px]');
  });
});
