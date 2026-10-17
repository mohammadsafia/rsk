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

  it('checked state uses the accent', () => {
    render(<Checkbox aria-label="Agree" defaultChecked />);
    expect(screen.getByRole('checkbox', { name: 'Agree' }).className).toContain('data-[state=checked]:bg-accent');
  });
});
