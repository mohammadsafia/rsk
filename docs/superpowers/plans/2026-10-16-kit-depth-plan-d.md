# Kit depth — Plan D: Calendar scheduler — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `CalendarGrid` into a scheduler, with every addition optional:
- resource columns, plus a week-view resource filter
- creating a slot by click or drag
- moving and resizing events with optimistic save and revert
- full keyboard operation with polite announcements
- an all-day row
- an agenda view

**Architecture:** All interaction maths lives in one pure module, `calendar-grid/scheduling.ts`, which works in wall-clock minutes and day keys and is unit-tested directly.
- **Day and Week views** share one `TimeGrid` layout over a list of `GridColumn`s (`{ key, dayKey, resourceId? }`), with a single scroller, a sticky header and a sticky time axis.
- **Gestures:** `useTimeGridGestures` holds one draft (`create | move | resize`, from the pointer or the keyboard). Pointer flows listen on `window` after `setPointerCapture`.
- **Root state:** the root holds the optimistic overrides (a wrapped `eventAccessors`), the announcer and the new props.
- **New views:** the all-day row and the agenda view are separate components in their own files.

**Tech Stack:** React 18, date-fns 4 (already used by `useDate`), Radix Popover/Select (existing kit wrappers), Tailwind v4 tokens, react-i18next, Vitest + Testing Library (happy-dom), MDX docs.

**Spec:** `docs/superpowers/specs/2026-10-16-kit-depth-design.md` (Plan D section).

## Global Constraints

- Semantic tokens only; the `ds:baseline` stays `{}`. No coloured side stripes. Every field keeps Input's height.
- English and Arabic for all copy (`src/locales/{en,ar}/common.json`, `calendar.*`). RTL-correct: columns, lanes, drag directions and keyboard arrows mirror. Times are LTR-isolated (`<bdi dir="ltr">`) and use Western digits.
- Existing public APIs keep working: every change to `CalendarGrid` is additive and optional.
- No drag-and-drop library. No new dependencies.
- Each behaviour is written test-first (TDD). The docs page follows the enforced anatomy, and `docs:lint` plus the render-all test pass.
- Docs stay dev-only.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `P() { corepack pnpm@10.34.7 "$@"; }`. Run `tsc` unpiped.
- After adding new MDX, run `rm -rf node_modules/.vitest-cache node_modules/.vite node_modules/.vite-temp`.

## Spec deviations (rulings, decided here)

- **Agenda tab:** the spec says "`ViewTabs` gains Agenda". The global constraint says current usage must not change, so `ViewTabs` takes `views?: CalendarView[]`. It defaults to `['day', 'week', 'month']`, and the docs pass Agenda in.
- **Week resource filter:** the Select offers "All resources" plus each resource, defaulting to all. "One at a time" is one choice in that list.
- **Availability with no `slots`:** today, with no `slots`, every cell renders sunken (unavailable). That stays the same unless `onSlotSelect` is set. In that case a grid with no availability data treats every cell as open and renders it open.
- **Touch create:** on touch, a tap on an empty cell selects one step. A vertical swipe scrolls the grid (`touch-action` stays default on columns), so drag-to-create is for mouse and pen only. Editable event cards are `touch-none`, so touch drags move and resize them.
- **Resource view with an event that has no resource id:** in resource columns such an event is not shown; the docs say so.
- **Midnight-spanning events** go to the all-day row, as the spec says, even though they used to render clamped in the time grid.
- **Single scroller:** the two-row layout with the `scrollbar-gutter` trick becomes one scroller with a sticky header row. Horizontal resource scrolling needs the header and body to share a scroll position.
- **Optimistic overrides:** an override is dropped as soon as a rejected promise reverts it. After a resolve, it stays until the `events` prop changes, so a consumer that refetches sees no flash back.

## Review Focus

1. **A drag ending outside the columns (over the axis or header, or past the grid).** It keeps the last valid column and clamps the time to the visible hours; it never produces NaN or an off-grid time. → Task 1 (pure `columnAt`/`offsetToMinutes` tests) + Task 5 test.
2. **A short press on an editable event still opens its popover.** Under 4 px is a click, and a real drag never opens the popover afterwards. → Task 5 tests.
3. **`onEventChange` rejects.** The event returns to where it was, a danger toast appears, and the next drag still works. → Task 5 test.
4. **Arabic keyboard move.** In RTL, ArrowLeft goes to the next day or resource. `M` works through `event.code` on an Arabic layout. → Task 6 test.
5. **A DST day.** A slot created at 10:00 on a day the clock changes yields a 10:00 local wall time; minutes are never added as milliseconds. → Task 1 test (`wallTime` on a DST date through the `TZ` env in the test) — asserted on the formatted wall time.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/calendar/calendar-grid/scheduling.ts` | pure maths: snapping, hit-testing, wall time, availability, lanes, day keys |
| `src/components/calendar/calendar-grid/scheduling.test.ts` | unit tests for the above |
| `src/components/calendar/calendar-grid/CalendarGrid.tsx` | new props and context; agenda range; overrides; announcer |
| `src/components/calendar/calendar-grid/calendar-grid-time-view/placement.ts` | overlap placement (moved out of the view, unchanged maths) |
| `src/components/calendar/calendar-grid/calendar-grid-time-view/CalendarGridTimeView.tsx` | `TimeGrid` layout, columns, headers, cells, event slots, draft ghost |
| `src/components/calendar/calendar-grid/calendar-grid-time-view/useTimeGridGestures.ts` | pointer and keyboard draft state machine |
| `src/components/calendar/calendar-grid/calendar-grid-time-view/AllDayRow.tsx` | all-day strip with lanes and "+N more" |
| `src/components/calendar/calendar-grid/calendar-grid-agenda-view/CalendarGridAgendaView.tsx` (+ `index.ts`) | agenda list |
| `src/components/calendar/calendar-grid/calendar-grid-chrome/CalendarGridChrome.tsx` | `ViewTabs views`, `ResourceFilter` |
| `src/components/calendar/calendar-grid/index.ts` | new type exports |
| `src/components/calendar/calendar-grid/{resources,allday,agenda,create,move,keyboard}.test.tsx` | behaviour tests |
| `src/locales/{en,ar}/common.json` | `calendar.*` keys |
| `src/component-docs/calendar/CalendarScheduler.mdx` | docs page |

### Shared test helpers

Each pointer test stubs layout, because happy-dom has none:

```ts
// In create/move tests: columns are 200px wide side by side from x=100, 800px tall from y=0 (startHour 8 → endHour 16 = 100px/hour).
const stubLayout = () =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = Number(this.dataset.columnIndex ?? -1);
    if (this.dataset.calendarColumn !== undefined) return DOMRect.fromRect({ x: 100 + index * 200, y: 0, width: 200, height: 800 });
    if (this.dataset.slot === 'calendar-grid-body') return DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 800 });
    return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
  });
```

Pointer events are fired with `fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX, clientY })`. Move and up go to `window`: `fireEvent.pointerMove(window, { pointerId: 1, clientX, clientY })` and `fireEvent.pointerUp(window, { pointerId: 1, clientX, clientY })`.

---

### Task 1: Scheduling maths

**Files:**
- Create: `src/components/calendar/calendar-grid/scheduling.ts`
- Test: `src/components/calendar/calendar-grid/scheduling.test.ts`

**Interfaces:**
- Produces (all exported from `scheduling.ts`):
  - `DRAG_THRESHOLD_PX = 4`
  - `type MinuteRange = { start: number; end: number }`
  - `type SlotRange = { startTime: string; endTime: string }`
  - `type CalendarSlots = Record<string, SlotRange[]> | Record<string, Record<string, SlotRange[]>>`
  - `snapMinutes(minutes, step, mode?: 'round' | 'floor'): number`
  - `clamp(value, min, max): number`
  - `offsetToMinutes(offset, height, startHour, endHour): number`
  - `columnAt(clientX, rects: { left: number; right: number }[]): number` (-1 when outside)
  - `minuteOfDay(input: string): number`
  - `dayKeyOf(input: string): string`
  - `lastDayKeyOf(start: string, end: string): string`
  - `spansDays(start, end): boolean`
  - `wallTime(dayKey, minutes): string` (offset ISO `yyyy-MM-dd'T'HH:mm:ssxxx`)
  - `shiftDayKey(dayKey, delta): string`
  - `dayKeysBetween(startKey, endKey): string[]`
  - `parseClock('09:30'): number`
  - `isResourceKeyed(slots): boolean`
  - `slotRangesFor(slots | null | undefined, dayKey, resourceId?): MinuteRange[] | null` (null = no availability data)
  - `slotDates(slots): Set<string>`
  - `isWithin(ranges, start, end, step): boolean`
  - `createRange(anchor, current, step, min, max): MinuteRange`
  - `moveRange(pointer, grab, duration, step, min, max): MinuteRange`
  - `resizeRange(start, pointer, step, max): MinuteRange`
  - `packLanes<T extends { startCol: number; endCol: number }>(spans: T[]): { placed: (T & { lane: number })[]; laneCount: number }`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vite-plus/test';

import {
  clamp, columnAt, createRange, dayKeyOf, dayKeysBetween, isResourceKeyed, isWithin, lastDayKeyOf, minuteOfDay, moveRange,
  offsetToMinutes, packLanes, parseClock, resizeRange, shiftDayKey, slotDates, slotRangesFor, snapMinutes, spansDays, wallTime,
} from './scheduling';

describe('snapping and clamping', () => {
  it('snaps to the step, rounding or flooring', () => {
    expect(snapMinutes(607, 15)).toBe(600);
    expect(snapMinutes(608, 15)).toBe(615);
    expect(snapMinutes(614, 15, 'floor')).toBe(600);
    expect(clamp(5, 10, 20)).toBe(10);
  });

  it('maps a pointer offset to a minute and clamps outside the column', () => {
    expect(offsetToMinutes(100, 800, 8, 16)).toBe(540);
    expect(offsetToMinutes(-40, 800, 8, 16)).toBe(480);
    expect(offsetToMinutes(900, 800, 8, 16)).toBe(960);
    expect(offsetToMinutes(10, 0, 8, 16)).toBe(960);
  });

  it('finds the column under the pointer, -1 outside', () => {
    const rects = [{ left: 100, right: 300 }, { left: 300, right: 500 }];
    expect(columnAt(150, rects)).toBe(0);
    expect(columnAt(300, rects)).toBe(1);
    expect(columnAt(50, rects)).toBe(-1);
  });
});

describe('wall time and day keys', () => {
  it('reads the local minute and day of a timestamp', () => {
    expect(minuteOfDay('2026-10-16T10:30:00')).toBe(630);
    expect(dayKeyOf('2026-10-16T23:59:00')).toBe('2026-10-16');
    expect(dayKeyOf('2026-10-16')).toBe('2026-10-16');
  });

  it('builds wall time from parts, so the clock reads the same across a DST change', () => {
    // 2026-03-29 is the EU spring-forward day; 10:00 must stay 10:00 whatever the zone.
    expect(wallTime('2026-03-29', 600).slice(0, 19)).toBe('2026-03-29T10:00:00');
    expect(minuteOfDay(wallTime('2026-03-29', 600))).toBe(600);
    expect(wallTime('2026-10-16', 24 * 60).slice(0, 10)).toBe('2026-10-17');
  });

  it('shifts and lists day keys', () => {
    expect(shiftDayKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(dayKeysBetween('2026-10-30', '2026-11-01')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });

  it('treats an end exactly at midnight as the day before', () => {
    expect(spansDays('2026-10-16T23:00:00', '2026-10-17T00:00:00')).toBe(false);
    expect(spansDays('2026-10-16T23:00:00', '2026-10-17T01:00:00')).toBe(true);
    expect(lastDayKeyOf('2026-10-16T00:00:00', '2026-10-19T00:00:00')).toBe('2026-10-18');
    expect(lastDayKeyOf('2026-10-16T10:00:00', '2026-10-16T10:00:00')).toBe('2026-10-16');
  });
});

describe('availability', () => {
  const byDate = { '2026-10-16': [{ startTime: '09:00', endTime: '12:00' }] };
  const byResource = { haddad: { '2026-10-16': [{ startTime: '09:00', endTime: '10:00' }] }, khalil: { '2026-10-16': [{ startTime: '13:00', endTime: '14:00' }] } };

  it('reads date-keyed and resource-keyed slots', () => {
    expect(parseClock('09:30')).toBe(570);
    expect(isResourceKeyed(byDate)).toBe(false);
    expect(isResourceKeyed(byResource)).toBe(true);
    expect(slotRangesFor(undefined, '2026-10-16')).toBeNull();
    expect(slotRangesFor(byDate, '2026-10-17')).toEqual([]);
    expect(slotRangesFor(byResource, '2026-10-16', 'haddad')).toEqual([{ start: 540, end: 600 }]);
    expect(slotRangesFor(byResource, '2026-10-16')).toEqual([{ start: 540, end: 600 }, { start: 780, end: 840 }]);
    expect([...slotDates(byResource)]).toEqual(['2026-10-16']);
  });

  it('accepts a range only when every step cell overlaps availability', () => {
    const ranges = [{ start: 540, end: 720 }];
    expect(isWithin(ranges, 540, 600, 30)).toBe(true);
    expect(isWithin(ranges, 690, 750, 30)).toBe(false);
  });
});

describe('gesture ranges', () => {
  it('creates a range covering both ends, at least one step', () => {
    expect(createRange(610, 610, 30, 480, 960)).toEqual({ start: 600, end: 630 });
    expect(createRange(700, 610, 30, 480, 960)).toEqual({ start: 600, end: 720 });
    expect(createRange(950, 990, 30, 480, 960)).toEqual({ start: 930, end: 960 });
  });

  it('moves keeping the duration and stays inside the hours', () => {
    expect(moveRange(640, 10, 60, 15, 480, 960)).toEqual({ start: 630, end: 690 });
    expect(moveRange(990, 0, 60, 15, 480, 960)).toEqual({ start: 900, end: 960 });
    expect(moveRange(400, 0, 600, 15, 480, 960)).toEqual({ start: 480, end: 1080 });
  });

  it('resizes the end, never below one step', () => {
    expect(resizeRange(600, 680, 15, 960)).toEqual({ start: 600, end: 675 });
    expect(resizeRange(600, 590, 15, 960)).toEqual({ start: 600, end: 615 });
  });
});

describe('lane packing', () => {
  it('puts overlapping spans in separate lanes and reuses freed lanes', () => {
    const { placed, laneCount } = packLanes([
      { id: 'a', startCol: 0, endCol: 2 },
      { id: 'b', startCol: 1, endCol: 1 },
      { id: 'c', startCol: 3, endCol: 4 },
    ]);
    expect(laneCount).toBe(2);
    expect(placed.find((p) => p.id === 'a')?.lane).toBe(0);
    expect(placed.find((p) => p.id === 'b')?.lane).toBe(1);
    expect(placed.find((p) => p.id === 'c')?.lane).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `P exec vp test --run src/components/calendar/calendar-grid/scheduling.test.ts`
Expected: FAIL — cannot resolve `./scheduling`.

- [ ] **Step 3: Implement `scheduling.ts`**

```ts
import { format, parseISO } from 'date-fns';

/** A press that moves less than this is a click. */
export const DRAG_THRESHOLD_PX = 4;

export type MinuteRange = { start: number; end: number };
export type SlotRange = { startTime: string; endTime: string };
export type CalendarSlots = Record<string, SlotRange[]> | Record<string, Record<string, SlotRange[]>>;

const DAY_KEY = 'yyyy-MM-dd';

const toLocal = (input: string): Date => (/^\d{4}-\d{2}-\d{2}$/.test(input) ? parseISO(input) : new Date(input));

const fromDayKey = (dayKey: string, minutes = 0): Date => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, minutes);
};

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const snapMinutes = (minutes: number, step: number, mode: 'round' | 'floor' = 'round') =>
  (mode === 'floor' ? Math.floor(minutes / step) : Math.round(minutes / step)) * step;

/** Minute of the day under a pointer `offset` px below the top of a column `height` px tall spanning startHour..endHour. */
export const offsetToMinutes = (offset: number, height: number, startHour: number, endHour: number) => {
  const ratio = height > 0 ? clamp(offset / height, 0, 1) : 1;
  return startHour * 60 + ratio * (endHour - startHour) * 60;
};

/** Index of the column whose rect contains `clientX`; DOM rects already reflect RTL order. */
export const columnAt = (clientX: number, rects: { left: number; right: number }[]) =>
  rects.findIndex((rect) => clientX >= rect.left && clientX < rect.right);

export const minuteOfDay = (input: string) => {
  const date = toLocal(input);
  return date.getHours() * 60 + date.getMinutes();
};

export const dayKeyOf = (input: string) => format(toLocal(input), DAY_KEY);

/** The last day an event touches; an end exactly at midnight belongs to the day before. */
export const lastDayKeyOf = (start: string, end: string) => {
  const startDate = toLocal(start);
  const endDate = toLocal(end);
  if (endDate <= startDate) return format(startDate, DAY_KEY);
  return format(new Date(endDate.getTime() - 1), DAY_KEY);
};

export const spansDays = (start: string, end: string) => lastDayKeyOf(start, end) !== dayKeyOf(start);

/**
 * Local wall time `minutes` after midnight on `dayKey`, as an offset ISO string. Built from wall-clock parts (never by
 * adding milliseconds), so a DST change on that day doesn't shift it.
 */
export const wallTime = (dayKey: string, minutes: number) => format(fromDayKey(dayKey, minutes), "yyyy-MM-dd'T'HH:mm:ssxxx");

export const shiftDayKey = (dayKey: string, delta: number) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return format(new Date(year, month - 1, day + delta), DAY_KEY);
};

export const dayKeysBetween = (startKey: string, endKey: string) => {
  const keys: string[] = [];
  for (let key = startKey; key <= endKey; key = shiftDayKey(key, 1)) keys.push(key);
  return keys;
};

export const parseClock = (time: string) => {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes ?? 0);
};

const toRanges = (list: SlotRange[] | undefined): MinuteRange[] =>
  (list ?? []).map((slot) => ({ start: parseClock(slot.startTime), end: parseClock(slot.endTime) }));

export const isResourceKeyed = (slots: CalendarSlots) => Object.values(slots).some((value) => !!value && !Array.isArray(value));

/** Availability for a column: `null` when there is no availability data at all. */
export const slotRangesFor = (slots: CalendarSlots | null | undefined, dayKey: string, resourceId?: string): MinuteRange[] | null => {
  if (!slots) return null;
  if (!isResourceKeyed(slots)) return toRanges((slots as Record<string, SlotRange[]>)[dayKey]);
  const byResource = slots as Record<string, Record<string, SlotRange[]>>;
  const maps = resourceId === undefined ? Object.values(byResource) : [byResource[resourceId]];
  return maps.flatMap((map) => toRanges(map?.[dayKey]));
};

export const slotDates = (slots: CalendarSlots) =>
  new Set(isResourceKeyed(slots) ? Object.values(slots as Record<string, Record<string, SlotRange[]>>).flatMap((map) => Object.keys(map ?? {})) : Object.keys(slots));

/** True when each step cell of [start, end) overlaps an available range (the same rule the cells are painted with). */
export const isWithin = (ranges: MinuteRange[], start: number, end: number, step: number) => {
  for (let minute = start; minute < end; minute += step) {
    if (!ranges.some((range) => minute < range.end && minute + step > range.start)) return false;
  }
  return true;
};

export const createRange = (anchor: number, current: number, step: number, min: number, max: number): MinuteRange => {
  const a = snapMinutes(anchor, step, 'floor');
  const c = snapMinutes(current, step, 'floor');
  return { start: clamp(Math.min(a, c), min, max - step), end: clamp(Math.max(a, c) + step, min + step, max) };
};

export const moveRange = (pointer: number, grab: number, duration: number, step: number, min: number, max: number): MinuteRange => {
  const start = clamp(snapMinutes(pointer - grab, step), min, Math.max(min, max - duration));
  return { start, end: start + duration };
};

export const resizeRange = (start: number, pointer: number, step: number, max: number): MinuteRange => ({
  start,
  end: clamp(snapMinutes(pointer, step), start + step, Math.max(start + step, max)),
});

/** Greedy lane packing: each span takes the lowest lane that is free across its columns. */
export const packLanes = <T extends { startCol: number; endCol: number }>(spans: T[]) => {
  const sorted = [...spans].sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol));
  const laneEnds: number[] = [];
  const placed = sorted.map((span) => {
    let lane = laneEnds.findIndex((end) => end < span.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(span.endCol);
    } else laneEnds[lane] = span.endCol;
    return { ...span, lane };
  });
  return { placed, laneCount: laneEnds.length };
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `P exec vp test --run src/components/calendar/calendar-grid/scheduling.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit** — `feat(calendar): pure scheduling maths — snapping, hit-testing, wall time, availability, lanes`

---

### Task 2: Resources, single-scroller layout, week filter

**Files:**
- Modify: `CalendarGrid.tsx` (types, props, context), `calendar-grid/index.ts` (exports)
- Create: `calendar-grid-time-view/placement.ts` (move `parseEventsForDay`, `clusterEvents`, `placeCluster`, `placeEvents` here; `parseEventsForDay` takes a `belongs: (event) => boolean` predicate instead of `dayKey`/`isoFor`)
- Modify: `CalendarGridTimeView.tsx` (`TimeGrid`, `GridColumn`, `ResourceHeader`), `CalendarGridChrome.tsx` (`ResourceFilter`), `CalendarGridMonthView.tsx` (`slotCoverageDates` from `slotDates`)
- Locales: `calendar.allResources` "All resources" / "كل الموارد"; `calendar.resource` "Resource" / "المورد"
- Test: `calendar-grid/resources.test.tsx`

**Interfaces:**
- Produces in `CalendarGrid.tsx`:
  - Types:
    - `CalendarResource = { id: string; label: string; avatar?: string }`
    - `CalendarAccessors<T>` adds `getResourceId?: (event: T) => string | undefined` and `isAllDay?: (event: T) => boolean`
    - `CalendarView = 'day' | 'week' | 'month' | 'agenda'` (agenda used in Task 4)
  - Props: `resources?`, `resourceFilter?: string | null`, `onResourceFilterChange?`, `slots?: CalendarSlots`
  - Context: `resources: CalendarResource[]`, `resourceFilter: string | null`, `setResourceFilter(id | null)`
- `GridColumn = { key: string; dayKey: string; resourceId?: string }` (exported from `CalendarGridTimeView.tsx`).
- Columns carry `data-calendar-column`, `data-column-index`, `data-day` and `data-resource`. The scroller is `data-slot="calendar-grid-body"`.
- `CalendarGrid.ResourceFilter` (chrome).

Layout of both time views (single scroller):

```tsx
<div data-slot={slot} className="flex min-h-0 flex-1 flex-col">
  <div data-slot="calendar-grid-body" ref={scrollerRef} className="relative min-h-128 flex-1 overflow-auto [scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]">
    <div className="flex w-max min-w-full flex-col">
      <div data-slot="calendar-grid-header-row" className="bg-surface sticky top-0 z-40 flex flex-col">
        <div className="flex">
          <CalendarTimeGrid.Spacer className="bg-surface sticky start-0 z-10" />
          <div className="flex flex-1">{headers}</div>
        </div>
        {/* Task 3: <AllDayRow columns={columns} /> */}
      </div>
      <div data-slot="calendar-grid-body-row" className="flex flex-1">
        <TimeAxis className="sticky start-0 z-30" />
        {columns.map((column, index) => <DayColumn key={column.key} column={column} index={index} />)}
      </div>
    </div>
  </div>
</div>
```

Resource columns (and their headers) get `min-w-44`. Other columns get `min-w-0`. `TimeAxis` forwards `className` to `CalendarTimeGrid.Axis`. An event belongs to a column when all three hold:
- `dayKeyOf(start) === column.dayKey`
- `column.resourceId` is undefined, or `getResourceId?.(event) === column.resourceId`
- the event is not all-day: neither `isAllDay?.(event)` nor `spansDays(start, end)` (Task 3 fills the row; Task 2 already excludes them)

Columns:
- **Day, with resources:** `resources.map((r) => ({ key: `${date}:${r.id}`, dayKey: date, resourceId: r.id }))`.
- **Day, otherwise:** `[{ key: date, dayKey: date }]`.
- **Week:** each day `{ key: day, dayKey: day, resourceId: resourceFilter ?? undefined }`.

Cell availability uses `slotRangesFor(slots, column.dayKey, column.resourceId)`. When it is null, the cell is unavailable (painted as today; Task 5 changes this when `onSlotSelect` is set).

- [ ] **Step 1: Write the failing tests** (`resources.test.tsx`)

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarGrid, type CalendarView } from '@components/calendar';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

type Visit = { id: string; start: string; end: string; patient: string; doctor?: string };
const visits: Visit[] = [
  { id: '1', start: '2026-10-16T09:00:00', end: '2026-10-16T09:30:00', patient: 'Sara Haddad', doctor: 'haddad' },
  { id: '2', start: '2026-10-16T09:00:00', end: '2026-10-16T10:00:00', patient: 'Omar Khalil', doctor: 'khalil' },
  { id: '3', start: '2026-10-15T11:00:00', end: '2026-10-15T11:30:00', patient: 'Lina Nasser', doctor: 'khalil' },
];
const resources = [{ id: 'haddad', label: 'Dr. Haddad' }, { id: 'khalil', label: 'Dr. Khalil' }];
const accessors = { getId: (v: Visit) => v.id, getStartTime: (v: Visit) => v.start, getEndTime: (v: Visit) => v.end, getResourceId: (v: Visit) => v.doctor };

const renderGrid = (view: CalendarView, extra: Record<string, unknown> = {}) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid initialView={view} initialDate="2026-10-16" events={visits} eventAccessors={accessors} resources={resources} startHour={8} endHour={12} {...extra}>
        <CalendarGrid.Header><CalendarGrid.ResourceFilter /></CalendarGrid.Header>
        <CalendarGrid.EventTemplate<Visit>>{(visit) => visit.patient}</CalendarGrid.EventTemplate>
        <CalendarGrid.DayView />
        <CalendarGrid.WeekView />
      </CalendarGrid>
    </Tooltip.Provider>,
  );

const column = (resource: string) => document.querySelector(`[data-calendar-column][data-resource="${resource}"]`) as HTMLElement;

describe('CalendarGrid resources', () => {
  it('renders one day column per resource with a header and its own events', () => {
    renderGrid('day');
    expect(document.querySelectorAll('[data-calendar-column]')).toHaveLength(2);
    expect(screen.getByText('Dr. Haddad')).toBeTruthy();
    expect(within(column('haddad')).getByText('Sara Haddad')).toBeTruthy();
    expect(within(column('khalil')).getByText('Omar Khalil')).toBeTruthy();
    expect(within(column('haddad')).queryByText('Omar Khalil')).toBeNull();
  });

  it('keeps the time axis and the header sticky inside one scroller', () => {
    renderGrid('day');
    const body = document.querySelector('[data-slot="calendar-grid-body"]')!;
    expect(body.className).toContain('overflow-auto');
    expect(body.querySelector('[data-slot="calendar-grid-header-row"]')?.className).toContain('sticky');
    expect(body.querySelector('[data-slot="calendar-time-grid-axis"]')?.className).toContain('sticky');
  });

  it('paints availability per resource from resource-keyed slots', () => {
    renderGrid('day', { slots: { haddad: { '2026-10-16': [{ startTime: '08:00', endTime: '09:00' }] }, khalil: {} } });
    const firstCell = (resource: string) => column(resource).querySelector('[data-slot="calendar-time-grid-cell"]')!;
    expect(firstCell('haddad').className).toContain('bg-surface ');
    expect(firstCell('khalil').className).toContain('bg-surface-sunken');
  });

  it('filters the week to one resource with the header Select', async () => {
    const changes: (string | null)[] = [];
    renderGrid('week', { onResourceFilterChange: (id: string | null) => changes.push(id) });
    expect(screen.getByText('Lina Nasser')).toBeTruthy();
    fireEvent.click(screen.getByRole('combobox', { name: 'Resource' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Dr. Haddad' }));
    expect(changes).toEqual(['haddad']);
    expect(screen.queryByText('Lina Nasser')).toBeNull();
    expect(screen.getByText('Sara Haddad')).toBeTruthy();
  });

  it('hides the filter outside the week view and without resources', () => {
    renderGrid('day');
    expect(screen.queryByRole('combobox', { name: 'Resource' })).toBeNull();
  });
});
```

Note: happy-dom's Radix Select may need `hasPointerCapture`/`scrollIntoView` stubs. Add `Element.prototype.hasPointerCapture ??= () => false; Element.prototype.scrollIntoView ??= () => {};` at the top of the test if the option click fails for that reason.

- [ ] **Step 2: Run to verify it fails** — `P exec vp test --run src/components/calendar/calendar-grid/resources.test.tsx`. Expected: FAIL (`CalendarGrid.ResourceFilter` undefined, no `data-calendar-column`).
- [ ] **Step 3: Implement.**
  - **CalendarGrid.tsx:** add the types and props listed above. Add state `internalResourceFilter` (controlled/uncontrolled, same pattern as `viewMode`). Put `resources ?? []`, `resourceFilter` and `setResourceFilter` in the context. Compute `slotCoverageDates` as `slots ? slotDates(slots) : new Set()`. Register `CalendarGrid.ResourceFilter = CalendarGridChrome.ResourceFilter`.
  - **Chrome `ResourceFilter`:**

```tsx
const ALL = '__all__';
const ResourceFilter: FC = () => {
  const { t } = useAppTranslation('common');
  const { resources, resourceFilter, setResourceFilter, view } = useCalendarGridContext();
  if (view !== 'week' || resources.length === 0) return null;
  return (
    <Select value={resourceFilter ?? ALL} onValueChange={(value) => setResourceFilter(value === ALL ? null : value)}>
      <Select.Trigger size="sm" aria-label={t('calendar.resource')} className="w-48"><Select.Value /></Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL}>{t('calendar.allResources')}</Select.Item>
        {resources.map((resource) => <Select.Item key={resource.id} value={resource.id}>{resource.label}</Select.Item>)}
      </Select.Content>
    </Select>
  );
};
```

  - **`ResourceHeader`:** the same container classes as `CalendarTimeGrid.Header`. Holds an `Avatar size="sm"` with `Avatar.Image src` (when `avatar` is set) and `Avatar.Fallback` showing the initials, followed by `<span className="text-fg truncate text-sm font-medium">{label}</span>`.
  - Move the placement functions to `placement.ts`. Rewrite Day and Week as `TimeGrid` over columns (layout above).
- [ ] **Step 4: Run** the new test and the existing `CalendarGrid.test.tsx` / `CalendarTimeGrid.test.tsx`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(calendar): resource columns, resource-keyed availability and a week resource filter`

---

### Task 3: All-day row

**Files:**
- Create: `calendar-grid-time-view/AllDayRow.tsx`
- Modify: `CalendarGridTimeView.tsx` (render `<AllDayRow columns={columns} resourceMode={…} />` in the sticky header)
- Locales: `calendar.allDay` "All day" / "طوال اليوم"
- Test: `calendar-grid/allday.test.tsx`

**Interfaces:**
- Consumes: `packLanes`, `dayKeyOf`, `lastDayKeyOf`, `spansDays`, `GridColumn`, context `events`, `eventAccessors`, `renderEvent`, `popoverContent`.
- Produces: `isAllDayEvent(event, accessors)` exported from `AllDayRow.tsx`. It is used by the time view filter and by the agenda.

Behaviour:
- **Which events:** an event goes in the row when `accessors.isAllDay?.(event)` is true or `spansDays(start, end)`.
- **Columns covered:** the visible columns where `dayKeyOf(start) <= column.dayKey <= lastDayKeyOf(start, end)` and the resource matches (when the column has one). The event runs from the first such column to the last (`startCol`, `endCol`).
- **Packing:** `packLanes`. When `laneCount <= 3`, show every lane. Otherwise show lanes 0–1, and give each column a "+N more" `Popover` in row 3 for the hidden spans that cover it.
- **Layout:** a CSS grid, `gridTemplateColumns: repeat(n, minmax(${resourceMode ? '11rem' : '0'}, 1fr))`. Each item sits at `gridColumn: `${startCol + 1} / ${endCol + 2}``, `gridRow: lane + 1`. Grid placement follows `dir`, so RTL mirrors for free.
- **Label cell:** a `w-16` cell, `sticky start-0`, reading `t('calendar.allDay')`.
- **No row** when there are no all-day events.
- **Item:** a `CalendarMonthGrid.EventChip` containing an sr-only date (`FULL_MONTH_DAY_YEAR`) plus `renderEvent`. It wraps in a `Popover` when `popoverContent` is set, the same way `MonthEventItem` does.

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarGrid } from '@components/calendar';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

type Item = { id: string; start: string; end: string; title: string; allDay?: boolean };
const accessors = { getId: (i: Item) => i.id, getStartTime: (i: Item) => i.start, getEndTime: (i: Item) => i.end, isAllDay: (i: Item) => !!i.allDay };

const renderWeek = (events: Item[]) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid initialView="week" initialDate="2026-10-14" events={events} eventAccessors={accessors} startHour={8} endHour={12}>
        <CalendarGrid.EventTemplate<Item>>{(item) => item.title}</CalendarGrid.EventTemplate>
        <CalendarGrid.WeekView />
      </CalendarGrid>
    </Tooltip.Provider>,
  );

const strip = () => document.querySelector('[data-slot="calendar-grid-all-day"]') as HTMLElement;

describe('CalendarGrid all-day row', () => {
  it('shows flagged and multi-day events in the strip, not the time grid', () => {
    renderWeek([
      { id: 'a', start: '2026-10-12T00:00:00', end: '2026-10-13T00:00:00', title: 'Holiday', allDay: true },
      { id: 'b', start: '2026-10-14T22:00:00', end: '2026-10-16T02:00:00', title: 'Conference' },
      { id: 'c', start: '2026-10-14T09:00:00', end: '2026-10-14T10:00:00', title: 'Visit' },
    ]);
    expect(within(strip()).getByText('All day')).toBeTruthy();
    expect(within(strip()).getByText('Holiday')).toBeTruthy();
    const conference = within(strip()).getByText('Conference').closest('[data-slot="calendar-grid-all-day-item"]') as HTMLElement;
    expect(conference.style.gridColumn).toBe('4 / 7');
    expect(within(strip()).queryByText('Visit')).toBeNull();
    expect(document.querySelectorAll('[data-calendar-column] [data-slot="calendar-time-grid-event-card"]')).toHaveLength(1);
  });

  it('collapses more than three lanes into +N more per day', async () => {
    const day = (id: string) => ({ id, start: '2026-10-14T00:00:00', end: '2026-10-15T00:00:00', title: `Item ${id}`, allDay: true });
    renderWeek(['1', '2', '3', '4'].map(day));
    expect(within(strip()).getAllByText(/^Item /)).toHaveLength(2);
    fireEvent.click(within(strip()).getByRole('button', { name: '+2 more' }));
    expect(await screen.findByText('Item 4')).toBeTruthy();
  });

  it('renders no strip without all-day events', () => {
    renderWeek([{ id: 'c', start: '2026-10-14T09:00:00', end: '2026-10-14T10:00:00', title: 'Visit' }]);
    expect(strip()).toBeNull();
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL (no strip).
- [ ] **Step 3: Implement** `AllDayRow.tsx` as described. Filter the time-view columns with `!isAllDayEvent`.
- [ ] **Step 4: Run** the calendar tests. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(calendar): all-day row with lane packing and +N more`

---

### Task 4: Agenda view

**Files:**
- Create: `calendar-grid/calendar-grid-agenda-view/CalendarGridAgendaView.tsx`, `index.ts`
- Modify: `CalendarGrid.tsx` (prop `agendaDays = 7`; the agenda range is `date .. date + agendaDays - 1`; `navigationLabel` is `${formatDate(start, DAY_SHORT_MONTH)} – ${formatDate(end, DAY_SHORT_MONTH)}`; next/prev step by `agendaDays` days; `CalendarGrid.AgendaView`)
- Modify: `CalendarGridChrome.tsx` (`ViewTabs` takes `views?: CalendarView[]`, default `['day', 'week', 'month']`)
- Locales: `calendar.agenda` "Agenda" / "جدول الأعمال"; `calendar.agendaEmpty` "Nothing scheduled" / "لا توجد مواعيد"; `calendar.agendaEmptyHint` "There are no events in these days." / "لا توجد أحداث في هذه الأيام."
- Test: `calendar-grid/agenda.test.tsx`

**Interfaces:**
- Consumes: `dayKeysBetween`, `dayKeyOf`, `lastDayKeyOf`, `isAllDayEvent`, context `resources`, `eventAccessors.getResourceId`.
- Produces: `CalendarGrid.AgendaView`; `ViewTabs` `views` prop.

Agenda markup:
- **Container:** `data-slot="calendar-grid-agenda"`, scrolls on the y axis.
- **One `<section aria-labelledby>` per day that has events.** Its `<h3>` is sticky at the top, styled `bg-surface text-fg-muted border-border-subtle border-b px-4 py-2 text-xs font-semibold`, and reads `Today · Fri, Oct 16` for today or `Fri, Oct 16` otherwise.
- **Rows:** a `<ul>` with one `<li>` per event, in a grid of three parts:
  - **time:** `w-32 shrink-0 text-fg-muted text-xs tabular-nums`, either `<bdi dir="ltr">9:00 AM – 9:30 AM</bdi>` or `All day`
  - **`renderEvent`**
  - **resource label:** `text-fg-muted text-xs`, when there is one
- **Popover:** when `popoverContent` is set, the row content is a `<button>` trigger.
- **Empty range:** `<EmptyState kind="first-use" size="sm" title=… description=… />`.
- **Ordering:** events sort by start. A multi-day event appears under each day it touches.
- **When it renders:** only when `view === 'agenda' && viewMode === 'calendar'`. The month, day and week views keep returning null for `agenda`.

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { CalendarGrid } from '@components/calendar';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  await act(() => i18n.changeLanguage('en'));
});

type Visit = { id: string; start: string; end: string; patient: string; doctor?: string };
const accessors = { getId: (v: Visit) => v.id, getStartTime: (v: Visit) => v.start, getEndTime: (v: Visit) => v.end, getResourceId: (v: Visit) => v.doctor };
const visits: Visit[] = [
  { id: '2', start: '2026-10-16T11:00:00', end: '2026-10-16T11:30:00', patient: 'Omar Khalil' },
  { id: '1', start: '2026-10-16T09:00:00', end: '2026-10-16T09:30:00', patient: 'Sara Haddad', doctor: 'haddad' },
  { id: '3', start: '2026-10-19T10:00:00', end: '2026-10-19T10:30:00', patient: 'Lina Nasser' },
  { id: '4', start: '2026-10-30T10:00:00', end: '2026-10-30T10:30:00', patient: 'Far Away' },
];

const renderAgenda = (events = visits, onRangeChange = vi.fn()) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid initialView="agenda" initialDate="2026-10-16" events={events} eventAccessors={accessors} resources={[{ id: 'haddad', label: 'Dr. Haddad' }]} onRangeChange={onRangeChange}>
        <CalendarGrid.Header>
          <CalendarGrid.Navigation />
          <CalendarGrid.ViewTabs views={['day', 'week', 'month', 'agenda']} />
        </CalendarGrid.Header>
        <CalendarGrid.EventTemplate<Visit>>{(visit) => visit.patient}</CalendarGrid.EventTemplate>
        <CalendarGrid.AgendaView />
        <CalendarGrid.MonthView />
      </CalendarGrid>
    </Tooltip.Provider>,
  );

describe('CalendarGrid agenda', () => {
  it('lists the next seven days grouped by day, sorted, skipping empty days', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 8));
    renderAgenda();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Today · Fri, Oct 16', 'Mon, Oct 19']);
    const items = [...document.querySelectorAll('[data-slot="calendar-grid-agenda"] li')].map((li) => li.textContent);
    expect(items[0]).toContain('Sara Haddad');
    expect(items[0]).toContain('Dr. Haddad');
    expect(items[0]).toContain('9:00 AM – 9:30 AM');
    expect(items[1]).toContain('Omar Khalil');
    expect(screen.queryByText('Far Away')).toBeNull();
  });

  it('pages by agendaDays and reports the range', () => {
    const onRangeChange = vi.fn();
    renderAgenda(visits, onRangeChange);
    expect(onRangeChange).toHaveBeenLastCalledWith({ startDate: '2026-10-16', endDate: '2026-10-22' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onRangeChange).toHaveBeenLastCalledWith({ startDate: '2026-10-23', endDate: '2026-10-29' });
  });

  it('shows an empty state for an empty range', () => {
    renderAgenda([]);
    expect(screen.getByText('Nothing scheduled')).toBeTruthy();
  });

  it('adds an Agenda tab only when asked, in both languages', async () => {
    renderAgenda();
    expect(screen.getByRole('tab', { name: 'Agenda' })).toBeTruthy();
    cleanup();
    await act(() => i18n.changeLanguage('ar'));
    renderAgenda();
    expect(screen.getByRole('tab', { name: 'جدول الأعمال' })).toBeTruthy();
  });
});
```

Add to `CalendarGrid.test.tsx`: `it('keeps the default tabs without Agenda')` — the existing `renderGrid('month')` has 3 tabs: `expect(screen.getAllByRole('tab')).toHaveLength(3)`.

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** as described. `VIEW_TO_UNIT` becomes a step function: agenda → `addDuration(date, agendaDays, DAY)`.
- [ ] **Step 4: Run** all calendar tests. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(calendar): agenda view with day groups, empty state and opt-in Agenda tab`

---

### Task 5: Create, move and resize with the pointer

**Files:**
- Create: `calendar-grid-time-view/useTimeGridGestures.ts`
- Modify: `CalendarGrid.tsx`:
  - props `onSlotSelect?`, `allowOutsideAvailability?`, `onEventChange?`, `canEdit?`
  - overrides plus `commitChange`
  - `announce` and a live region `<div aria-live="polite" className="sr-only" data-slot="calendar-grid-announcer">`
- Modify: `CalendarGridTimeView.tsx` (pointer handlers, draft ghost, resize handle, click suppression, open cells when `onSlotSelect` and no slots)
- Locales:

  | Key | English | Arabic |
  |---|---|---|
  | `calendar.timeRange` | "{{start}} to {{end}}" | "من {{start}} إلى {{end}}" |
  | `calendar.moved` | "Moved to {{when}}" | "نُقل إلى {{when}}" |
  | `calendar.resized` | "Resized to {{when}}" | "تغيّرت المدة إلى {{when}}" |
  | `calendar.cancelled` | "Change cancelled" | "أُلغي التغيير" |
  | `calendar.changeFailed` | "Couldn't save the change" | "تعذّر حفظ التغيير" |
  | `calendar.changeFailedHint` | "The event is back where it was." | "أُعيد الحدث إلى مكانه." |
  | `calendar.unavailable` | "unavailable" | "غير متاح" |

- Test: `calendar-grid/create.test.tsx`, `calendar-grid/move.test.tsx`

**Interfaces:**
- Produces (types in `CalendarGrid.tsx`, exported from `index.ts`):
  - `CalendarSlot = { start: string; end: string; resourceId?: string }`
  - `CalendarEventChange<T> = { event: T; start: string; end: string; resourceId?: string }`
- Context:
  - `onSlotSelect?: (slot: CalendarSlot) => void`
  - `allowOutsideAvailability: boolean`
  - `isEditable: (event) => boolean`, defined as `!!onEventChange && (canEdit?.(event) ?? true)`
  - `commitChange(change): Promise<void>`
  - `announce(message: string): void`
  - `slotsRaw: CalendarSlots | null | undefined`
- `useTimeGridGestures(columns: GridColumn[], scrollerRef)` returns:
  - `draft: Draft | null`, where `type Draft = { kind: 'create' | 'move' | 'resize'; columnIndex: number; start: number; end: number; eventId?: string; via: 'pointer' | 'keyboard'; allowed: boolean }`
  - `onColumnPointerDown(e, columnIndex)`
  - `onEventPointerDown(e, event, columnIndex)`
  - `shouldSuppressClick(): boolean`
  - `onEventKeyDown(e, event, columnIndex)` (Task 6)
  - `onCellKeyDown(e, columnIndex, row)`, `focusedCell`, `setFocusedCell` (Task 6)
  - `describe(columnIndex, start, end): string` — "Fri, Oct 16, 10:30 AM to 11:00 AM, Dr. Haddad"

Gesture rules:
- **Pointer down:**
  - only primary-button presses count (`e.button === 0`)
  - `setPointerCapture` sits in a try/catch
  - listeners for `pointermove`, `pointerup`, `pointercancel` and `keydown` (Escape) go on `window` and are removed on finish and on unmount
- **Activation:** a drag starts once the pointer moves at least `DRAG_THRESHOLD_PX` from the press point. Before that, nothing is drawn.
- **Create:**
  - the column `onPointerDown` ignores targets inside `[data-slot="calendar-time-grid-event-card"]`
  - the anchor is the minute at the press
  - the draft stays in the press column: `createRange(anchor, minute)`
  - on release, a drag or a click (one step) calls `onSlotSelect({ start: wallTime(dayKey, start), end: wallTime(dayKey, end), resourceId })` only when allowed. Allowed means `allowOutsideAvailability`, or `slotRangesFor` is null, or `isWithin(...)`.
  - the ghost uses `border-danger bg-danger-subtle` when not allowed and `border-accent bg-accent-subtle` otherwise. No side stripes: the border runs on all sides.
- **Move:**
  - starts from a pointer down on an editable card that isn't on `[data-resize-handle]`
  - `grab = minuteAtPress - minuteOfDay(start)` and `duration = minuteOfDay(end) - minuteOfDay(start)`
  - the column follows the pointer: `columnAt`, keeping the last column when the result is -1
  - `moveRange`
- **Resize:** starts from the handle `<span data-resize-handle aria-hidden className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" />`, rendered inside editable cards, and uses `resizeRange` in the event's column.
- **Commit on release (move and resize):**
  - the new resource is `columns[i].resourceId ?? getResourceId?.(event)`
  - no-op when nothing changed
  - otherwise `commitChange({ event, start: wallTime(...), end: wallTime(...), resourceId })` and `announce(t('calendar.moved' | 'calendar.resized', { when: describe(...) }))`
  - after a real drag, set `suppressClick` for one tick (`setTimeout(0)`). The card's `onClick` calls `e.preventDefault()` and returns while it is set, which stops the Radix trigger from opening.
- **Escape** cancels, clears the draft and announces `calendar.cancelled`.
- **Auto-scroll:** when the pointer is within 32 px of the scroller's top or bottom, a requestAnimationFrame loop moves `scrollTop` by ±12 and recomputes the draft from the last pointer position. It stops on leaving the edge or on finish.
- **While dragging:** the original card gets `opacity-50`. The draft renders as a ghost in its column at `top/height %`, labelled `<bdi dir="ltr">10:30 AM – 11:15 AM</bdi>` (`text-2xs tabular-nums`).
- **Touch:** editable cards add `touch-none`.
- **Overrides (root):**

```ts
type Override = { start: string; end: string; resourceId?: string; settled: boolean };
const [overrides, setOverrides] = useState<Record<string, Override>>({});
useEffect(() => setOverrides((current) => Object.fromEntries(Object.entries(current).filter(([, o]) => !o.settled))), [rawEvents]);
const accessors = useMemo(() => {
  if (Object.keys(overrides).length === 0) return eventAccessors;
  const find = (event: TEvent) => overrides[eventAccessors.getId(event)];
  return {
    ...eventAccessors,
    getStartTime: (event: TEvent) => find(event)?.start ?? eventAccessors.getStartTime(event),
    getEndTime: (event: TEvent) => find(event)?.end ?? eventAccessors.getEndTime(event),
    getResourceId: (event: TEvent) => { const o = find(event); return o ? o.resourceId : eventAccessors.getResourceId?.(event); },
  };
}, [eventAccessors, overrides]);
const commitChange = useCallback(async (change: CalendarEventChange<TEvent>) => {
  const id = eventAccessors.getId(change.event);
  setOverrides((current) => ({ ...current, [id]: { start: change.start, end: change.end, resourceId: change.resourceId, settled: false } }));
  try {
    await onEventChange?.(change);
    setOverrides((current) => (current[id] ? { ...current, [id]: { ...current[id], settled: true } } : current));
  } catch {
    setOverrides(({ [id]: _dropped, ...rest }) => rest);
    toast({ title: t('calendar.changeFailed'), description: t('calendar.changeFailedHint'), tone: 'danger' });
  }
}, [eventAccessors, onEventChange, t]);
```

The context's `eventAccessors` becomes `accessors`. The unparseable-date filter still runs on the raw accessors.

- [ ] **Step 1: Write the failing tests**

`create.test.tsx` (uses `stubLayout` above; day view, `startHour={8} endHour={16} stepMinutes={30}`, `initialDate="2026-10-16"`):

```tsx
it('clicking an empty cell selects one step', () => {
  const onSlotSelect = vi.fn();
  renderDay({ onSlotSelect });
  const col = document.querySelector('[data-calendar-column]') as HTMLElement;
  fireEvent.pointerDown(col, { button: 0, pointerId: 1, clientX: 150, clientY: 210 });   // 10:06
  fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 210 });
  expect(onSlotSelect).toHaveBeenCalledWith({ start: wallTime('2026-10-16', 600), end: wallTime('2026-10-16', 630), resourceId: undefined });
});

it('dragging draws a snapped ghost with a live label and selects the range', () => {
  const onSlotSelect = vi.fn();
  renderDay({ onSlotSelect });
  const col = document.querySelector('[data-calendar-column]') as HTMLElement;
  fireEvent.pointerDown(col, { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
  fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 330 });          // 11:18
  expect(document.querySelector('[data-slot="calendar-grid-draft"]')?.textContent).toBe('10:00 AM – 11:30 AM');
  fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 330 });
  expect(onSlotSelect).toHaveBeenCalledWith(expect.objectContaining({ start: wallTime('2026-10-16', 600), end: wallTime('2026-10-16', 690) }));
  expect(document.querySelector('[data-slot="calendar-grid-draft"]')).toBeNull();
});

it('refuses unavailable cells unless allowOutsideAvailability', () => {
  const onSlotSelect = vi.fn();
  const slots = { '2026-10-16': [{ startTime: '08:00', endTime: '09:00' }] };
  renderDay({ onSlotSelect, slots });
  const col = document.querySelector('[data-calendar-column]') as HTMLElement;
  fireEvent.pointerDown(col, { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
  fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 210 });
  expect(onSlotSelect).not.toHaveBeenCalled();
  cleanup();
  renderDay({ onSlotSelect, slots, allowOutsideAvailability: true });
  const again = document.querySelector('[data-calendar-column]') as HTMLElement;
  fireEvent.pointerDown(again, { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
  fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 210 });
  expect(onSlotSelect).toHaveBeenCalledOnce();
});

it('Escape cancels a drag', () => {
  const onSlotSelect = vi.fn();
  renderDay({ onSlotSelect });
  const col = document.querySelector('[data-calendar-column]') as HTMLElement;
  fireEvent.pointerDown(col, { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
  fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 330 });
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 330 });
  expect(onSlotSelect).not.toHaveBeenCalled();
});

it('selects in the resource column it started in', () => {
  const onSlotSelect = vi.fn();
  renderDay({ onSlotSelect, resources: [{ id: 'haddad', label: 'Dr. Haddad' }, { id: 'khalil', label: 'Dr. Khalil' }] });
  const second = document.querySelector('[data-calendar-column][data-resource="khalil"]') as HTMLElement;
  fireEvent.pointerDown(second, { button: 0, pointerId: 1, clientX: 350, clientY: 210 });
  fireEvent.pointerUp(window, { pointerId: 1, clientX: 350, clientY: 210 });
  expect(onSlotSelect).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'khalil' }));
});
```

`move.test.tsx`: one event, 09:00–10:00, in a resource day view with two columns. `onEventChange` is a `vi.fn` returning a promise you control, and a `PopoverTemplate` renders "Details".

```tsx
it('a short press opens the popover instead of moving', async () => { /* pointerDown at the card (150, 120), pointerUp at (151, 121), then fireEvent.click(card) → findByText('Details'); onEventChange not called */ });

it('drags the body to another time and resource, keeping the duration, optimistically', async () => {
  // pointerDown on card at (150, 110) → grab 10 min; move to (350, 410) → 12:00-ish snapped: start 11:00? compute: minute at 410 = 480+410/800*480 = 726 → 726-6(grab at 110→546, grab=6)=720 → 12:00 snapped to 30 → 720; end 780.
  // expect ghost text '12:00 PM – 1:00 PM' (endHour must be ≥ 14 in this test: use startHour 8, endHour 16 → 800px = 480 min → 0.6px/min).
  // pointerUp → onEventChange called with { event, start: wallTime(day, 720), end: wallTime(day, 780), resourceId: 'khalil' }
  // card is now inside the khalil column before the promise resolves; the next click on it does NOT open the popover.
});

it('reverts with a danger toast when onEventChange rejects, and can drag again', async () => { /* render <Toaster />; reject → card back in haddad column; findByText("Couldn't save the change"); drag again → onEventChange called twice */ });

it('resizes from the bottom handle, at least one step', () => { /* pointerDown on [data-resize-handle] (150, 200) → move (150, 240) → end snaps; onEventChange end > start */ });

it('keeps the last column and clamps the time when the drop is outside the grid', () => { /* move to (5000, -300) → start = 08:00 in the last column hovered */ });

it('locks events that canEdit refuses', () => { /* canEdit={() => false}: pointerDown + move → no ghost, no onEventChange; card has no resize handle */ });
```

Write these out in full in the test file with exact coordinates. The layout stub maps 800 px to `startHour..endHour`, so with 8–16 that is 0.6 min/px.

- [ ] **Step 2: Run** both files — Expected: FAIL.
- [ ] **Step 3: Implement** the root additions, then `useTimeGridGestures`, then the view wiring (rules above).
- [ ] **Step 4: Run** all calendar tests. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(calendar): create, move and resize with pointer events, optimistic save and revert`

---

### Task 6: Keyboard — cells and event moves

**Files:**
- Modify: `useTimeGridGestures.ts`, `CalendarGridTimeView.tsx`
- Locales: `calendar.moving` "Moving. Arrow keys change the time and day, Enter saves, Escape cancels." / "نقل الحدث. تغيّر الأسهم الوقت واليوم، Enter للحفظ وEscape للإلغاء."; `calendar.resizing` "Resizing. Arrow keys change the end time, Enter saves, Escape cancels." / "تغيير المدة. تغيّر الأسهم وقت الانتهاء، Enter للحفظ وEscape للإلغاء."
- Test: `calendar-grid/keyboard.test.tsx`

Behaviour:
- **Editable cards:**
  - `aria-keyshortcuts="M R"`
  - `M` (`e.key.toLowerCase() === 'm' || e.code === 'KeyM'`) starts a keyboard move draft at the event's position and announces `calendar.moving`. `R` starts a resize the same way and announces `calendar.resizing`.
  - While a keyboard draft is active for the card:
    - ArrowUp/ArrowDown change the start by ±step (move) or the end by ±step (resize), clamped
    - ArrowLeft/ArrowRight change the column by ∓1/±1 (move only). In RTL (`getComputedStyle(card).direction === 'rtl'`) they are swapped, so the visual direction holds.
    - each change announces `describe(...)`
    - Enter (with `preventDefault`, so the popover stays closed) commits through the Task 5 commit path
    - Escape cancels and announces `calendar.cancelled`
    - all of these call `preventDefault`
  - The original card stays mounted (dimmed) and keeps focus. After a commit, focus moves to the card with `data-event-id` (a `useLayoutEffect` with a pending-focus ref).
- **Cells (only when `onSlotSelect` is set):**
  - `role="button"`, with `aria-label` = `describe`-style `Fri, Oct 16, 10:30 AM, Dr. Haddad`, plus `, unavailable` when refused
  - `aria-disabled` when refused
  - roving `tabIndex`: one cell is 0 (initially the first allowed cell of column 0), the rest −1
  - arrows move focus by row and column, mirrored in RTL
  - Enter or Space selects that one step (allowed only)
  - when `onSlotSelect` is unset, cells stay `aria-hidden` with no tabIndex, as today

- [ ] **Step 1: Write the failing tests**

```tsx
it('moves an event with M, arrows and Enter, announcing each step', async () => {
  // resource day view (haddad, khalil), event 09:00–10:00 in haddad, step 30
  const card = screen.getByText('Sara Haddad').closest('button')!;
  card.focus();
  fireEvent.keyDown(card, { key: 'm', code: 'KeyM' });
  expect(announcer().textContent).toContain('Moving');
  fireEvent.keyDown(card, { key: 'ArrowDown' });
  fireEvent.keyDown(card, { key: 'ArrowRight' });
  expect(announcer().textContent).toBe('Fri, Oct 16, 9:30 AM to 10:30 AM, Dr. Khalil');
  fireEvent.keyDown(card, { key: 'Enter' });
  expect(onEventChange).toHaveBeenCalledWith(expect.objectContaining({ start: wallTime('2026-10-16', 570), end: wallTime('2026-10-16', 630), resourceId: 'khalil' }));
  expect(screen.queryByText('Details')).toBeNull();
  await waitFor(() => expect(document.activeElement?.textContent).toContain('Sara Haddad'));
});

it('mirrors left and right in Arabic and accepts M by key code', async () => {
  await act(() => i18n.changeLanguage('ar'));
  // render inside <div dir="rtl">; stub getComputedStyle direction via the dir attribute (happy-dom resolves `direction` from dir)
  fireEvent.keyDown(card, { key: 'ة', code: 'KeyM' });
  fireEvent.keyDown(card, { key: 'ArrowLeft' });
  fireEvent.keyDown(card, { key: 'Enter' });
  expect(onEventChange).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'khalil' }));
});

it('resizes with R and Escape cancels without saving', () => {
  fireEvent.keyDown(card, { key: 'r', code: 'KeyR' });
  fireEvent.keyDown(card, { key: 'ArrowUp' });               // would shrink below one step → stays 30 min
  fireEvent.keyDown(card, { key: 'Escape' });
  expect(onEventChange).not.toHaveBeenCalled();
  expect(announcer().textContent).toBe('Change cancelled');
});

it('reaches empty cells with one tab stop and arrow keys; Enter selects one step', () => {
  const cells = () => [...document.querySelectorAll('[data-calendar-column] [role="button"][data-slot="calendar-time-grid-cell"]')] as HTMLElement[];
  expect(cells().filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
  const first = cells().find((cell) => cell.tabIndex === 0)!;
  first.focus();
  fireEvent.keyDown(first, { key: 'ArrowDown' });
  expect(document.activeElement?.getAttribute('aria-label')).toBe('Fri, Oct 16, 8:30 AM, Dr. Haddad');
  fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
  expect(onSlotSelect).toHaveBeenCalledWith({ start: wallTime('2026-10-16', 510), end: wallTime('2026-10-16', 540), resourceId: 'haddad' });
});

it('leaves cells hidden from assistive tech without onSlotSelect', () => {
  // render without onSlotSelect
  expect(document.querySelector('[data-slot="calendar-time-grid-cell"]')?.getAttribute('aria-hidden')).toBe('true');
});
```

If happy-dom doesn't resolve `direction` from an ancestor's `dir`, the hook reads `card.closest('[dir]')?.getAttribute('dir') === 'rtl'` instead. That gives the same result in browsers that set `dir` on `<html>`, which `DirectionProvider` and i18n do.

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** in the hook and the view. `CalendarTimeGrid.Cell` already spreads props, so the hidden attribute can be overridden: pass `aria-hidden={undefined}` when the cell is interactive.
- [ ] **Step 4: Run** all calendar tests. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(calendar): keyboard move/resize and roving slot cells with polite announcements`

---

### Task 7: Docs page

**Files:**
- Create: `src/component-docs/calendar/CalendarScheduler.mdx`
- Modify: `src/component-docs/calendar/CalendarGrid.mdx` — one line under the intro pointing to the scheduler page.

Frontmatter: `id: calendar-scheduler`, `title: Scheduler`, `section: Components`, `category: Calendar`, plus a description and tags.

Demos (`demoSource('SchedulerDemo', pageSource)` etc.):
1. **SchedulerDemo** (titled "Clinic day"):
   - **Resources:** three doctors with initials avatars; resource-keyed slots for today (8–12, 13–17).
   - **Events:** about eight visits today, one all-day "Clinic audit" event, and a past visit locked by `canEdit={(e) => new Date(e.end) > new Date()}`.
   - **Create:** `onSlotSelect` adds a "New visit" event to state.
   - **Edit:** `onEventChange` waits 500 ms and then updates state. A visit whose patient is "Fail Demo" rejects, to show the revert.
   - **Chrome:** Navigation, `ViewTabs views={['day','week','month','agenda']}`, ResourceFilter. A `PopoverTemplate` shows the patient, the time and the doctor.
2. **AgendaDemo** (titled "Agenda"): the same data, `initialView="agenda"`.

Sections: Resources, Creating events, Moving and resizing (optimistic save, revert), Keyboard, All-day events, Agenda, API (PropsTable for the new CalendarGrid props: `resources`, `resourceFilter`, `onResourceFilterChange`, `onSlotSelect`, `allowOutsideAvailability`, `onEventChange`, `canEdit`, `agendaDays`, accessors `getResourceId`/`isAllDay`, `ViewTabs views`), Accessibility, RTL notes.

- [ ] **Step 1:** Write the page. Clear the vitest/vite caches, then run `P docs:lint` and `P exec vp test --run tests/docs src/component-docs`. Expected: PASS (render-all includes the new page).
- [ ] **Step 2: Commit** — `docs(calendar): Scheduler page — resources, create, move, keyboard, all-day, agenda`

---

### Task 8: Exit — gate and browser check

- [ ] **Step 1: Full gate:** `P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && P docs:lint && P exec vp test --run src tests && P exec vp build`. Then grep `dist/assets` for `frontmatter`, `DocsLayout`, `recharts` → 0 each. Expected: all green, baseline `{}`.
- [ ] **Step 2: Browser check** on the dev server (:5199, page `/docs/calendar-scheduler`), with playwright scripts in the scratchpad:
  - **1440 px:**
    - drag to create a slot; it appears
    - drag a visit to another doctor; it moves and saves
    - drag "Fail Demo"; it reverts with a toast
    - keyboard M + arrows + Enter
    - screenshots in light and dark
  - **390 px with touch emulation (`hasTouch`, `isMobile`):** the resource columns scroll horizontally while the axis stays pinned, tapping a slot creates, and a touch drag on a card moves it. Screenshot.
  - **Arabic at 1440 px:** columns and the all-day row mirror. Screenshot.
  Fix anything found under TDD before committing.
- [ ] **Step 3: Commit** — `test(calendar): Plan D exit — gate and browser check`
