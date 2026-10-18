// @vitest-environment happy-dom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { CalendarGrid } from '@components/calendar';
import { Tooltip } from '@components/ui';

import '../../../i18n';

type Visit = { id: string; start: string; end: string };
const accessors = { getId: (v: Visit) => v.id, getStartTime: (v: Visit) => v.start, getEndTime: (v: Visit) => v.end };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 18, 9, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const nowLineTop = () => (document.querySelector('[data-slot="calendar-time-grid-now-line"]') as HTMLElement | null)?.style.top;

describe('CalendarGrid clock', () => {
  it('moves the now line as time passes while the page stays open (not frozen at first render)', () => {
    render(
      <Tooltip.Provider>
        <CalendarGrid initialView="day" initialDate="2026-10-18" events={[]} eventAccessors={accessors} startHour={8} endHour={12}>
          <CalendarGrid.DayView />
        </CalendarGrid>
      </Tooltip.Provider>,
    );
    expect(nowLineTop()).toBe('25%');
    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });
    expect(nowLineTop()).toBe('50%');
  });
});
