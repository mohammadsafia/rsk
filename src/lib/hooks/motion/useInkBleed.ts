import { type PointerEvent, useCallback } from 'react';

import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import { useMotion } from '../../contexts/MotionContext';

/**
 * Ink bleed (spec §4, expressive only): a press spreads a line of ink along the element's bottom edge from the press
 * point, then it fades and is removed. Drawn in currentColor, so it shows on solid and quiet buttons alike; the offset
 * is in physical pixels, so it starts under the finger in RTL too. Keyboard presses fire no pointerdown, so they never
 * bleed. Returns an onPointerDown handler.
 */
export function useInkBleed<T extends HTMLElement>() {
  const { mode } = useMotion();

  return useCallback(
    (event: PointerEvent<T>) => {
      const host = event.currentTarget;
      if (mode !== 'expressive' || typeof host.animate !== 'function') return;

      const box = host.getBoundingClientRect();
      const line = document.createElement('span');
      line.dataset.slot = 'ink-bleed';
      line.setAttribute('aria-hidden', 'true');
      Object.assign(line.style, {
        position: 'absolute',
        insetInline: '0',
        bottom: '0',
        height: 'var(--ink-thickness)',
        background: 'currentColor',
        pointerEvents: 'none',
        transformOrigin: `${Math.round(event.clientX - box.left)}px 50%`,
      });
      host.append(line);

      const animation = line.animate(
        [
          { transform: 'scaleX(0)', opacity: 1 },
          { transform: 'scaleX(1)', opacity: 1, offset: 0.5 },
          { transform: 'scaleX(1)', opacity: 0 },
        ],
        { duration: MOTION_DURATIONS.springLong, easing: MOTION_EASINGS.out },
      );
      void animation.finished.then(
        () => line.remove(),
        () => line.remove(),
      );
    },
    [mode],
  );
}
