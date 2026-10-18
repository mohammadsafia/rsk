// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MotionProvider } from '../../contexts/MotionContext';
import { useInkBleed } from './useInkBleed';

function Pressable() {
  const onPointerDown = useInkBleed();
  return (
    <button type="button" onPointerDown={onPointerDown}>
      Save
    </button>
  );
}

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve(), onfinish: null }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 0,
    width: 100,
    height: 32,
    right: 200,
    bottom: 32,
    x: 100,
    y: 0,
    toJSON() {},
  } as DOMRect);
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useInkBleed', () => {
  it('spreads a line of ink from the press point along the bottom edge, then removes it', async () => {
    render(<Pressable />);
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.pointerDown(button, { clientX: 130 });
    const line = button.querySelector<HTMLElement>('[data-slot="ink-bleed"]')!;
    expect(line).not.toBeNull();
    expect(line.getAttribute('aria-hidden')).toBe('true');
    expect(line.style.transformOrigin).toBe('30px 50%');
    const [frames, options] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    expect(frames[0]).toMatchObject({ transform: 'scaleX(0)', opacity: 1 });
    expect(frames.at(-1)).toMatchObject({ opacity: 0 });
    expect(options.duration).toBe(420);
    await vi.waitFor(() => expect(button.querySelector('[data-slot="ink-bleed"]')).toBeNull());
  });

  it('does not bleed in calm mode or under reduced motion', () => {
    render(
      <MotionProvider mode="calm">
        <Pressable />
      </MotionProvider>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Save' }), { clientX: 130 });
    expect(animate).not.toHaveBeenCalled();
    cleanup();
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
    render(<Pressable />);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Save' }), { clientX: 130 });
    expect(animate).not.toHaveBeenCalled();
  });
});
