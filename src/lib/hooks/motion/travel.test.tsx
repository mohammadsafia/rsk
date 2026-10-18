// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useTravel } from './useTravel';

function Body({ position, group }: { position: string | number; group?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTravel(ref, position, group);
  return <div ref={ref} data-testid="body" />;
}

const body = () => document.querySelector<HTMLElement>('[data-testid="body"]')!;

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve() }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
});
afterEach(cleanup);

describe('useTravel', () => {
  it('stays still on mount', () => {
    render(<Body position="2026-10-18" />);
    expect(body().hasAttribute('data-direction')).toBe(false);
    expect(animate).not.toHaveBeenCalled();
  });

  it('marks forward and back moves and slides the new content in from that side', () => {
    const { rerender } = render(<Body position="2026-10-18" />);
    rerender(<Body position="2026-10-25" />);
    expect(body().dataset.direction).toBe('forward');
    expect(animate.mock.calls[0][0][0]).toMatchObject({ opacity: 0, transform: 'translateX(16px)' });

    rerender(<Body position="2026-10-11" />);
    expect(body().dataset.direction).toBe('back');
    expect(animate.mock.calls[1][0][0]).toMatchObject({ transform: 'translateX(-16px)' });
  });

  it('mirrors the slide in a right-to-left context', () => {
    const { rerender } = render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Body position={1} />
      </div>,
    );
    rerender(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Body position={2} />
      </div>,
    );
    expect(animate.mock.calls[0][0][0]).toMatchObject({ transform: 'translateX(-16px)' });
  });

  it('does not travel when the group changes (a different view, not a different date)', () => {
    const { rerender } = render(<Body position="2026-10-12" group="week" />);
    rerender(<Body position="2026-10-01" group="month" />);
    expect(body().hasAttribute('data-direction')).toBe(false);
    expect(animate).not.toHaveBeenCalled();
  });

  it('only marks the direction under reduced motion', () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
    const { rerender } = render(<Body position={1} />);
    rerender(<Body position={2} />);
    expect(body().dataset.direction).toBe('forward');
    expect(animate).not.toHaveBeenCalled();
  });
});
