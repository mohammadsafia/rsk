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
const accessors = {
  getId: (v: Visit) => v.id,
  getStartTime: (v: Visit) => v.start,
  getEndTime: (v: Visit) => v.end,
  getResourceId: (v: Visit) => v.doctor,
};
const visits: Visit[] = [
  { id: '2', start: '2026-10-16T11:00:00', end: '2026-10-16T11:30:00', patient: 'Omar Khalil' },
  { id: '1', start: '2026-10-16T09:00:00', end: '2026-10-16T09:30:00', patient: 'Sara Haddad', doctor: 'haddad' },
  { id: '3', start: '2026-10-19T10:00:00', end: '2026-10-19T10:30:00', patient: 'Lina Nasser' },
  { id: '4', start: '2026-10-30T10:00:00', end: '2026-10-30T10:30:00', patient: 'Far Away' },
];

const renderAgenda = (events = visits, onRangeChange = vi.fn()) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid
        initialView="agenda"
        initialDate="2026-10-16"
        events={events}
        eventAccessors={accessors}
        resources={[{ id: 'haddad', label: 'Dr. Haddad' }]}
        onRangeChange={onRangeChange}
      >
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
    expect(screen.getByRole('radio', { name: 'Agenda' })).toBeTruthy();
    cleanup();
    await act(() => i18n.changeLanguage('ar'));
    renderAgenda();
    expect(screen.getByRole('radio', { name: 'جدول الأعمال' })).toBeTruthy();
  });
});
