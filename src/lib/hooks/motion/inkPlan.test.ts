import { describe, expect, it } from 'vite-plus/test';

import { MOTION_DURATIONS } from '@constants';

import { cubicBezier, planInkMove, sampleInkMove } from './inkPlan';

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

describe('cubicBezier', () => {
  it('maps 0 and 1 to themselves and matches a known curve midpoint', () => {
    const ease = cubicBezier(0.2, 0.8, 0.2, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0.85); // ease-out is far along by half time
  });
});

describe('sampleInkMove', () => {
  const curves = { out: 'cubic-bezier(0.2, 0.8, 0.2, 1)', spring: 'cubic-bezier(0.34, 1.32, 0.64, 1)' };

  it('stretches: the leading right edge arrives first, the trailing left edge springs after its delay', () => {
    const move = planInkMove(A, B, 'expressive');
    const { duration, frames } = sampleInkMove({ left: 0, right: 60 }, move, curves);
    expect(duration).toBe(Math.max(move.left.delay + move.left.duration, move.right.delay + move.right.duration));
    expect(frames[0]).toMatchObject({ left: '0px', width: '60px', offset: 0 });
    expect(frames.at(-1)).toMatchObject({ left: '200px', width: '80px', offset: 1 });
    // Before the trailing edge's delay is up, the left edge has not moved while the right edge already has.
    const early = frames.filter((frame) => frame.offset > 0 && frame.offset * duration <= move.left.delay).at(-1)!;
    expect(parseFloat(early.left)).toBe(0);
    expect(parseFloat(early.width)).toBeGreaterThan(60);
  });

  it('never gives a negative width, even when an edge overshoots', () => {
    const move = planInkMove(B, { left: 0, width: 4 }, 'expressive');
    const { frames } = sampleInkMove({ left: 200, right: 280 }, move, curves);
    expect(frames.every((frame) => parseFloat(frame.width) >= 0)).toBe(true);
  });

  it('has nothing to play for an instant move', () => {
    const move = planInkMove(null, B, 'expressive');
    expect(sampleInkMove({ left: 0, right: 0 }, move, curves).duration).toBe(0);
  });
});
