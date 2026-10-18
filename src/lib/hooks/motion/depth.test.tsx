// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { usePageDepth } from './usePageDepth';

function Surface({ open }: { open: boolean }) {
  usePageDepth(open);
  return null;
}

const marked = () => document.documentElement.hasAttribute('data-overlay-depth');

afterEach(cleanup);

describe('usePageDepth', () => {
  it('marks the page while any modal surface is open, once, until the last one closes', () => {
    const { rerender } = render(
      <>
        <Surface open />
        <Surface open />
      </>,
    );
    expect(marked()).toBe(true);
    rerender(
      <>
        <Surface open />
        <Surface open={false} />
      </>,
    );
    expect(marked()).toBe(true);
    rerender(
      <>
        <Surface open={false} />
        <Surface open={false} />
      </>,
    );
    expect(marked()).toBe(false);
  });

  it('never marks the page for a closed surface', () => {
    render(<Surface open={false} />);
    expect(marked()).toBe(false);
  });

  it('clears the mark when an open surface unmounts', () => {
    const { unmount } = render(<Surface open />);
    unmount();
    expect(marked()).toBe(false);
  });
});
