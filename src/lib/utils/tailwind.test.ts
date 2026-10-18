// src/lib/utils/tailwind.test.ts
import { describe, expect, it } from 'vite-plus/test';

import { cn } from './tailwind';

describe('cn merges the kit scales', () => {
  it('a later duration or easing token replaces an earlier one, including the kit names', () => {
    expect(cn('duration-base', 'duration-spring')).toBe('duration-spring');
    expect(cn('duration-spring', 'duration-fast')).toBe('duration-fast');
    expect(cn('ease-out', 'ease-spring')).toBe('ease-spring');
  });

  it('CSS-variable sizes and origins replace their earlier values (Tailwind v4 syntax)', () => {
    expect(cn('h-px', 'h-(--rule-width-section)')).toBe('h-(--rule-width-section)');
    expect(cn('origin-center', 'origin-(--radix-popover-content-transform-origin)')).toBe(
      'origin-(--radix-popover-content-transform-origin)',
    );
  });

  it('leaves the kit utilities it does not know untouched', () => {
    expect(cn('rule-top', 'ink', 'figure', 'cascade')).toBe('rule-top ink figure cascade');
  });
});
