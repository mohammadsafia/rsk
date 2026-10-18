// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Skeleton } from '@components/ui';

afterEach(cleanup);

describe('Skeleton', () => {
  it('is hidden from assistive technology and defaults to a medium line', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstElementChild as HTMLElement;
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect([skeleton.dataset.shape, skeleton.dataset.size]).toEqual(['line', 'md']);
  });

  it('circle and block shapes size themselves', () => {
    const { container } = render(
      <>
        <Skeleton shape="circle" size="lg" />
        <Skeleton shape="block" size="sm" />
      </>,
    );
    const [circle, block] = Array.from(container.children) as HTMLElement[];
    expect(circle.className).toContain('size-10');
    expect(block.className).toContain('h-16');
  });

  it('shimmers with a faint ink sweep instead of pulsing', () => {
    const { container } = render(<Skeleton />);
    const className = (container.firstElementChild as HTMLElement).className;
    expect(className).toContain('shimmer');
    expect(className).not.toContain('animate-pulse');
  });
});
