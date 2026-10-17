// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { CalendarGrid, type CalendarEventChange } from '@components/calendar';
import { Toaster } from '@components/shared';
import { Tooltip } from '@components/ui';

import { wallTime } from './scheduling';
import { at, stubLayout } from './test-utils/layout';

import '../../../i18n';

beforeEach(() => {
  stubLayout();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type Visit = { id: string; start: string; end: string; patient: string; doctor: string };
const visit: Visit = { id: '1', start: '2026-10-16T09:00:00', end: '2026-10-16T10:00:00', patient: 'Sara Haddad', doctor: 'haddad' };
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

type Change = (change: CalendarEventChange<Visit>) => Promise<void>;

const renderDay = ({
  onEventChange,
  canEdit,
  onSlotSelect,
}: { onEventChange?: Change; canEdit?: (v: Visit) => boolean; onSlotSelect?: () => void } = {}) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid
        initialView="day"
        initialDate="2026-10-16"
        events={[visit]}
        eventAccessors={accessors}
        resources={resources}
        startHour={8}
        endHour={16}
        stepMinutes={30}
        onEventChange={onEventChange}
        canEdit={canEdit}
        onSlotSelect={onSlotSelect}
      >
        <CalendarGrid.EventTemplate<Visit>>{(v) => v.patient}</CalendarGrid.EventTemplate>
        <CalendarGrid.PopoverTemplate<Visit>>{() => <p>Details</p>}</CalendarGrid.PopoverTemplate>
        <CalendarGrid.DayView />
      </CalendarGrid>
      <Toaster />
    </Tooltip.Provider>,
  );

const card = () => screen.getByText('Sara Haddad').closest('button') as HTMLElement;
const column = (resource: string) => document.querySelector(`[data-calendar-column][data-resource="${resource}"]`) as HTMLElement;
const draft = () => document.querySelector('[data-slot="calendar-grid-draft"]');

const drag = (target: HTMLElement, from: { clientX: number; clientY: number }, to: { clientX: number; clientY: number }) => {
  fireEvent.pointerDown(target, { button: 0, pointerId: 1, ...from });
  fireEvent.pointerMove(window, { pointerId: 1, ...to });
  fireEvent.pointerUp(window, { pointerId: 1, ...to });
};

describe('CalendarGrid move and resize', () => {
  it('a short press opens the popover instead of moving', async () => {
    const onEventChange = vi.fn<Change>(async () => {});
    renderDay({ onEventChange });
    fireEvent.pointerDown(card(), { button: 0, pointerId: 1, ...at(0, 546) });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 151, clientY: 111 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 151, clientY: 111 });
    fireEvent.click(card());
    expect(await screen.findByText('Details')).toBeTruthy();
    expect(onEventChange).not.toHaveBeenCalled();
  });

  it('drags the body to another time and resource, keeping the duration, optimistically', async () => {
    let resolve: () => void = () => {};
    const onEventChange = vi.fn<Change>(() => new Promise<void>((done) => (resolve = done)));
    renderDay({ onEventChange });

    fireEvent.pointerDown(card(), { button: 0, pointerId: 1, ...at(0, 546) });
    fireEvent.pointerMove(window, { pointerId: 1, ...at(1, 726) });
    expect(draft()?.textContent).toBe('12:00 PM – 1:00 PM');
    expect(card().className).toContain('opacity-50');
    fireEvent.pointerUp(window, { pointerId: 1, ...at(1, 726) });
    fireEvent.click(card());

    expect(onEventChange).toHaveBeenCalledWith({
      event: visit,
      start: wallTime('2026-10-16', 720),
      end: wallTime('2026-10-16', 780),
      resourceId: 'khalil',
    });
    expect(within(column('khalil')).getByText('Sara Haddad')).toBeTruthy();
    expect(screen.queryByText('Details')).toBeNull();
    expect(document.querySelector('[data-slot="calendar-grid-announcer"]')?.textContent).toBe(
      'Moved to Fri, Oct 16, 12:00 PM to 1:00 PM, Dr. Khalil',
    );
    await act(async () => resolve());
    expect(within(column('khalil')).getByText('Sara Haddad')).toBeTruthy();
  });

  it('reverts with a danger toast when onEventChange rejects, and can drag again', async () => {
    const onEventChange = vi.fn<Change>(async () => {
      throw new Error('conflict');
    });
    renderDay({ onEventChange });
    await act(async () => drag(card(), at(0, 546), at(1, 726)));

    expect(await screen.findByText("Couldn't save the change")).toBeTruthy();
    await waitFor(() => expect(within(column('haddad')).getByText('Sara Haddad')).toBeTruthy());

    await act(async () => drag(card(), at(0, 546), at(0, 666)));
    expect(onEventChange).toHaveBeenCalledTimes(2);
  });

  it('resizes from the bottom handle, at least one step', () => {
    const onEventChange = vi.fn<Change>(async () => {});
    renderDay({ onEventChange });
    const handle = card().querySelector('[data-resize-handle]') as HTMLElement;
    drag(handle, at(0, 598), at(0, 654));
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: wallTime('2026-10-16', 540), end: wallTime('2026-10-16', 660), resourceId: 'haddad' }),
    );

    drag(card().querySelector('[data-resize-handle]') as HTMLElement, at(0, 598), at(0, 500));
    expect(onEventChange).toHaveBeenLastCalledWith(expect.objectContaining({ end: wallTime('2026-10-16', 570) }));
  });

  it('keeps the last column and clamps the time when the drop is outside the grid', () => {
    const onEventChange = vi.fn<Change>(async () => {});
    renderDay({ onEventChange });
    drag(card(), at(0, 546), { clientX: 5000, clientY: -300 });
    expect(onEventChange).toHaveBeenCalledWith(
      expect.objectContaining({ start: wallTime('2026-10-16', 480), end: wallTime('2026-10-16', 540), resourceId: 'haddad' }),
    );
  });

  it('locks events that canEdit refuses', () => {
    const onEventChange = vi.fn<Change>(async () => {});
    renderDay({ onEventChange, canEdit: () => false });
    expect(card().querySelector('[data-resize-handle]')).toBeNull();
    fireEvent.pointerDown(card(), { button: 0, pointerId: 1, ...at(0, 546) });
    fireEvent.pointerMove(window, { pointerId: 1, ...at(1, 726) });
    expect(draft()).toBeNull();
    fireEvent.pointerUp(window, { pointerId: 1, ...at(1, 726) });
    expect(onEventChange).not.toHaveBeenCalled();
  });

  it('moves (not selects a slot) when a popover event is dragged in a selectable grid', () => {
    const onEventChange = vi.fn<Change>(async () => {});
    const onSlotSelect = vi.fn();
    renderDay({ onEventChange, onSlotSelect });
    drag(card(), at(0, 546), at(1, 726));
    expect(onSlotSelect).not.toHaveBeenCalled();
    expect(onEventChange).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'khalil' }));
  });

  it('a locked event in a selectable grid starts nothing', () => {
    const onSlotSelect = vi.fn();
    renderDay({ onEventChange: vi.fn<Change>(async () => {}), canEdit: () => false, onSlotSelect });
    fireEvent.pointerDown(card(), { button: 0, pointerId: 1, ...at(0, 546) });
    fireEvent.pointerMove(window, { pointerId: 1, ...at(0, 700) });
    expect(draft()).toBeNull();
    fireEvent.pointerUp(window, { pointerId: 1, ...at(0, 700) });
    expect(onSlotSelect).not.toHaveBeenCalled();
  });

  it('is read-only without onEventChange', () => {
    renderDay();
    expect(card().querySelector('[data-resize-handle]')).toBeNull();
    expect(card().className).not.toContain('touch-none');
  });
});
