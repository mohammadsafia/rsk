// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { CalendarGrid, type CalendarEventChange } from '@components/calendar';
import { Tooltip } from '@components/ui';

import { wallTime } from './scheduling';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
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

const renderDay = ({ dir = 'ltr', onSlotSelect }: { dir?: 'ltr' | 'rtl'; onSlotSelect?: () => void } = {}) => {
  const onEventChange = vi.fn<Change>(async () => {});
  render(
    <div dir={dir}>
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
          onSlotSelect={onSlotSelect}
        >
          <CalendarGrid.EventTemplate<Visit>>{(v) => v.patient}</CalendarGrid.EventTemplate>
          <CalendarGrid.PopoverTemplate<Visit>>{() => <p>Details</p>}</CalendarGrid.PopoverTemplate>
          <CalendarGrid.DayView />
        </CalendarGrid>
      </Tooltip.Provider>
    </div>,
  );
  return { onEventChange };
};

const card = () => screen.getByText('Sara Haddad').closest('button') as HTMLElement;
const announcer = () => document.querySelector('[data-slot="calendar-grid-announcer"]') as HTMLElement;

describe('CalendarGrid keyboard', () => {
  it('moves an event with M, arrows and Enter, announcing each step', async () => {
    const { onEventChange } = renderDay();
    expect(card().getAttribute('aria-keyshortcuts')).toBe('M R');
    card().focus();
    fireEvent.keyDown(card(), { key: 'm', code: 'KeyM' });
    expect(announcer().textContent).toContain('Moving');
    fireEvent.keyDown(card(), { key: 'ArrowDown' });
    fireEvent.keyDown(card(), { key: 'ArrowRight' });
    expect(announcer().textContent).toBe('Fri, Oct 16, 9:30 AM to 10:30 AM, Dr. Khalil');
    fireEvent.keyDown(card(), { key: 'Enter' });

    expect(onEventChange).toHaveBeenCalledWith(
      expect.objectContaining({ start: wallTime('2026-10-16', 570), end: wallTime('2026-10-16', 630), resourceId: 'khalil' }),
    );
    expect(screen.queryByText('Details')).toBeNull();
    await waitFor(() => expect(document.activeElement?.textContent).toContain('Sara Haddad'));
  });

  it('mirrors left and right in Arabic and accepts M by key code', async () => {
    await act(() => i18n.changeLanguage('ar'));
    const { onEventChange } = renderDay({ dir: 'rtl' });
    card().focus();
    fireEvent.keyDown(card(), { key: 'ة', code: 'KeyM' });
    fireEvent.keyDown(card(), { key: 'ArrowLeft' });
    fireEvent.keyDown(card(), { key: 'Enter' });
    expect(onEventChange).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'khalil' }));
  });

  it('resizes with R, never below one step, and Escape cancels without saving', () => {
    const { onEventChange } = renderDay();
    card().focus();
    fireEvent.keyDown(card(), { key: 'r', code: 'KeyR' });
    expect(announcer().textContent).toContain('Resizing');
    fireEvent.keyDown(card(), { key: 'ArrowUp' });
    fireEvent.keyDown(card(), { key: 'ArrowUp' });
    expect(announcer().textContent).toBe('Fri, Oct 16, 9:00 AM to 9:30 AM, Dr. Haddad');
    fireEvent.keyDown(card(), { key: 'Escape' });
    expect(onEventChange).not.toHaveBeenCalled();
    expect(announcer().textContent).toBe('Change cancelled');
  });

  it('cancels a keyboard move when focus leaves the event', () => {
    const { onEventChange } = renderDay();
    card().focus();
    fireEvent.keyDown(card(), { key: 'm', code: 'KeyM' });
    fireEvent.keyDown(card(), { key: 'ArrowDown' });
    fireEvent.blur(card());
    expect(document.querySelector('[data-slot="calendar-grid-draft"]')).toBeNull();
    fireEvent.keyDown(card(), { key: 'Enter' });
    expect(onEventChange).not.toHaveBeenCalled();
  });

  it('reaches empty cells with one tab stop and arrow keys; Enter selects one step', () => {
    const onSlotSelect = vi.fn();
    renderDay({ onSlotSelect });
    const cells = () =>
      [...document.querySelectorAll('[data-calendar-column] [role="button"][data-slot="calendar-time-grid-cell"]')] as HTMLElement[];
    expect(cells().filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
    const first = cells().find((cell) => cell.tabIndex === 0)!;
    expect(first.getAttribute('aria-label')).toBe('Fri, Oct 16, 8:00 AM, Dr. Haddad');
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Fri, Oct 16, 8:30 AM, Dr. Haddad');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Fri, Oct 16, 8:30 AM, Dr. Khalil');
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(onSlotSelect).toHaveBeenCalledWith({
      start: wallTime('2026-10-16', 510),
      end: wallTime('2026-10-16', 540),
      resourceId: 'khalil',
    });
    expect(cells().filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
  });

  it('leaves cells hidden from assistive tech without onSlotSelect', () => {
    renderDay();
    const cell = document.querySelector('[data-slot="calendar-time-grid-cell"]')!;
    expect(cell.getAttribute('aria-hidden')).toBe('true');
    expect(cell.hasAttribute('tabindex')).toBe(false);
  });
});
