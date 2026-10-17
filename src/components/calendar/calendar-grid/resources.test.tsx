// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarGrid, type CalendarView } from '@components/calendar';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.scrollIntoView ??= () => {};

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
const resources = [
  { id: 'haddad', label: 'Dr. Haddad' },
  { id: 'khalil', label: 'Dr. Khalil' },
];
const accessors = {
  getId: (v: Visit) => v.id,
  getStartTime: (v: Visit) => v.start,
  getEndTime: (v: Visit) => v.end,
  getResourceId: (v: Visit) => v.doctor,
};

const renderGrid = (view: CalendarView, extra: Record<string, unknown> = {}) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid
        initialView={view}
        initialDate="2026-10-16"
        events={visits}
        eventAccessors={accessors}
        resources={resources}
        startHour={8}
        endHour={12}
        {...extra}
      >
        <CalendarGrid.Header>
          <CalendarGrid.ResourceFilter />
        </CalendarGrid.Header>
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
    expect(firstCell('haddad').classList.contains('bg-surface')).toBe(true);
    expect(firstCell('khalil').classList.contains('bg-surface-sunken')).toBe(true);
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

describe('CalendarGrid resource widths', () => {
  it('keeps week columns flexible even when a resource filter is set', () => {
    renderGrid('week', { resourceFilter: 'haddad' });
    const columns = [...document.querySelectorAll('[data-calendar-column]')];
    expect(columns).toHaveLength(7);
    expect(columns.every((column) => column.classList.contains('min-w-0'))).toBe(true);
  });
});
