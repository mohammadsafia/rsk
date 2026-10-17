// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CheckboxGroup } from '@components/ui';

afterEach(cleanup);

describe('CheckboxGroup', () => {
  it('exposes its options as a named group', () => {
    render(
      <CheckboxGroup aria-label="Allergies">
        <CheckboxGroup.Item value="pollen">Pollen</CheckboxGroup.Item>
      </CheckboxGroup>,
    );
    expect(screen.getByRole('group', { name: 'Allergies' })).toBeTruthy();
  });

  it('is a plain inline choice: no field-like box, no accent tint, still a 28px target', () => {
    render(
      <CheckboxGroup aria-label="Allergies">
        <CheckboxGroup.Item defaultChecked aria-label="Penicillin" />
      </CheckboxGroup>,
    );
    const item = screen.getByRole('checkbox', { name: 'Penicillin' });
    expect(item.className).not.toMatch(/\bborder\b|\bp-3\b|\brounded-lg\b|\bbg-surface\b|accent/);
    expect(item.className).toContain('min-h-control-sm');
  });
});
