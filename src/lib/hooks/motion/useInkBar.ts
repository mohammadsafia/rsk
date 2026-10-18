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

    const measure = () => {
      const active = container.querySelector<HTMLElement>(selector);
      if (!active) {
        opacity.jump(0);
        last.current = null;
        return;
      }
      const geometry = { left: active.offsetLeft, width: active.offsetWidth };
      const previous = last.current;
      if (previous && previous.left === geometry.left && previous.width === geometry.width) return;
      const move = planInkMove(previous, geometry, modeRef.current);
      run(left, move.left);
      run(right, move.right);
      opacity.jump(1);
      last.current = geometry;
    };

    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(container, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'aria-current', 'aria-selected', 'aria-checked'],
    });
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resize?.observe(container);
    return () => {
      mutations.disconnect();
      resize?.disconnect();
    };
  }, [barRef, selector, left, right, opacity]);

  return { left, width, opacity };
}
