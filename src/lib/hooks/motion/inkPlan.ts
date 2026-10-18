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
