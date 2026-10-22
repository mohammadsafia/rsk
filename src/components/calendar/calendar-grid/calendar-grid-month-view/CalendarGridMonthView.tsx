'use client';

import { type FC, useMemo, useRef, useState } from 'react';

import { Button, CalendarMonthGrid, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { type EventTimeStatus, useCalendarGridContext } from '@components/calendar';

import { useTravel } from '@hooks/motion';
import { useAppTranslation, useDate } from '@hooks/shared';

type MonthEventItemProps = {
  event: unknown;
  status: EventTimeStatus;
};

type CalendarGridMonthViewComponents = FC & {
  MonthView: FC;
};

const MAX_VISIBLE_MONTH_EVENTS = 3;

const MonthEventItem: FC<MonthEventItemProps> = ({ event, status }) => {
  const { renderEvent, popoverContent, eventAccessors } = useCalendarGridContext();
  const { formatNullableDate, constants } = useDate();
  const [open, setOpen] = useState(false);
  const day = formatNullableDate(eventAccessors.getStartTime(event), constants.DateFormats.FULL_MONTH_DAY_YEAR, '');

  const trigger = (
    <CalendarMonthGrid.EventChip onClick={popoverContent ? () => setOpen(true) : undefined}>
      <Conditional.If condition={!!day}>
        <span className="sr-only">{`${day}, `}</span>
      </Conditional.If>

      {renderEvent(event, status)}
    </CalendarMonthGrid.EventChip>
  );

  if (!popoverContent) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>

      <Popover.Content className="w-80 p-0">{popoverContent(event, () => setOpen(false))}</Popover.Content>
    </Popover>
  );
};

const MonthView: FC = () => {
  const { view, viewMode, date, range, events, eventAccessors, slotCoverageDates, now: clock } = useCalendarGridContext();
  const bodyRef = useRef<HTMLDivElement>(null);
  useTravel(bodyRef, range.startDate, view);
  const { formatDate, getMonthGrid, toDate, toDateUnits, isBefore, isAfter, constants } = useDate();
  const { t } = useAppTranslation('common');

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => formatDate(new Date(2023, 0, 1 + index), constants.DateFormats.SHORT_DAY)),
    [formatDate, constants.DateFormats.SHORT_DAY],
  );

  const todayKey = toDate(clock);

  const monthInfo = useMemo(() => {
    const units = toDateUnits(date);
    return { year: units.years, month: units.months };
  }, [date, toDateUnits]);

  const days = useMemo(() => getMonthGrid(monthInfo.year, monthInfo.month), [getMonthGrid, monthInfo.year, monthInfo.month]);

  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, { event: (typeof events)[number]; status: EventTimeStatus }[]>();
    const now = toDate(clock);

    for (const event of events) {
      const start = eventAccessors.getStartTime(event);
      const end = eventAccessors.getEndTime(event);
      const key = toDate(start);
      const status: EventTimeStatus = isBefore(end, now) ? 'past' : isAfter(start, now) ? 'future' : 'current';

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ event, status });
    }

    return map;
  }, [events, eventAccessors, clock, toDate, isBefore, isAfter]);

  if (view !== 'month' || viewMode !== 'calendar') return null;

  return (
    <div ref={bodyRef} data-slot="calendar-grid-month-view" className="flex min-h-0 flex-1 flex-col">
      <CalendarMonthGrid>
        <CalendarMonthGrid.Weekdays>
          {weekdays.map((day) => (
            <CalendarMonthGrid.Weekday key={day}>{day}</CalendarMonthGrid.Weekday>
          ))}
        </CalendarMonthGrid.Weekdays>

        <CalendarMonthGrid.Days>
          {days.map((day) => {
            const dayKey = toDate(day);
            const isCurrentMonth = toDateUnits(day).months === monthInfo.month;
            const isToday = dayKey === todayKey;
            const hasCoverage = slotCoverageDates.has(dayKey);
            const dayEvents = eventsByDayKey.get(dayKey) ?? [];
            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_MONTH_EVENTS);
            const overflowEvents = dayEvents.slice(MAX_VISIBLE_MONTH_EVENTS);
            const dayNumber = Number(formatDate(day, constants.DateFormats.DAY_OF_MONTH));

            return (
              <CalendarMonthGrid.DayCell
                key={dayKey}
                dayNumber={dayNumber}
                isToday={isToday}
                isCurrentMonth={isCurrentMonth}
                available={hasCoverage}
              >
                {visibleEvents.map(({ event, status }, idx) => (
                  <MonthEventItem key={`${eventAccessors.getId(event)}-${idx}`} event={event} status={status} />
                ))}

                <Conditional.If condition={overflowEvents.length > 0}>
                  <Popover>
                    <Popover.Trigger asChild>
                      <Button variant="link" tone="accent" className="text-2xs h-auto p-0 font-medium">
                        {t('calendar.more', { count: overflowEvents.length })}
                      </Button>
                    </Popover.Trigger>

                    <Popover.Content className="w-60 p-2" side="bottom" align="start">
                      <div className="flex flex-col gap-1">
                        {overflowEvents.map(({ event, status }, idx) => (
                          <MonthEventItem key={`${eventAccessors.getId(event)}-overflow-${idx}`} event={event} status={status} />
                        ))}
                      </div>
                    </Popover.Content>
                  </Popover>
                </Conditional.If>
              </CalendarMonthGrid.DayCell>
            );
          })}
        </CalendarMonthGrid.Days>
      </CalendarMonthGrid>
    </div>
  );
};

const CalendarGridMonthView: CalendarGridMonthViewComponents = () => null;

CalendarGridMonthView.MonthView = MonthView;

export default CalendarGridMonthView;
