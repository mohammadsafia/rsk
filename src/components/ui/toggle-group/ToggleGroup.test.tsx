// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ToggleGroup } from '@components/ui';

afterEach(cleanup);

describe('ToggleGroup', () => {
  it('defaults to outline items at control height and marks the active item', () => {
    render(
      <ToggleGroup type="single" defaultValue="week" aria-label="Range">
        <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
        <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
      </ToggleGroup>,
    );
    const week = screen.getByRole('radio', { name: 'Week' });
    expect(week.dataset.state).toBe('on');
    expect(week.className).toContain('border-border-strong');
    expect(week.className).toContain('h-control-md');
  });
});
