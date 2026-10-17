// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
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
