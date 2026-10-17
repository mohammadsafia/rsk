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
});
