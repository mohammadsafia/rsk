'use client';

import { type PointerEvent, useCallback } from 'react';

import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import { useMotion } from '../../contexts/MotionContext';

/** Spreads one line of ink along the host's bottom edge from `x` (a viewport coordinate), then removes it. */
function bleed(host: HTMLElement, x: number) {
  const box = host.getBoundingClientRect();
  // The line sits in a clip shaped like the host (border-radius: inherit), so it never pokes past rounded corners.
  const clip = document.createElement('span');
  clip.dataset.slot = 'ink-bleed-clip';
  clip.setAttribute('aria-hidden', 'true');
  Object.assign(clip.style, { position: 'absolute', inset: '0', borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none' });
  const line = document.createElement('span');
  line.dataset.slot = 'ink-bleed';
  line.setAttribute('aria-hidden', 'true');
  Object.assign(line.style, {
    position: 'absolute',
    insetInline: '0',
    bottom: '0',
    height: 'var(--ink-thickness)',
    background: 'currentColor',
    transformOrigin: `${Math.round(x - box.left)}px 50%`,
  });
  clip.append(line);
  host.append(clip);

  const animation = line.animate(
    [
      { transform: 'scaleX(0)', opacity: 1 },
      { transform: 'scaleX(1)', opacity: 1, offset: 0.5 },
      { transform: 'scaleX(1)', opacity: 0 },
    ],
    { duration: MOTION_DURATIONS.springLong, easing: MOTION_EASINGS.out },
  );
  void animation.finished.then(
    () => clip.remove(),
    () => clip.remove(),
  );
}

/**
 * Ink bleed (spec §4, expressive only): a press spreads a line of ink along the element's bottom edge from the press
 * point, then it fades and is removed. Drawn in currentColor, so it shows on solid and quiet buttons alike; the offset
 * is in physical pixels, so it starts under the finger in RTL too. Only a primary press bleeds (no right-click), and a
 * touch bleeds when it lifts as a tap, so a touch that becomes a scroll (pointercancel) leaves no ink. Keyboard presses
 * fire no pointerdown, so they never bleed. Returns an onPointerDown handler.
 */
export function useInkBleed<T extends HTMLElement>() {
  const { mode } = useMotion();

  return useCallback(
    (event: PointerEvent<T>) => {
      const host = event.currentTarget;
      if (mode !== 'expressive' || typeof host.animate !== 'function' || event.button !== 0) return;
      const x = event.clientX;
      if (event.pointerType !== 'touch') {
        bleed(host, x);
        return;
      }

      const settle = (tap: boolean) => {
        host.removeEventListener('pointerup', onUp);
        host.removeEventListener('pointercancel', onCancel);
        if (tap) bleed(host, x);
      };
      const onUp = () => settle(true);
      const onCancel = () => settle(false);
      host.addEventListener('pointerup', onUp);
      host.addEventListener('pointercancel', onCancel);
    },
    [mode],
  );
}
