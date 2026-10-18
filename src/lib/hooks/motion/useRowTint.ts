import { type RefObject, useEffect, useRef } from 'react';

import { MOTION_EASINGS } from '@constants';

import type { MotionMode } from '../../contexts/MotionContext';

/** The tint fades over this long, so the eye catches which row changed (spec §4: rows arrive and leave). */
const TINT_MS = 900;

type TintRow = { id: string; original: unknown };

/**
 * After a data change, a row that is new or whose data object changed flashes an ink tint that fades. Only while the
 * view stays the same (`viewKey`: sort, filters, page), so a sort or page turn never reads as changed data. Not on first
 * render, not when most rows changed, and not under reduced motion.
 */
export function useRowTint(scopeRef: RefObject<HTMLElement | null>, rows: TintRow[], mode: MotionMode, viewKey: string) {
  const prev = useRef<Map<string, unknown> | null>(null);
  const prevView = useRef(viewKey);

  useEffect(() => {
    const next = new Map(rows.map((row) => [row.id, row.original]));
    const before = prev.current;
    prev.current = next;
    const sameView = prevView.current === viewKey;
    prevView.current = viewKey;
    if (!before || !sameView || mode === 'reduced') return;
    const kept = rows.filter((row) => before.has(row.id)).length;
    if (kept < Math.ceil(rows.length / 2)) return;
    const changed = rows.filter((row) => before.get(row.id) !== row.original);
    if (!changed.length) return;
    const tint = getComputedStyle(document.documentElement).getPropertyValue('--accent-subtle').trim() || 'transparent';
    const elements = Array.from(scopeRef.current?.querySelectorAll<HTMLElement>('[data-row-id]') ?? []);
    for (const row of changed) {
      elements
        .find((element) => element.dataset.rowId === row.id)
        ?.animate?.([{ backgroundColor: tint }, { backgroundColor: 'transparent' }], { duration: TINT_MS, easing: MOTION_EASINGS.out });
    }
  });
}
