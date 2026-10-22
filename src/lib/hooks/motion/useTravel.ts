'use client';

import { type RefObject, useLayoutEffect, useRef } from 'react';

import { MOTION_DISTANCES, MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import { useMotion } from '../../contexts/MotionContext';

/**
 * Slides new content in from the side it came from when `position` moves (a later date or step arrives from the end,
 * an earlier one from the start), and marks the element `data-direction="forward|back"`. Nothing moves on mount, or
 * when `group` changes (switching week → month is a different view, not travel). The content is never remounted, so
 * scroll position, focus and field state survive. The side follows the element's own computed direction, so an RTL
 * section mirrors even inside an LTR app.
 */
export function useTravel(scopeRef: RefObject<HTMLElement | null>, position: string | number, group?: string) {
  const { mode } = useMotion();
  const previous = useRef({ position, group });

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = { position, group };
    const element = scopeRef.current;
    if (!element || from.position === position) return;
    if (from.group !== group) {
      delete element.dataset.direction;
      return;
    }

    const travel = position > from.position ? 'forward' : 'back';
    element.dataset.direction = travel;
    if (mode === 'reduced' || typeof element.animate !== 'function') return;

    const rtl = getComputedStyle(element).direction === 'rtl';
    const offset = (travel === 'forward' ? 1 : -1) * (rtl ? -1 : 1) * MOTION_DISTANCES.slide;
    element.animate(
      [
        { opacity: 0, transform: `translateX(${offset}px)` },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: MOTION_DURATIONS.base,
        easing: MOTION_EASINGS.out,
      },
    );
  }, [scopeRef, position, group, mode]);
}
