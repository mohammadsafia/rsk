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
  it('marks the checked option with the fg dot, not an accent tint', () => {
    render(
      <RadioGroup defaultValue="m" aria-label="Sex">
        <RadioGroup.Item value="m">
          <RadioGroup.Indicator />
          Male
        </RadioGroup.Item>
        <RadioGroup.Item value="f">Female</RadioGroup.Item>
      </RadioGroup>,
    );
    const male = screen.getByRole('radio', { name: 'Male' });
    expect(male.getAttribute('aria-checked')).toBe('true');
    expect(male.className).not.toContain('accent');
    expect(male.querySelector<HTMLElement>('[data-slot="radio-group-indicator"]')!.className).toContain('data-[state=checked]:after:bg-fg');
  });

  it('is a plain inline choice: no field-like box, still a 28px target', () => {
    render(
      <RadioGroup defaultValue="m" aria-label="Sex">
        <RadioGroup.Item value="m">Male</RadioGroup.Item>
      </RadioGroup>,
    );
    const item = screen.getByRole('radio', { name: 'Male' });
    expect(item.className).not.toMatch(/\bborder\b|\bp-3\b|\brounded-lg\b|\bbg-surface\b/);
    expect(item.className).toContain('min-h-control-sm');
  });

  it('the dot grows in on the spring when chosen', () => {
    const { container } = render(<RadioGroup.Dot checked />);
    const className = container.querySelector('[data-slot="radio-group-dot"]')!.className;
    expect(className).toContain('after:scale-0');
    expect(className).toContain('data-[state=checked]:after:scale-100');
    expect(className).toContain('after:ease-spring');
  });
});
