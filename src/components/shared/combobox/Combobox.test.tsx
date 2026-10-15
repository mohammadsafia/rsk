// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Combobox } from '@components/shared';

afterEach(cleanup);

describe('Combobox.Trigger', () => {
  it('uses the field shape at md and exposes invalid', () => {
    render(
      <Combobox>
        <Combobox.Trigger invalid>
          <Combobox.Value placeholder="Choose a doctor" />
        </Combobox.Trigger>
      </Combobox>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('h-control-md');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.className).not.toMatch(/bg-background|border-muted-200/);
  });
});
