import { type RefObject, useLayoutEffect, useRef } from 'react';

import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import type { MotionMode } from '../../contexts/MotionContext';

/**
 * How far each row moved, old position minus new, when the same rows changed order (a sort). Nothing when the set of
 * rows changed (paging, filtering) or above `max` rows (spec §4: rows glide when sorting, at most 50).
 */
export function planFlip(prev: Map<string, number>, next: Map<string, number>, max = 50): Map<string, number> {
  const deltas = new Map<string, number>();
  if (prev.size !== next.size || next.size > max) return deltas;
  for (const id of next.keys()) if (!prev.has(id)) return deltas;
  for (const [id, top] of next) deltas.set(id, (prev.get(id) ?? top) - top);
  return deltas;
}

const rowsIn = (scope: HTMLElement) => Array.from(scope.querySelectorAll<HTMLElement>('[data-row-id]'));

/** Rows glide to their new places after a sort (expressive mode only). Rows are found by `data-row-id` in `scopeRef`. */
export function useFlip(scopeRef: RefObject<HTMLElement | null>, mode: MotionMode) {
  const prev = useRef<Map<string, number> | null>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const rows = rowsIn(scope);
    const next = new Map(rows.map((row) => [row.dataset.rowId ?? '', row.offsetTop]));
    const before = prev.current;
    prev.current = next;
    if (!before || mode !== 'expressive') return;
    for (const [id, delta] of planFlip(before, next)) {
      if (!delta) continue;
      rows
        .find((row) => row.dataset.rowId === id)
        ?.animate?.([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], {
          duration: MOTION_DURATIONS.spring,
          easing: MOTION_EASINGS.spring,
        });
    }
  });
}
