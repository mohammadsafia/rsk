// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarGrid, type CalendarView } from '@components/calendar';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

type Visit = { id: string; start: string; end: string; patient: string };

const visits: Visit[] = [{ id: '1', start: '2026-10-16T10:00:00', end: '2026-10-16T10:30:00', patient: 'Sara Haddad' }];

const accessors = { getId: (v: Visit) => v.id, getStartTime: (v: Visit) => v.start, getEndTime: (v: Visit) => v.end };

const renderGrid = (view: CalendarView) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid initialView={view} initialDate="2026-10-16" events={visits} eventAccessors={accessors} startHour={9} endHour={11}>
        <CalendarGrid.Header>
          <CalendarGrid.ViewTabs />
          <CalendarGrid.ViewToggle />
        </CalendarGrid.Header>
        <CalendarGrid.EventTemplate<Visit>>{(visit) => visit.patient}</CalendarGrid.EventTemplate>
        <CalendarGrid.DayView />
        <CalendarGrid.MonthView />
      </CalendarGrid>
    </Tooltip.Provider>,
  );

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const ARABIC_INDIC_DIGIT = /[٠-٩]/;

describe('CalendarGrid localisation', () => {
  it('translates the view tabs and the list/calendar toggle', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderGrid('month');
    expect(screen.getByRole('tablist', { name: 'طرق العرض' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'شهر' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'عرض القائمة' })).toBeTruthy();
  });

  it('renders weekday headers in the active language', async () => {
    renderGrid('month');
    expect(screen.getByText('Sun')).toBeTruthy();
    cleanup();

    await act(() => i18n.changeLanguage('ar'));
    renderGrid('month');
    expect(screen.queryByText('Sun')).toBeNull();
    expect(screen.queryByText('SUN')).toBeNull();
  });

  it('labels the time axis by hour in Arabic with Western digits', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderGrid('day');
    expect(document.body.textContent).toContain('9 ص');
    expect(document.body.textContent).not.toMatch(ARABIC_INDIC_DIGIT);
    expect(document.body.textContent).not.toContain(':00');
  });

  it('gives event chips and cards a hidden date for screen readers', () => {
    renderGrid('month');
    const chipDate = [...document.querySelectorAll('.sr-only')].map((node) => node.textContent);
    expect(chipDate.some((text) => text?.includes('October 16, 2026'))).toBe(true);
    cleanup();

    renderGrid('day');
    const cardDate = screen.getByText('Sara Haddad').parentElement?.querySelector('.sr-only');
    expect(cardDate?.textContent).toContain('October 16, 2026');
  });
});
