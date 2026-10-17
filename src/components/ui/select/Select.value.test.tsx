// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Select } from '@components/ui';

afterEach(cleanup);

describe('Select with plain-text items', () => {
  it('shows the selected label in the trigger', () => {
    render(
      <Select defaultValue="apple">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="orange">Orange</Select.Item>
        </Select.Content>
      </Select>,
    );
    expect(screen.getByRole('combobox').textContent).toContain('Apple');
  });

  it('still accepts composed items with Select.Text', () => {
    render(
      <Select defaultValue="30">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="30">
            <Select.Text>30</Select.Text>
          </Select.Item>
        </Select.Content>
      </Select>,
    );
    expect(screen.getByRole('combobox').textContent).toContain('30');
  });
});
