'use client';

import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

import { MOTION_EASINGS } from '@constants';
import { useMotion } from '../../contexts/MotionContext';

import { type InkGeometry, planInkMove, sampleInkMove } from './inkPlan';

const CURVES = { out: MOTION_EASINGS.out, spring: MOTION_EASINGS.spring } as const;

/**
 * Tracks the element matching `selector` inside the bar's strip (the closest `[data-ink-scope]`, else the parent) and
 * moves the ink to it (spec §4: elastic ink), writing the bar's left, width and opacity. The strip must be positioned. Re-measures when selection attributes change or the strip resizes.
 */
const SELECTION_ATTRIBUTES = ['data-state', 'aria-current', 'aria-selected', 'aria-checked'];

export function useInkBar(barRef: RefObject<HTMLElement | null>, selector: string) {
  const { mode } = useMotion();
  const modeRef = useRef(mode);
  const last = useRef<InkGeometry | null>(null);
  const running = useRef<Animation | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const container = bar?.closest<HTMLElement>('[data-ink-scope]') ?? bar?.parentElement;
    if (!bar || !container) return;

    /** `instant`: a layout shift (fonts, a label in another language, direction, an item appearing) moves the ink at
     * once; only a change of selection travels. */
    const measure = (instant = false) => {
      const active = container.querySelector<HTMLElement>(selector);
      if (!active) {
        bar.style.opacity = '0';
        last.current = null;
        return;
      }
      const geometry = { left: active.offsetLeft, width: active.offsetWidth };
      const previous = last.current;
      if (previous && previous.left === geometry.left && previous.width === geometry.width) return;
      const move = planInkMove(instant ? null : previous, geometry, modeRef.current);
      // Where the bar is now: mid-flight, the running animation's position, so an interrupted move doesn't jump back.
      const style = getComputedStyle(bar);
      const startLeft = Number.parseFloat(style.left) || 0;
      const start = { left: startLeft, right: startLeft + (Number.parseFloat(style.width) || 0) };
      running.current?.cancel();
      running.current = null;
      // The resting place is written first; the animation plays over it and ends where the style already is.
      bar.style.left = `${move.left.to}px`;
      bar.style.width = `${Math.max(0, move.right.to - move.left.to)}px`;
      bar.style.opacity = '1';
      const { duration, frames } = sampleInkMove(start, move, CURVES);
      if (duration > 0 && typeof bar.animate === 'function') running.current = bar.animate(frames, { duration, easing: 'linear' });
      last.current = geometry;
    };
    const relayout = () => measure(true);

    measure();
    const mutations = new MutationObserver((records) => {
      const selectionChanged = records.some(
        (record) => record.type === 'attributes' && SELECTION_ATTRIBUTES.includes(record.attributeName ?? ''),
      );
      measure(!selectionChanged);
      watchItems();
    });
    mutations.observe(container, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...SELECTION_ATTRIBUTES, 'dir'],
    });
    // The page direction lives on <html>, outside the strip.
    const page = new MutationObserver(relayout);
    page.observe(document.documentElement, { attributes: true, attributeFilter: ['dir', 'lang'] });

    // The strip keeps its width when an item grows (a block-level flex list), so watch the items themselves too.
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(relayout);
    const watchItems = () => {
      for (const item of Array.from(container.children)) if (item !== bar) resize?.observe(item);
    };
    resize?.observe(container);
    watchItems();
    let alive = true;
    void document.fonts?.ready.then(() => alive && relayout());

    return () => {
      alive = false;
      running.current?.cancel();
      mutations.disconnect();
      page.disconnect();
      resize?.disconnect();
    };
  }, [barRef, selector]);
}
