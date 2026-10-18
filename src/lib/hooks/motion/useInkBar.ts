import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { animate, type MotionValue, useMotionValue, useTransform } from 'framer-motion';

import { MOTION_EASINGS } from '@constants';
import { useMotion } from '../../contexts/MotionContext';

import { type InkEdge, type InkGeometry, planInkMove } from './inkPlan';

const CURVES = {
  out: MOTION_EASINGS.out,
  spring: MOTION_EASINGS.spring,
} as const;

/** "cubic-bezier(a, b, c, d)" → [a, b, c, d] for framer-motion. */
const bezier = (curve: string) => curve.match(/[\d.]+/g)!.map(Number) as [number, number, number, number];

const run = (value: MotionValue<number>, edge: InkEdge) => {
  if (edge.duration === 0 || edge.ease === 'none') {
    value.jump(edge.to);
    return;
  }
  animate(value, edge.to, { duration: edge.duration / 1000, delay: edge.delay / 1000, ease: bezier(CURVES[edge.ease]) });
};

/**
 * Tracks the element matching `selector` inside the bar's strip (the closest `[data-ink-scope]`, else the parent) and
 * moves the ink to it (spec §4: elastic ink). The strip must be positioned. Re-measures when selection attributes change or the strip resizes.
 */
const SELECTION_ATTRIBUTES = ['data-state', 'aria-current', 'aria-selected', 'aria-checked'];

export function useInkBar(barRef: RefObject<HTMLElement | null>, selector: string) {
  const { mode } = useMotion();
  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const opacity = useMotionValue(0);
  const width = useTransform(() => Math.max(0, right.get() - left.get()));
  const modeRef = useRef(mode);
  const last = useRef<InkGeometry | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const container = bar?.closest<HTMLElement>('[data-ink-scope]') ?? bar?.parentElement;
    if (!container) return;

    /** `instant`: a layout shift (fonts, a label in another language, direction, an item appearing) moves the ink at
     * once; only a change of selection travels. */
    const measure = (instant = false) => {
      const active = container.querySelector<HTMLElement>(selector);
      if (!active) {
        opacity.jump(0);
        last.current = null;
        return;
      }
      const geometry = { left: active.offsetLeft, width: active.offsetWidth };
      const previous = last.current;
      if (previous && previous.left === geometry.left && previous.width === geometry.width) return;
      const move = planInkMove(instant ? null : previous, geometry, modeRef.current);
      run(left, move.left);
      run(right, move.right);
      opacity.jump(1);
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
      mutations.disconnect();
      page.disconnect();
      resize?.disconnect();
    };
  }, [barRef, selector, left, right, opacity]);

  return { left, width, opacity };
}
