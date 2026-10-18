import { MOTION_DURATIONS } from '@constants';

import type { MotionMode } from '../../contexts/MotionContext';

export type InkGeometry = { left: number; width: number };
export type InkEdge = { to: number; duration: number; delay: number; ease: 'out' | 'spring' | 'none' };
export type InkMove = { left: InkEdge; right: InkEdge };

/** How long the leading edge takes; the trailing edge springs after it (spec §4: elastic ink). */
const LEAD_MS = 120;
const TRAIL_DELAY_MS = 60;

/**
 * Plans the ink's move from one item to another. First placement and reduced motion are instant; calm slides both
 * edges together; expressive stretches — the edge in the direction of travel leads, the other springs after it.
 * Geometry is physical px, so RTL needs no special case.
 */
export function planInkMove(from: InkGeometry | null, to: InkGeometry, mode: MotionMode): InkMove {
  const target = { left: to.left, right: to.left + to.width };
  const instant = (value: number): InkEdge => ({ to: value, duration: 0, delay: 0, ease: 'none' });

  if (from === null || mode === 'reduced') return { left: instant(target.left), right: instant(target.right) };

  if (mode === 'calm') {
    const slide = (value: number): InkEdge => ({ to: value, duration: MOTION_DURATIONS.base, delay: 0, ease: 'out' });
    return { left: slide(target.left), right: slide(target.right) };
  }

  const lead = (value: number): InkEdge => ({ to: value, duration: LEAD_MS, delay: 0, ease: 'out' });
  const trail = (value: number): InkEdge => ({ to: value, duration: MOTION_DURATIONS.spring - 100, delay: TRAIL_DELAY_MS, ease: 'spring' });
  const movingRight = to.left > from.left;

  return movingRight ? { left: trail(target.left), right: lead(target.right) } : { left: lead(target.left), right: trail(target.right) };
}

/** A CSS cubic-bezier as a function of time (0–1) → progress, solved for x by Newton's method with bisection fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const axis = (a: number, b: number) => (t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const x = axis(x1, x2);
  const y = axis(y1, y2);
  const slope = (t: number) => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t ** 2;
  return (time: number) => {
    if (time <= 0) return 0;
    if (time >= 1) return 1;
    let t = time;
    for (let i = 0; i < 8; i += 1) {
      const error = x(t) - time;
      if (Math.abs(error) < 1e-5) return y(t);
      const d = slope(t);
      if (Math.abs(d) < 1e-6) break;
      t -= error / d;
    }
    let low = 0;
    let high = 1;
    t = time;
    while (high - low > 1e-5) {
      if (x(t) < time) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return y(t);
  };
}

const parseCurve = (curve: string) => {
  const [a, b, c, d] = curve.match(/-?[\d.]+/g)!.map(Number);
  return cubicBezier(a, b, c, d);
};

/** About one keyframe per frame at 60 Hz. */
const FRAME_MS = 16;

const px = (value: number) => `${Math.round(value * 100) / 100}px`;

/**
 * Plays a two-edge move as one keyframe list on left and width. Each edge keeps its own delay, duration and curve, so
 * the stretch survives without animating two properties against each other. An instant move has nothing to play.
 */
export function sampleInkMove(start: { left: number; right: number }, move: InkMove, curves: { out: string; spring: string }) {
  const duration = Math.max(move.left.delay + move.left.duration, move.right.delay + move.right.duration);
  const ease = { out: parseCurve(curves.out), spring: parseCurve(curves.spring) };
  const at = (edge: InkEdge, from: number, time: number) => {
    if (edge.duration === 0 || edge.ease === 'none') return edge.to;
    const progress = Math.min(1, Math.max(0, (time - edge.delay) / edge.duration));
    return from + (edge.to - from) * ease[edge.ease](progress);
  };
  if (duration === 0) return { duration, frames: [] };
  const steps = Math.max(2, Math.ceil(duration / FRAME_MS));
  const frames = Array.from({ length: steps + 1 }, (_, index) => {
    const time = (duration * index) / steps;
    const left = at(move.left, start.left, time);
    const right = at(move.right, start.right, time);
    return { left: px(left), width: px(Math.max(0, right - left)), offset: index / steps };
  });
  return { duration, frames };
}
