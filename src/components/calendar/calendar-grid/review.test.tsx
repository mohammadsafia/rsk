// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { CalendarGrid, type CalendarEventChange } from '@components/calendar';
import { Toaster } from '@components/shared';
import { Tooltip } from '@components/ui';

import { wallTime } from './scheduling';
import { at, stubLayout } from './test-utils/layout';

import '../../../i18n';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type Visit = { id: string; start: string; end: string; patient: string; doctor: string };
type Change = (change: CalendarEventChange<Visit>) => Promise<void>;

const accessors = {
  getId: (v: Visit) => v.id,
  getStartTime: (v: Visit) => v.start,
  getEndTime: (v: Visit) => v.end,
  getResourceId: (v: Visit) => v.doctor,
};
const resources = [
  { id: 'haddad', label: 'Dr. Haddad' },
  { id: 'khalil', label: 'Dr. Khalil' },
];

const renderDay = (visit: Visit, onEventChange: Change, { startHour = 8, endHour = 16 } = {}) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid
        initialView="day"
        initialDate="2026-10-16"
        events={[visit]}
        eventAccessors={accessors}
        resources={resources}
        startHour={startHour}
        endHour={endHour}
        stepMinutes={30}
        onEventChange={onEventChange}
      >
        <CalendarGrid.EventTemplate<Visit>>{(v) => v.patient}</CalendarGrid.EventTemplate>
        <CalendarGrid.DayView />
      </CalendarGrid>
      <Toaster />
    </Tooltip.Provider>,
  );

const card = () => screen.getByText('Sara Haddad').closest('button') as HTMLElement;
const nineToTen: Visit = { id: '1', start: '2026-10-16T09:00:00', end: '2026-10-16T10:00:00', patient: 'Sara Haddad', doctor: 'haddad' };

const drag = (from: { clientX: number; clientY: number }, to: { clientX: number; clientY: number }) => {
  fireEvent.pointerDown(card(), { button: 0, pointerId: 1, ...from });
  fireEvent.pointerMove(window, { pointerId: 1, ...to });
  fireEvent.pointerUp(window, { pointerId: 1, ...to });
};

describe('events ending at midnight', () => {
  const lateShift: Visit = { id: '1', start: '2026-10-16T22:00:00', end: '2026-10-17T00:00:00', patient: 'Sara Haddad', doctor: 'haddad' };

  it('keeps the duration when dragged', () => {
    stubLayout();
    const onEventChange = vi.fn<Change>(async () => {});
    renderDay(lateShift, onEventChange, { startHour: 8, endHour: 24 });
    // 8–24 over 800px = 1.2 min/px: 22:10 is y≈708, 20:10 is y≈608.
    drag({ clientX: 150, clientY: (1330 - 480) / 1.2 }, { clientX: 150, clientY: (1210 - 480) / 1.2 });
    expect(onEventChange).toHaveBeenCalledWith(
      expect.objectContaining({ start: wallTime('2026-10-16', 1200), end: wallTime('2026-10-16', 1320) }),
    );
  });

  it('saves nothing for a keyboard move committed without changes, and keeps the duration with arrows', () => {
    const onEventChange = vi.fn<Change>(async () => {});
    renderDay(lateShift, onEventChange, { startHour: 8, endHour: 24 });
    card().focus();
    fireEvent.keyDown(card(), { key: 'm', code: 'KeyM' });
    fireEvent.keyDown(card(), { key: 'Enter' });
    expect(onEventChange).not.toHaveBeenCalled();

    fireEvent.keyDown(card(), { key: 'm', code: 'KeyM' });
    fireEvent.keyDown(card(), { key: 'ArrowUp' });
    fireEvent.keyDown(card(), { key: 'Enter' });
    expect(onEventChange).toHaveBeenCalledWith(
      expect.objectContaining({ start: wallTime('2026-10-16', 1290), end: wallTime('2026-10-16', 1410) }),
    );
  });
});

describe('overlapping saves', () => {
  it('shows the latest change when an earlier one rejects, and keeps it once it saves', async () => {
    stubLayout();
    const pending: { resolve: () => void; reject: (error: Error) => void }[] = [];
    const onEventChange = vi.fn<Change>(() => new Promise<void>((resolve, reject) => pending.push({ resolve, reject })));
    renderDay(nineToTen, onEventChange);

    drag(at(0, 546), at(0, 726)); // → 12:00
    drag(at(0, 726), at(0, 846)); // → 14:00, while the first is still pending
    expect(card().style.top).toBe('75%');

    await act(async () => pending[0].reject(new Error('conflict')));
    expect(card().style.top).toBe('75%');
    await act(async () => pending[1].resolve());
    expect(card().style.top).toBe('75%');
  });

  it('falls back to the earlier saved change when the later one rejects', async () => {
    stubLayout();
    const pending: { resolve: () => void; reject: (error: Error) => void }[] = [];
    const onEventChange = vi.fn<Change>(() => new Promise<void>((resolve, reject) => pending.push({ resolve, reject })));
    renderDay(nineToTen, onEventChange);

    drag(at(0, 546), at(0, 726)); // → 12:00 (top 50%)
    drag(at(0, 726), at(0, 846)); // → 14:00
    await act(async () => pending[0].resolve());
    await act(async () => pending[1].reject(new Error('conflict')));
    expect(card().style.top).toBe('50%');
  });
});

describe('keyboard focus after a rejected save', () => {
  it('keeps focus on the event when it goes back', async () => {
    const onEventChange = vi.fn<Change>(async () => {
      throw new Error('conflict');
    });
    renderDay(nineToTen, onEventChange);
    card().focus();
    fireEvent.keyDown(card(), { key: 'm', code: 'KeyM' });
    fireEvent.keyDown(card(), { key: 'ArrowRight' });
    await act(async () => {
      fireEvent.keyDown(card(), { key: 'Enter' });
    });
    expect(await screen.findByText("Couldn't save the change")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(card()));
  });
});

describe('modifier shortcuts', () => {
  it('leaves Cmd/Ctrl+R and Ctrl+M to the browser', () => {
    renderDay(
      nineToTen,
      vi.fn<Change>(async () => {}),
    );
    card().focus();
    expect(fireEvent.keyDown(card(), { key: 'r', code: 'KeyR', metaKey: true })).toBe(true);
    expect(fireEvent.keyDown(card(), { key: 'm', code: 'KeyM', ctrlKey: true })).toBe(true);
    expect(document.querySelector('[data-slot="calendar-grid-announcer"]')?.textContent).toBe('');
  });
});

describe('horizontally scrolled grids', () => {
  /** Scroller 0–500px with the time axis pinned at 0–160px, overlapping column 0 (100–300px) as if scrolled sideways. */
  const stubScrolledLayout = () =>
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const index = Number(this.dataset.columnIndex ?? -1);
      if (this.dataset.calendarColumn !== undefined) return DOMRect.fromRect({ x: 100 + index * 200, y: 0, width: 200, height: 800 });
      if (this.dataset.slot === 'calendar-grid-body') return DOMRect.fromRect({ x: 0, y: 0, width: 500, height: 800 });
      if (this.dataset.slot === 'calendar-time-grid-axis') return DOMRect.fromRect({ x: 0, y: 0, width: 160, height: 800 });
      return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
    });

  const khalilVisit: Visit = { ...nineToTen, doctor: 'khalil' };

  it('keeps the last column when the pointer is over the pinned axis', () => {
    stubScrolledLayout();
    const onEventChange = vi.fn<Change>(async () => {});
    renderDay(khalilVisit, onEventChange);
    drag(at(1, 546), { clientX: 120, clientY: at(1, 666).clientY });
    expect(onEventChange).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'khalil' }));
  });

  it('scrolls sideways when the pointer nears the inline edges', async () => {
    stubScrolledLayout();
    renderDay(
      khalilVisit,
      vi.fn<Change>(async () => {}),
    );
    const scroller = document.querySelector('[data-slot="calendar-grid-body"]') as HTMLElement;
    let left = 0;
    Object.defineProperty(scroller, 'scrollLeft', { configurable: true, get: () => left, set: (value: number) => (left = value) });

    fireEvent.pointerDown(card(), { button: 0, pointerId: 1, ...at(1, 546) });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 490, clientY: 300 });
    await waitFor(() => expect(left).toBeGreaterThan(0));
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 170, clientY: 300 });
    const peak = left;
    await waitFor(() => expect(left).toBeLessThan(peak));
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 170, clientY: 300 });
  });
});
