import { type RefObject, useLayoutEffect, useRef } from 'react';

import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import type { MotionMode } from '../../contexts/MotionContext';

export type FlipPlan = { moves: Map<string, number>; arrivals: string[] };

/**
 * For a sort: how far each row that stayed on the page moved (old top minus new), and which rows the sort brought onto
 * the page. Nothing above `max` rows (spec §4: rows glide when sorting, at most 50).
 */
export function planFlip(prev: Map<string, number>, next: Map<string, number>, max = 50): FlipPlan {
  const plan: FlipPlan = { moves: new Map(), arrivals: [] };
  if (next.size > max) return plan;
  for (const [id, top] of next) {
    const before = prev.get(id);
    if (before === undefined) plan.arrivals.push(id);
    else if (before !== top) plan.moves.set(id, before - top);
  }
  return plan;
}

const rowsIn = (scope: HTMLElement) => Array.from(scope.querySelectorAll<HTMLElement>('[data-row-id]'));

/**
 * After a sort (when `sortKey` changes), rows that stayed glide to their new places and rows the sort brought onto
 * the page fade in; expressive mode only. Paging and filtering leave `sortKey` alone, so they stay still. Rows are
 * found by `data-row-id` in `scopeRef`.
 */
export function useFlip(scopeRef: RefObject<HTMLElement | null>, mode: MotionMode, sortKey: string) {
  const prev = useRef<{ tops: Map<string, number>; sortKey: string } | null>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const rows = rowsIn(scope);
    const tops = new Map(rows.map((row) => [row.dataset.rowId ?? '', row.offsetTop]));
    const before = prev.current;
    prev.current = { tops, sortKey };
    if (!before || before.sortKey === sortKey || mode !== 'expressive') return;

    const rowById = (id: string) => rows.find((row) => row.dataset.rowId === id);
    const { moves, arrivals } = planFlip(before.tops, tops);
    for (const [id, delta] of moves) {
      rowById(id)?.animate?.([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], {
        duration: MOTION_DURATIONS.spring,
        easing: MOTION_EASINGS.spring,
      });
    }
    for (const id of arrivals) {
      rowById(id)?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION_DURATIONS.base, easing: MOTION_EASINGS.out });
    }
  });
}
