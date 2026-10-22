'use client';

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

/** How long a sort may wait for its rows (server-driven tables answer later); after that the moment has passed. */
const PENDING_MS = 3000;

type Snapshot = { tops: Map<string, number>; order: string; sortKey: string; pendingSince?: number };

/**
 * After a sort (when `sortKey` changes), rows that stayed glide to their new places and rows the sort brought onto
 * the page fade in; expressive mode only. Server-driven tables change the sort first and deliver the rows later, so a
 * sort whose rows have not arrived waits (up to 3s) with the old places kept. Paging and filtering leave `sortKey`
 * alone, so they stay still. Rows are found by `data-row-id` in `scopeRef`.
 */
export function useFlip(scopeRef: RefObject<HTMLElement | null>, mode: MotionMode, sortKey: string) {
  const prev = useRef<Snapshot | null>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const rows = rowsIn(scope);
    const order = rows.map((row) => row.dataset.rowId ?? '').join('|');
    // offsetTop forces layout, so places are read only when rows may have moved: on mount, and when the order changed.
    const readTops = () => new Map(rows.map((row) => [row.dataset.rowId ?? '', row.offsetTop]));
    const before = prev.current;
    if (!before) {
      prev.current = { tops: readTops(), order, sortKey };
      return;
    }

    const sorted = before.sortKey !== sortKey;
    const waiting = before.pendingSince !== undefined && performance.now() - before.pendingSince < PENDING_MS;
    if (order === before.order) {
      // The sort changed but its rows have not arrived yet: keep the old places until they do. Otherwise nothing
      // moved (an edit, a selection) and the last places still hold.
      prev.current =
        sorted || waiting
          ? { ...before, sortKey, pendingSince: sorted ? performance.now() : before.pendingSince }
          : { ...before, pendingSince: undefined };
      return;
    }
    const tops = readTops();
    prev.current = { tops, order, sortKey };
    if (!(sorted || waiting) || mode !== 'expressive') return;

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
