'use client';

import { type RefObject, useCallback, useEffect, useRef } from 'react';

import { MOTION_DURATIONS } from '@constants';

import { useMotion } from '../../contexts/MotionContext';

import { LEAVE_TIMING } from './leaveTiming';

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** The first focusable thing in the siblings after the element, else before it (skipping siblings that are leaving too). */
function neighbourOf(element: HTMLElement): HTMLElement | null {
  const scan = (start: Element | null, step: 'nextElementSibling' | 'previousElementSibling') => {
    for (let node = start; node; node = node[step]) {
      if (node instanceof HTMLElement && 'leaving' in node.dataset) continue;
      if (node.matches(FOCUSABLE)) return node as HTMLElement;
      const inner = node.querySelector<HTMLElement>(FOCUSABLE);
      if (inner) return inner;
    }
    return null;
  };
  return scan(element.nextElementSibling, 'nextElementSibling') ?? scan(element.previousElementSibling, 'previousElementSibling');
}

/**
 * Plays an exit, then runs the callback once. `play` starts the animations on the scope element (or its parts) and
 * returns them. Under reduced motion the callback runs at once; calls while already leaving are ignored. The callback
 * also runs on a timeout in case an animation never reports finishing, and the animations are cancelled afterwards so
 * an element that stays mounted (a pill turning inactive, a removal the parent declined) shows again on the next frame.
 * When focus was inside the element and the removal takes it away, focus moves to the next (else previous) sibling
 * instead of falling to <body>. If the component unmounts mid-exit (its parent went away), the callback never runs.
 */
export function useLeave(scopeRef: RefObject<HTMLElement | null>, play: (element: HTMLElement) => Animation[]) {
  const { mode } = useMotion();
  const leaving = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return useCallback(
    (done: () => void) => {
      const element = scopeRef.current;
      if (leaving.current) return;
      /** Runs the callback; afterwards, focus that was inside a now-removed element goes to a neighbour. */
      const finish = () => {
        const neighbour = element?.contains(document.activeElement) ? neighbourOf(element) : null;
        done();
        if (!element || !neighbour) return;
        // React commits the removal in a later task, which may land after the next frame: look for a few frames.
        const check = (framesLeft: number) =>
          requestAnimationFrame(() => {
            if (element.isConnected) {
              if (framesLeft > 0) check(framesLeft - 1);
              return;
            }
            const dropped = !document.activeElement || document.activeElement === document.body;
            if (dropped && neighbour.isConnected) neighbour.focus();
          });
        check(3);
      };
      // No WAAPI (old engines, test DOMs): remove at once rather than not at all.
      if (mode === 'reduced' || !element || typeof element.animate !== 'function') {
        finish();
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
        if (!mounted.current) return;
        finish();
        // React commits the removal in a later task; cancelling now would paint the element at full size for a frame.
        // On the next frame, an element that is still here (a pill turning inactive, a declined removal) shows again.
        requestAnimationFrame(() => {
          if (element.isConnected) animations.forEach((animation) => animation.cancel());
        });
      };
      const fallback = setTimeout(settle, MOTION_DURATIONS.fast + 50);
      void Promise.all(animations.map((animation) => animation.finished)).then(settle, settle);
    },
    [scopeRef, mode, play],
  );
}
