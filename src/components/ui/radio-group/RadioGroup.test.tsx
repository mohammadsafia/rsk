// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { RadioGroup } from '@components/ui';

afterEach(cleanup);

describe('RadioGroup.Dot', () => {
  it('is a decorative indicator reflecting its state', () => {
    const { container } = render(
      <>
        <RadioGroup.Dot checked />
        <RadioGroup.Dot />
      </>,
    );
    const [on, off] = Array.from(container.children) as HTMLElement[];
    expect(on.getAttribute('aria-hidden')).toBe('true');
    expect([on.dataset.state, off.dataset.state]).toEqual(['checked', 'unchecked']);
  });
});

describe('RadioGroup.Item', () => {
  it('marks the checked option in fg, not an accent tint', () => {
    render(
      <RadioGroup defaultValue="m" aria-label="Sex">
        <RadioGroup.Item value="m">Male</RadioGroup.Item>
        <RadioGroup.Item value="f">Female</RadioGroup.Item>
      </RadioGroup>,
    );
    const male = screen.getByRole('radio', { name: 'Male' });
    expect(male.getAttribute('aria-checked')).toBe('true');
    expect(male.className).toContain('data-[state=checked]:border-fg');
    expect(male.className).not.toContain('bg-accent-subtle');
  });
});
