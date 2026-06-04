import { type FC, useMemo, useState } from 'react';

import { Button, CalendarMonthGrid, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { type EventTimeStatus, useCalendarGridContext } from '@components/calendar';

import { useDate } from '@hooks/shared';

type MonthEventItemProps = {
  event: unknown;
  status: EventTimeStatus;
};

type CalendarGridMonthViewComponents = FC & {
  MonthView: FC;
};

const MAX_VISIBLE_MONTH_EVENTS = 3;
const WEEK_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

const MonthEventItem: FC<MonthEventItemProps> = ({ event, status }) => {
  const { renderEvent, popoverContent } = useCalendarGridContext();
  const [open, setOpen] = useState(false);

  const trigger = (
    <CalendarMonthGrid.EventChip onClick={popoverContent ? () => setOpen(true) : undefined}>
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
  const { view, viewMode, date, events, eventAccessors, slotCoverageDates } = useCalendarGridContext();
  const { formatDate, getMonthGrid, toDate, toDateUnits, isBefore, isAfter, constants } = useDate();

  const todayKey = toDate();

  const monthInfo = useMemo(() => {
    const units = toDateUnits(date);
    return { year: units.years, month: units.months };
  }, [date, toDateUnits]);

  const days = useMemo(() => getMonthGrid(monthInfo.year, monthInfo.month), [getMonthGrid, monthInfo.year, monthInfo.month]);

  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, { event: (typeof events)[number]; status: EventTimeStatus }[]>();
    const now = toDate();

    for (const event of events) {
      const start = eventAccessors.getStartTime(event);
      const end = eventAccessors.getEndTime(event);
      const key = toDate(start);
      const status: EventTimeStatus = isBefore(end, now) ? 'past' : isAfter(start, now) ? 'future' : 'current';

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ event, status });
    }

    return map;
  }, [events, eventAccessors, toDate, isBefore, isAfter]);

  if (view !== 'month' || viewMode !== 'calendar') return null;

  return (
    <CalendarMonthGrid>
      <CalendarMonthGrid.Weekdays>
        {WEEK_HEADERS.map((day) => (
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
                    <Button variant="link" className="text-2xs h-auto p-0 font-medium">
                      +{overflowEvents.length} more
                    </Button>
                  </Popover.Trigger>

                  <Popover.Content className="border-muted-200 bg-background w-60 rounded-xl border p-2" side="bottom" align="start">
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
  );
};

const CalendarGridMonthView: CalendarGridMonthViewComponents = () => null;

CalendarGridMonthView.MonthView = MonthView;

export default CalendarGridMonthView;
