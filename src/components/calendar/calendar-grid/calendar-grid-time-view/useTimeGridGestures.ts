import { createContext, type PointerEvent as ReactPointerEvent, type RefObject, useContext, useEffect, useRef, useState } from 'react';

import { useCalendarGridContext } from '@components/calendar';

import { useAppTranslation, useDate } from '@hooks/shared';

import {
  columnAt,
  createRange,
  dayKeyOf,
  DRAG_THRESHOLD_PX,
  isWithin,
  minuteOfDay,
  moveRange,
  offsetToMinutes,
  resizeRange,
  slotRangesFor,
  wallTime,
} from '../scheduling';
import type { GridColumn } from './CalendarGridTimeView';

/** The range being drawn, moved or resized, in minutes of the day of `columns[columnIndex]`. */
export type Draft = {
  kind: 'create' | 'move' | 'resize';
  columnIndex: number;
  start: number;
  end: number;
  eventId?: string;
  via: 'pointer' | 'keyboard';
  allowed: boolean;
};

type Session =
  | { kind: 'create'; columnIndex: number; anchor: number }
  | { kind: 'move'; event: unknown; columnIndex: number; grab: number; duration: number }
  | { kind: 'resize'; event: unknown; columnIndex: number; start: number };

/** Pointer distance from the scroller's top/bottom edge that starts auto-scrolling, and the pixels per frame. */
const EDGE_PX = 32;
const SCROLL_STEP_PX = 12;

export function useTimeGridGestures(columns: GridColumn[], scrollerRef: RefObject<HTMLDivElement | null>) {
  const { t } = useAppTranslation('common');
  const { toDate, constants } = useDate();
  const {
    startHour,
    endHour,
    stepMinutes,
    onSlotSelect,
    allowOutsideAvailability,
    slots,
    eventAccessors,
    commitChange,
    announce,
    resources,
    isEditable,
  } = useCalendarGridContext();
  const [draft, setDraft] = useState<Draft | null>(null);
  const suppressClick = useRef(false);
  const stopSession = useRef<(() => void) | null>(null);

  useEffect(() => () => stopSession.current?.(), []);

  const min = startHour * 60;
  const max = endHour * 60;

  /** No availability data counts as open; otherwise every step cell must overlap a slot. */
  const isAllowed = (columnIndex: number, start: number, end: number) => {
    if (allowOutsideAvailability) return true;
    const column = columns[columnIndex];
    if (!column) return false;
    const ranges = slotRangesFor(slots, column.dayKey, column.resourceId);
    return ranges === null || isWithin(ranges, start, end, stepMinutes);
  };

  const time = (dayKey: string, minutes: number) => toDate(wallTime(dayKey, minutes), constants.TimeFormats.HOUR_MINUTES_12);

  /** Live label on the ghost: "10:30 AM – 11:15 AM". */
  const label = (columnIndex: number, start: number, end: number) => {
    const dayKey = columns[columnIndex]?.dayKey;
    return dayKey ? `${time(dayKey, start)} – ${time(dayKey, end)}` : '';
  };

  /** Spoken position: "Fri, Oct 16, 10:30 AM to 11:00 AM, Dr. Haddad" (or a single time for a cell). */
  const describe = (columnIndex: number, start: number, end?: number) => {
    const column = columns[columnIndex];
    if (!column) return '';
    const day = toDate(wallTime(column.dayKey, start), constants.DateFormats.DAY_SHORT_MONTH);
    const when =
      end === undefined
        ? time(column.dayKey, start)
        : t('calendar.timeRange', { start: time(column.dayKey, start), end: time(column.dayKey, end) });
    const resource = resources.find((candidate) => candidate.id === column.resourceId)?.label;
    return [day, when, resource].filter(Boolean).join(', ');
  };

  /** Column and minute under a pointer. Outside every column, the last known column is kept. */
  const hitTest = (clientX: number, clientY: number, fallback: number) => {
    const elements = [...(scrollerRef.current?.querySelectorAll<HTMLElement>('[data-calendar-column]') ?? [])];
    const rects = elements.map((element) => element.getBoundingClientRect());
    const found = columnAt(clientX, rects);
    const columnIndex = found === -1 ? fallback : found;
    const rect = rects[columnIndex] ?? rects[0];
    return { columnIndex, minute: rect ? offsetToMinutes(clientY - rect.top, rect.height, startHour, endHour) : min };
  };

  /** Hands a finished draft to the consumer: a slot selection, or an event change (skipped when nothing moved). */
  const apply = (next: Draft, event: unknown) => {
    const column = columns[next.columnIndex];
    if (!column) return;
    if (next.kind === 'create') {
      if (next.allowed)
        onSlotSelect?.({
          start: wallTime(column.dayKey, next.start),
          end: wallTime(column.dayKey, next.end),
          resourceId: column.resourceId,
        });
      return;
    }
    const originalStart = eventAccessors.getStartTime(event);
    const originalEnd = eventAccessors.getEndTime(event);
    const originalResource = eventAccessors.getResourceId?.(event);
    const resourceId = column.resourceId ?? originalResource;
    const unchanged =
      dayKeyOf(originalStart) === column.dayKey &&
      minuteOfDay(originalStart) === next.start &&
      minuteOfDay(originalEnd) === next.end &&
      resourceId === originalResource;
    if (unchanged) return;
    void commitChange({ event, start: wallTime(column.dayKey, next.start), end: wallTime(column.dayKey, next.end), resourceId });
    announce(t(next.kind === 'move' ? 'calendar.moved' : 'calendar.resized', { when: describe(next.columnIndex, next.start, next.end) }));
  };

  const startSession = (pressEvent: ReactPointerEvent<HTMLElement>, session: Session) => {
    stopSession.current?.();
    const pointerId = pressEvent.pointerId;
    const origin = { x: pressEvent.clientX, y: pressEvent.clientY };
    const eventId = session.kind === 'create' ? undefined : eventAccessors.getId(session.event);
    let last = origin;
    let active = false;
    let current: Draft | null = null;
    let lastColumn = session.columnIndex;
    let edge = 0;
    let frame = 0;

    try {
      pressEvent.currentTarget.setPointerCapture(pointerId);
    } catch {
      // Pointer capture is a nicety; window listeners still follow the pointer.
    }

    const compute = (x: number, y: number): Draft => {
      const hit = hitTest(x, y, lastColumn);
      if (session.kind === 'create') {
        const range = createRange(session.anchor, hit.minute, stepMinutes, min, max);
        return {
          kind: 'create',
          columnIndex: session.columnIndex,
          ...range,
          via: 'pointer',
          allowed: isAllowed(session.columnIndex, range.start, range.end),
        };
      }
      if (session.kind === 'move') {
        lastColumn = hit.columnIndex;
        const range = moveRange(hit.minute, session.grab, session.duration, stepMinutes, min, max);
        return { kind: 'move', columnIndex: hit.columnIndex, ...range, eventId, via: 'pointer', allowed: true };
      }
      const range = resizeRange(session.start, hit.minute, stepMinutes, max);
      return { kind: 'resize', columnIndex: session.columnIndex, ...range, eventId, via: 'pointer', allowed: true };
    };

    const update = () => {
      current = compute(last.x, last.y);
      setDraft(current);
    };

    const scrollTick = () => {
      const scroller = scrollerRef.current;
      if (!scroller || edge === 0) {
        frame = 0;
        return;
      }
      scroller.scrollTop += edge * SCROLL_STEP_PX;
      update();
      frame = requestAnimationFrame(scrollTick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      last = { x: event.clientX, y: event.clientY };
      if (!active && Math.hypot(last.x - origin.x, last.y - origin.y) < DRAG_THRESHOLD_PX) return;
      active = true;
      update();
      const rect = scrollerRef.current?.getBoundingClientRect();
      edge = rect ? (last.y < rect.top + EDGE_PX ? -1 : last.y > rect.bottom - EDGE_PX ? 1 : 0) : 0;
      if (edge !== 0 && frame === 0) frame = requestAnimationFrame(scrollTick);
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      stopSession.current = null;
    };

    const finish = (commit: boolean) => {
      cleanup();
      setDraft(null);
      if (!commit) return;
      if (!active) {
        // A click: on an empty cell it selects one step; on an event it falls through to the popover.
        if (session.kind === 'create') {
          const range = createRange(session.anchor, session.anchor, stepMinutes, min, max);
          apply(
            {
              kind: 'create',
              columnIndex: session.columnIndex,
              ...range,
              via: 'pointer',
              allowed: isAllowed(session.columnIndex, range.start, range.end),
            },
            undefined,
          );
        }
        return;
      }
      if (session.kind !== 'create') {
        // The click that follows a drag must not open the event's popover.
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 0);
      }
      if (current) apply(current, session.kind === 'create' ? undefined : session.event);
    };

    function onUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      last = { x: event.clientX, y: event.clientY };
      if (active) current = compute(last.x, last.y);
      finish(true);
    }

    function onCancel() {
      finish(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      const wasActive = active;
      finish(false);
      if (wasActive) announce(t('calendar.cancelled'));
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    stopSession.current = () => finish(false);
  };

  const onColumnPointerDown = (event: ReactPointerEvent<HTMLElement>, columnIndex: number) => {
    if (!onSlotSelect || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('[data-slot="calendar-time-grid-event-card"]')) return;
    const hit = hitTest(event.clientX, event.clientY, columnIndex);
    startSession(event, { kind: 'create', columnIndex, anchor: hit.minute });
  };

  const onEventPointerDown = (pressEvent: ReactPointerEvent<HTMLElement>, event: unknown, columnIndex: number) => {
    if (!isEditable(event) || pressEvent.button !== 0) return;
    const start = minuteOfDay(eventAccessors.getStartTime(event));
    const end = minuteOfDay(eventAccessors.getEndTime(event));
    if ((pressEvent.target as HTMLElement).closest('[data-resize-handle]')) {
      startSession(pressEvent, { kind: 'resize', event, columnIndex, start });
      return;
    }
    const hit = hitTest(pressEvent.clientX, pressEvent.clientY, columnIndex);
    startSession(pressEvent, { kind: 'move', event, columnIndex, grab: hit.minute - start, duration: Math.max(end - start, stepMinutes) });
  };

  return {
    draft,
    setDraft,
    isAllowed,
    label,
    describe,
    apply,
    onColumnPointerDown,
    onEventPointerDown,
    shouldSuppressClick: () => suppressClick.current,
  };
}

export type TimeGridGestures = ReturnType<typeof useTimeGridGestures>;

export const TimeGridGestureContext = createContext<TimeGridGestures | null>(null);

export const useTimeGridGestureContext = () => {
  const context = useContext(TimeGridGestureContext);
  if (!context) throw new Error('Time grid parts must be used inside a CalendarGrid day or week view');
  return context;
};
