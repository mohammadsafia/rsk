'use client';

import { type RefCallback, useCallback, useEffect, useRef } from 'react';

import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import { type MotionMode, useMotion } from '../../contexts/MotionContext';

/** The smallest the content starts at, so a tiny trigger still reads as a flight rather than a pop from a dot. */
const MIN_SCALE = 0.2;

/** A press counts as opening the overlay only for a moment; after that, an overlay is "opened from code". */
const PRESS_WINDOW_MS = 300;

/** The element the person last activated (pointer press, or Enter/Space), and when. Shortcuts like Ctrl+K don't count. */
let lastPress: { target: HTMLElement; at: number } | null = null;
const recordPress = (event: Event) => {
  if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
  if (event.target instanceof HTMLElement) lastPress = { target: event.target, at: performance.now() };
};

// Listen from load, not from a mounted hook: an overlay rendered only after the click ({open && <Dialog/>}) must still
// know what was pressed.
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', recordPress, true);
  document.addEventListener('keydown', recordPress, true);
}

/**
 * The control that opened `content`: the one that names it in aria-controls (Radix triggers), else the element the
 * person pressed a moment ago. Never just whatever has focus — an overlay opened from code (a timer, a shortcut) has no
 * trigger, and rises in place.
 */
const triggerOf = (content: HTMLElement) => {
  const named = content.id ? document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(content.id)}"]`) : null;
  if (named) return named;
  const pressed = lastPress && performance.now() - lastPress.at < PRESS_WINDOW_MS ? lastPress.target : null;
  return pressed?.closest<HTMLElement>('button, a, [role="button"], [role="menuitem"]') ?? pressed;
};

const fly = (content: HTMLElement, mode: MotionMode) => {
  if (mode !== 'expressive' || typeof content.animate !== 'function') return;
  const trigger = triggerOf(content);
  if (!trigger?.isConnected || content.contains(trigger)) return;

  const from = trigger.getBoundingClientRect();
  const to = content.getBoundingClientRect();
  if (!from.width || !from.height || !to.width || !to.height) return;

  const dx = Math.round(from.left + from.width / 2 - (to.left + to.width / 2));
  const dy = Math.round(from.top + from.height / 2 - (to.top + to.height / 2));
  const scale = Math.min(1, Math.max(MIN_SCALE, Math.round((from.width / to.width) * 100) / 100));
  content.dataset.flight = '';
  content.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
    { duration: MOTION_DURATIONS.spring, easing: MOTION_EASINGS.spring },
  );
};

/**
 * Flies an overlay out of the control that opened it (spec §4, expressive dialogs). Returns a ref callback: when a new
 * content node mounts — layout is done and focus has not moved in yet — it animates from the trigger's centre and size
 * to rest on the spring, and marks the node `data-flight` so its CSS rise steps aside. Calm, reduced, no WAAPI, or no
 * usable trigger (opened from code, trigger gone or hidden): nothing happens and the CSS rise plays.
 */
export function useFlight<T extends HTMLElement>(): RefCallback<T> {
  const { mode } = useMotion();
  const modeRef = useRef(mode);
  const flown = useRef<T | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  return useCallback((node: T | null) => {
    // Merged refs re-attach on every render; only a newly mounted node flies.
    if (!node || node === flown.current) return;
    flown.current = node;
    fly(node, modeRef.current);
  }, []);
}
