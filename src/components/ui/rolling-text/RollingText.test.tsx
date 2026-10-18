// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { RollingText } from '@components/ui';

afterEach(cleanup);

const columns = () => Array.from(document.querySelectorAll<HTMLElement>('[data-slot="rolling-digit"]'));

describe('RollingText', () => {
  it('keeps the full text for assistive tech and hides the moving columns', () => {
    render(<RollingText text="$42.4K" />);
    expect(screen.getByText('$42.4K').className).toContain('sr-only');
    expect(document.querySelector('[data-slot="rolling-visual"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('rolls each digit to its value and leaves other characters static', () => {
    render(<RollingText text="1,240" />);
    expect(columns().map((column) => column.style.transform)).toEqual([
      'translateY(-1em)',
      'translateY(-2em)',
      'translateY(-4em)',
      'translateY(-0em)',
    ]);
    expect(document.querySelector('[data-slot="rolling-static"]')?.textContent).toBe(',');
  });

  it('keys digits from the right so the units column stays put when the length changes', () => {
    const { rerender } = render(<RollingText text="999" />);
    const units = columns().at(-1);
    rerender(<RollingText text="1000" />);
    expect(columns().at(-1)).toBe(units);
  });

  it('animates on the motion tokens, staggered from the right, and not under reduced motion', () => {
    render(<RollingText text="840" />);
    const [hundreds, tens, units] = columns();
    expect(units.className).toContain('duration-roll');
    expect(units.className).toContain('ease-spring');
    expect(units.className).toContain('motion-reduce:transition-none');
    expect([units.style.transitionDelay, tens.style.transitionDelay, hundreds.style.transitionDelay]).toEqual(['0ms', '40ms', '80ms']);
  });

  it('keeps a character outside the BMP (a surrogate pair) whole, in one static cell', () => {
    render(<RollingText text="𝑥12" />);
    const statics = [...document.querySelectorAll('[data-slot="rolling-static"]')].map((cell) => cell.textContent);
    expect(statics).toEqual(['𝑥']);
    expect(document.querySelectorAll('[data-slot="rolling-digit"]')).toHaveLength(2);
  });
});
