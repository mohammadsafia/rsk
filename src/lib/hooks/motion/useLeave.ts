import { type RefObject, useCallback, useRef } from 'react';

import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import { useMotion } from '../../contexts/MotionContext';

/** How long an exit plays: quick, accelerating away (spec: exits are shorter than entrances). */
export const LEAVE_TIMING: KeyframeAnimationOptions = {
  duration: MOTION_DURATIONS.fast,
  easing: MOTION_EASINGS.in,
  fill: 'forwards',
};

/**
 * Plays an exit, then runs the callback once. `play` starts the animations on the scope element (or its parts) and
 * returns them. Under reduced motion the callback runs at once; calls while already leaving are ignored. The callback
 * also runs on a timeout in case an animation never reports finishing, and the animations are cancelled afterwards so
 * an element that stays mounted (a pill turning inactive, a removal the parent declined) shows again.
 */
export function useLeave(scopeRef: RefObject<HTMLElement | null>, play: (element: HTMLElement) => Animation[]) {
  const { mode } = useMotion();
  const leaving = useRef(false);

  return useCallback(
    (done: () => void) => {
      const element = scopeRef.current;
      if (leaving.current) return;
      // No WAAPI (old engines, test DOMs): remove at once rather than not at all.
      if (mode === 'reduced' || !element || typeof element.animate !== 'function') {
        done();
        return;
      }

      leaving.current = true;
      element.dataset.leaving = '';
      const animations = play(element);

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        clearTimeout(fallback);
        leaving.current = false;
        delete element.dataset.leaving;
        done();
        animations.forEach((animation) => animation.cancel());
      };
      const fallback = setTimeout(settle, MOTION_DURATIONS.fast + 50);
      void Promise.all(animations.map((animation) => animation.finished)).then(settle, settle);
    },
    [scopeRef, mode, play],
  );
}
