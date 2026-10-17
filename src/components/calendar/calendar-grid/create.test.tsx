// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { CalendarGrid } from '@components/calendar';
import { Tooltip } from '@components/ui';

import { wallTime } from './scheduling';
import { stubLayout } from './test-utils/layout';

import '../../../i18n';

beforeEach(() => {
  stubLayout();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type Visit = { id: string; start: string; end: string; patient: string };
const accessors = { getId: (v: Visit) => v.id, getStartTime: (v: Visit) => v.start, getEndTime: (v: Visit) => v.end };

const renderDay = (props: Record<string, unknown> = {}) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid
        initialView="day"
        initialDate="2026-10-16"
        events={[] as Visit[]}
        eventAccessors={accessors}
        startHour={8}
        endHour={16}
        stepMinutes={30}
        {...props}
      >
        <CalendarGrid.EventTemplate<Visit>>{(visit) => visit.patient}</CalendarGrid.EventTemplate>
        <CalendarGrid.DayView />
      </CalendarGrid>
    </Tooltip.Provider>,
  );

const column = (selector = '[data-calendar-column]') => document.querySelector(selector) as HTMLElement;
const draft = () => document.querySelector('[data-slot="calendar-grid-draft"]');

describe('CalendarGrid slot selection', () => {
  it('clicking an empty cell selects one step', () => {
    const onSlotSelect = vi.fn();
    renderDay({ onSlotSelect });
    fireEvent.pointerDown(column(), { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 210 });
    expect(onSlotSelect).toHaveBeenCalledWith({
      start: wallTime('2026-10-16', 600),
      end: wallTime('2026-10-16', 630),
      resourceId: undefined,
    });
  });

  it('dragging draws a snapped ghost with a live label and selects the range', () => {
    const onSlotSelect = vi.fn();
    renderDay({ onSlotSelect });
    fireEvent.pointerDown(column(), { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 330 });
    expect(draft()?.textContent).toBe('10:00 AM – 11:30 AM');
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 330 });
    expect(onSlotSelect).toHaveBeenCalledWith(
      expect.objectContaining({ start: wallTime('2026-10-16', 600), end: wallTime('2026-10-16', 690) }),
    );
    expect(draft()).toBeNull();
  });

  it('ignores presses other than the primary button', () => {
    const onSlotSelect = vi.fn();
    renderDay({ onSlotSelect });
    fireEvent.pointerDown(column(), { button: 2, pointerId: 1, clientX: 150, clientY: 210 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 210 });
    expect(onSlotSelect).not.toHaveBeenCalled();
  });

  it('refuses unavailable cells unless allowOutsideAvailability', () => {
    const onSlotSelect = vi.fn();
    const slots = { '2026-10-16': [{ startTime: '08:00', endTime: '09:00' }] };
    renderDay({ onSlotSelect, slots });
    fireEvent.pointerDown(column(), { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 330 });
    expect(draft()?.className).toContain('border-danger');
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 330 });
    expect(onSlotSelect).not.toHaveBeenCalled();
    cleanup();

    renderDay({ onSlotSelect, slots, allowOutsideAvailability: true });
    fireEvent.pointerDown(column(), { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 210 });
    expect(onSlotSelect).toHaveBeenCalledOnce();
  });

  it('paints every cell open when onSlotSelect is set without slots', () => {
    renderDay({ onSlotSelect: vi.fn() });
    const cells = [...column().querySelectorAll('[data-slot="calendar-time-grid-cell"]')];
    expect(cells.every((cell) => cell.classList.contains('bg-surface'))).toBe(true);
  });

  it('Escape cancels a drag', () => {
    const onSlotSelect = vi.fn();
    renderDay({ onSlotSelect });
    fireEvent.pointerDown(column(), { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 330 });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(draft()).toBeNull();
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 330 });
    expect(onSlotSelect).not.toHaveBeenCalled();
  });

  it('selects in the resource column it started in', () => {
    const onSlotSelect = vi.fn();
    renderDay({
      onSlotSelect,
      resources: [
        { id: 'haddad', label: 'Dr. Haddad' },
        { id: 'khalil', label: 'Dr. Khalil' },
      ],
    });
    fireEvent.pointerDown(column('[data-calendar-column][data-resource="khalil"]'), {
      button: 0,
      pointerId: 1,
      clientX: 350,
      clientY: 210,
    });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 330 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 330 });
    expect(onSlotSelect).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'khalil' }));
  });

  it('does nothing without onSlotSelect', () => {
    renderDay();
    fireEvent.pointerDown(column(), { button: 0, pointerId: 1, clientX: 150, clientY: 210 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 330 });
    expect(draft()).toBeNull();
  });
});
