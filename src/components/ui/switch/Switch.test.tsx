// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Switch } from '@components/ui';

afterEach(cleanup);

describe('Switch', () => {
  it('is a switch that toggles aria-checked (Space activates it natively as a <button>)', () => {
    render(<Switch aria-label="SMS reminders" />);
    const control = screen.getByRole('switch', { name: 'SMS reminders' });
    expect(control.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
  });

  it.each(['sm', 'md'] as const)('the %s thumb travels toward the inline end in RTL', (size) => {
    render(<Switch aria-label={`switch-${size}`} size={size} />);
    const thumb = screen.getByRole('switch', { name: `switch-${size}` }).querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
    expect(thumb.className).toMatch(/rtl:data-\[state=checked\]:-translate-x-/);
    expect(thumb.className).toContain('rtl:-translate-x-0.5');
  });

  it('fills the checked track with fg and keeps the switch shape', () => {
    render(<Switch aria-label="SMS reminders" defaultChecked />);
    const control = screen.getByRole('switch', { name: 'SMS reminders' });
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.className).toContain('data-[state=checked]:bg-fg');
    expect(control.className).toContain('rounded-full');
    expect(control.querySelector('span')?.className).toContain('data-[state=checked]:bg-fg-inverse');
  });

  it('the thumb springs across and stretches toward its travel while pressed (mirrored in RTL)', () => {
    render(<Switch aria-label="Notify" />);
    const thumb = document.querySelector('[data-slot="switch-thumb"]')!.className;
    expect(thumb).toContain('duration-spring');
    expect(thumb).toContain('ease-spring');
    expect(thumb).toContain('group-active/switch:scale-x-125');
    expect(thumb).toContain('origin-left');
    expect(thumb).toContain('data-[state=checked]:origin-right');
    expect(thumb).toContain('rtl:origin-right');
    expect(thumb).toContain('motion-reduce:transition-none');
  });
});
