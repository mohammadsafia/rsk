// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MotionProvider } from '../../contexts/MotionContext';
import { useFlight } from './useFlight';

/** Like Radix Dialog.Content: the component is mounted while closed and its node appears when it opens. */
function Lazy({ open }: { open: boolean }) {
  const ref = useFlight<HTMLDivElement>();
  return open ? <div ref={ref} id="dlg" data-rect="400,300,400,200" /> : null;
}

function Content() {
  const ref = useFlight<HTMLDivElement>();
  return <div ref={ref} data-testid="content" data-rect="400,300,400,200" />;
}

const rect = (element: Element) => {
  const [x, y, width, height] = ((element as HTMLElement).dataset.rect ?? '0,0,0,0').split(',').map(Number);
  return { x, y, left: x, top: y, width, height, right: x + width, bottom: y + height, toJSON() {} } as DOMRect;
};

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve() }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return rect(this);
  });
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
  document.body.innerHTML = '';
});

const focusTrigger = () => {
  const trigger = document.createElement('button');
  trigger.dataset.rect = '100,100,40,20';
  document.body.append(trigger);
  trigger.focus();
  return trigger;
};

describe('useFlight', () => {
  it('flies the content out of the focused trigger: from its centre, scaled down, to rest on the spring', () => {
    focusTrigger();
    render(<Content />);
    expect(animate).toHaveBeenCalledTimes(1);
    const [[from, to], options] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    // trigger centre (120,110) − content centre (600,400)
    expect(from.transform).toBe('translate(-480px, -290px) scale(0.2)');
    expect(to.transform).toBe('none');
    expect(options.duration).toBe(380);
    expect(document.querySelector<HTMLElement>('[data-testid="content"]')!.hasAttribute('data-flight')).toBe(true);
  });

  it('flies when the content node appears after mount, once, from the trigger that names it in aria-controls', () => {
    const trigger = document.createElement('button');
    trigger.dataset.rect = '100,100,40,20';
    trigger.setAttribute('aria-controls', 'dlg');
    document.body.append(trigger);
    const { rerender } = render(<Lazy open={false} />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<Lazy open />);
    rerender(<Lazy open />);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('opened from code (nothing focused): no flight, the calm rise stays', () => {
    render(<Content />);
    expect(animate).not.toHaveBeenCalled();
    expect(document.querySelector('[data-flight]')).toBeNull();
  });

  it('no flight in calm mode or under reduced motion', () => {
    focusTrigger();
    render(
      <MotionProvider mode="calm">
        <Content />
      </MotionProvider>,
    );
    expect(animate).not.toHaveBeenCalled();
    cleanup();
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
    focusTrigger();
    render(<Content />);
    expect(animate).not.toHaveBeenCalled();
  });
});
