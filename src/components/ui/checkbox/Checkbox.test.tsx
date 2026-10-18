// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Checkbox } from '@components/ui';

afterEach(cleanup);

describe('Checkbox', () => {
  it('indeterminate is announced as mixed', () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" />);
    expect(screen.getByRole('checkbox', { name: 'Select all' }).getAttribute('aria-checked')).toBe('mixed');
  });

  it('checked state fills with fg (Ledger: no accent fill)', () => {
    render(<Checkbox aria-label="Agree" defaultChecked />);
    const box = screen.getByRole('checkbox', { name: 'Agree' });
    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(box.className).toContain('data-[state=checked]:bg-fg');
    expect(box.className).toContain('text-fg-inverse');
    expect(box.className).not.toContain('bg-accent');
  });

  it('feels tactile: squashes while pressed, and the check draws itself when it appears', () => {
    render(<Checkbox aria-label="Agree" defaultChecked />);
    const box = screen.getByRole('checkbox', { name: 'Agree' });
    expect(box.className).toContain('tactile');
    expect(box.querySelector('[data-slot="checkbox-indicator"]')?.className).toContain('draw-check');
  });
});
