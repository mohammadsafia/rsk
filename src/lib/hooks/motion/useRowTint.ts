'use client';

import { type RefObject, useEffect, useRef } from 'react';

import { MOTION_EASINGS } from '@constants';

import type { MotionMode } from '../../contexts/MotionContext';

/** The tint fades over this long, so the eye catches which row changed (spec §4: rows arrive and leave). */
const TINT_MS = 900;

type TintRow = { id: string; original: unknown };

/** How long a view change (sort, filter, page) may wait for its rows before an edit counts as an edit again. */
const PENDING_MS = 3000;

/**
 * After a data change, a row that is new or whose data object changed flashes an ink tint that fades. Only edits under
 * an unchanged view (`viewKey`: sort, filters, page) count: a view change, and the rows a server sends for it later,
 * never read as changed data. Not on first render, not when most rows changed at once (a refetch, or `data` rebuilt on
 * every render), and not under reduced motion.
 */
export function useRowTint(scopeRef: RefObject<HTMLElement | null>, rows: TintRow[], mode: MotionMode, viewKey: string) {
  const prev = useRef<Map<string, unknown> | null>(null);
  const prevView = useRef(viewKey);
  const pendingSince = useRef<number | null>(null);

  useEffect(() => {
    const next = new Map(rows.map((row) => [row.id, row.original]));
    const before = prev.current;
    prev.current = next;
    const viewChanged = prevView.current !== viewKey;
    prevView.current = viewKey;
    if (!before) return;

    const changed = rows.filter((row) => before.get(row.id) !== row.original);
    const sameRows = changed.length === 0 && before.size === next.size;
    if (viewChanged) {
      // The view's rows may come later (server-driven): wait for them, unless they came with it.
      pendingSince.current = sameRows ? performance.now() : null;
      return;
    }
    if (pendingSince.current !== null) {
      const waiting = performance.now() - pendingSince.current < PENDING_MS;
      if (!sameRows || !waiting) pendingSince.current = null;
      if (waiting) return;
    }
    if (mode === 'reduced' || !changed.length || changed.length > rows.length / 2) return;

    const tint = getComputedStyle(document.documentElement).getPropertyValue('--accent-subtle').trim() || 'transparent';
    const elements = Array.from(scopeRef.current?.querySelectorAll<HTMLElement>('[data-row-id]') ?? []);
    for (const row of changed) {
      // Only a start keyframe: WAAPI fades to the row's own background, so a selected row ends on its selection tint
      // instead of fading to transparent and snapping back.
      elements
        .find((element) => element.dataset.rowId === row.id)
        ?.animate?.([{ backgroundColor: tint }], { duration: TINT_MS, easing: MOTION_EASINGS.out });
    }
  });
}
