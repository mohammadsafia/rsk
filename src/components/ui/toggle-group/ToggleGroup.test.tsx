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

  it('multiple: every pressed item carries its own ink; the travelling bar is only for single choice', () => {
    render(
      <ToggleGroup type="multiple" defaultValue={['bold', 'italic']} aria-label="Format">
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </ToggleGroup>,
    );
    for (const name of ['Bold', 'Italic']) expect(screen.getByRole('button', { name }).className).toContain('data-[state=on]:ink-block');
    expect(document.querySelector('[data-slot="ink-bar"]')).toBeNull();
  });

  it('single: one travelling bar, no per-item ink', () => {
    render(
      <ToggleGroup type="single" defaultValue="week" aria-label="Range">
        <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
        <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
      </ToggleGroup>,
    );
    expect(document.querySelector('[data-slot="ink-bar"]')).not.toBeNull();
    expect(screen.getByRole('radio', { name: 'Week' }).className).not.toContain('ink-block');
  });
});
