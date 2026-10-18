import { describe, expect, it } from 'vite-plus/test';

import { MOTION_DURATIONS } from '@constants';

import { planInkMove } from './inkPlan';

const A = { left: 0, width: 60 };
const B = { left: 200, width: 80 };

describe('planInkMove', () => {
  it('places the ink instantly the first time (no slide in from 0 on mount)', () => {
    expect(planInkMove(null, B, 'expressive')).toEqual({
      left: { to: 200, duration: 0, delay: 0, ease: 'none' },
      right: { to: 280, duration: 0, delay: 0, ease: 'none' },
    });
  });

  it('jumps under reduced motion', () => {
    const move = planInkMove(A, B, 'reduced');
    expect([move.left.duration, move.right.duration]).toEqual([0, 0]);
  });

  it('slides both edges together in calm mode', () => {
    expect(planInkMove(A, B, 'calm')).toEqual({
      left: { to: 200, duration: MOTION_DURATIONS.base, delay: 0, ease: 'out' },
      right: { to: 280, duration: MOTION_DURATIONS.base, delay: 0, ease: 'out' },
    });
  });

  it('stretches in expressive mode: the leading edge goes first, the trailing edge springs after it', () => {
    const right = planInkMove(A, B, 'expressive');
    expect(right.right).toEqual({ to: 280, duration: 120, delay: 0, ease: 'out' });
    expect(right.left).toMatchObject({ to: 200, delay: 60, ease: 'spring' });

    const left = planInkMove(B, A, 'expressive');
    expect(left.left).toEqual({ to: 0, duration: 120, delay: 0, ease: 'out' });
    expect(left.right).toMatchObject({ to: 60, delay: 60, ease: 'spring' });
  });
});
