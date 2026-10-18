// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarGrid, type CalendarView } from '@components/calendar';
import { Tooltip } from '@components/ui';

import '../../../i18n';

type Visit = { id: string; start: string; end: string };
const accessors = { getId: (v: Visit) => v.id, getStartTime: (v: Visit) => v.start, getEndTime: (v: Visit) => v.end };

const Grid = ({ view, date }: { view: CalendarView; date: string }) => (
  <Tooltip.Provider>
    <CalendarGrid view={view} date={date} events={[]} eventAccessors={accessors} startHour={9} endHour={11}>
      <CalendarGrid.WeekView />
      <CalendarGrid.MonthView />
    </CalendarGrid>
  </Tooltip.Provider>
);

const body = (view: string) => document.querySelector<HTMLElement>(`[data-slot="calendar-grid-${view}-view"]`)!;

afterEach(cleanup);

describe('CalendarGrid travel', () => {
  it('slides the week forward or back with the date, and stays still on first render', () => {
    const { rerender } = render(<Grid view="week" date="2026-10-16" />);
    expect(body('week').hasAttribute('data-direction')).toBe(false);
    rerender(<Grid view="week" date="2026-10-23" />);
    expect(body('week').dataset.direction).toBe('forward');
    rerender(<Grid view="week" date="2026-10-09" />);
    expect(body('week').dataset.direction).toBe('back');
  });

  it('slides the month body too', () => {
    const { rerender } = render(<Grid view="month" date="2026-10-16" />);
    rerender(<Grid view="month" date="2026-11-16" />);
    expect(body('month').dataset.direction).toBe('forward');
  });
});
