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
});
