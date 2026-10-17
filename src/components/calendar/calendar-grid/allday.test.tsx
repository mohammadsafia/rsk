// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarGrid } from '@components/calendar';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

type Item = { id: string; start: string; end: string; title: string; allDay?: boolean };
const accessors = {
  getId: (i: Item) => i.id,
  getStartTime: (i: Item) => i.start,
  getEndTime: (i: Item) => i.end,
  isAllDay: (i: Item) => !!i.allDay,
};

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
