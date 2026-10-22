'use client';

import { type CSSProperties, type FC, useMemo, useState } from 'react';

import { Button, CalendarMonthGrid, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { type EventTimeStatus, useCalendarGridContext } from '@components/calendar';

import { useAppTranslation, useDate } from '@hooks/shared';

import { dayKeyOf, lastDayKeyOf, packLanes } from '../scheduling';
import { isAllDayEvent } from './placement';
import type { GridColumn } from './CalendarGridTimeView';

const MAX_LANES = 3;

type AllDayItemProps = { event: unknown; status: EventTimeStatus; style?: CSSProperties };

const AllDayItem: FC<AllDayItemProps> = ({ event, status, style }) => {
  const { renderEvent, popoverContent, eventAccessors } = useCalendarGridContext();
  const { formatNullableDate, constants } = useDate();
  const [open, setOpen] = useState(false);
  const day = formatNullableDate(eventAccessors.getStartTime(event), constants.DateFormats.FULL_MONTH_DAY_YEAR, '');

  const chip = (
    <CalendarMonthGrid.EventChip onClick={popoverContent ? () => setOpen(true) : undefined}>
      <Conditional.If condition={!!day}>
        <span className="sr-only">{`${day}, `}</span>
      </Conditional.If>

      {renderEvent(event, status)}
    </CalendarMonthGrid.EventChip>
  );

  return (
    <div data-slot="calendar-grid-all-day-item" className="min-w-0 px-0.5" style={style}>
      {popoverContent ? (
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>{chip}</Popover.Trigger>

          <Popover.Content className="w-80 p-0">{popoverContent(event, () => setOpen(false))}</Popover.Content>
        </Popover>
      ) : (
        chip
      )}
    </div>
  );
};

/**
 * Strip above the time grid for all-day and multi-day events, packed into lanes across the visible columns.
 * Past three lanes, the first two show and each column gets a "+N more" popover for the rest.
 */
const AllDayRow: FC<{ columns: GridColumn[]; resourceMode: boolean }> = ({ columns, resourceMode }) => {
  const { t } = useAppTranslation('common');
  const { events, eventAccessors, now: clock } = useCalendarGridContext();
  const { toDate, isBefore, isAfter } = useDate();

  const { visible, hiddenByColumn, rows } = useMemo(() => {
    const now = toDate(clock);
    const spans = events.flatMap((event) => {
      if (!isAllDayEvent(event, eventAccessors)) return [];
      const start = eventAccessors.getStartTime(event);
      const end = eventAccessors.getEndTime(event);
      const first = dayKeyOf(start);
      const last = lastDayKeyOf(start, end);
      const covered = columns.flatMap((column, index) =>
        column.dayKey >= first &&
        column.dayKey <= last &&
        (column.resourceId === undefined || eventAccessors.getResourceId?.(event) === column.resourceId)
          ? [index]
          : [],
      );
      if (covered.length === 0) return [];
      const status: EventTimeStatus = isBefore(end, now) ? 'past' : isAfter(start, now) ? 'future' : 'current';
      return [{ event, status, startCol: covered[0], endCol: covered[covered.length - 1] }];
    });

    const { placed, laneCount } = packLanes(spans);
    const shownLanes = laneCount > MAX_LANES ? MAX_LANES - 1 : laneCount;
    const hidden = new Map<number, typeof placed>();

    for (const span of placed) {
      if (span.lane < shownLanes) continue;
      for (let col = span.startCol; col <= span.endCol; col += 1) hidden.set(col, [...(hidden.get(col) ?? []), span]);
    }

    return {
      visible: placed.filter((span) => span.lane < shownLanes),
      hiddenByColumn: [...hidden.entries()],
      rows: laneCount > MAX_LANES ? MAX_LANES : laneCount,
    };
  }, [events, eventAccessors, columns, clock, toDate, isBefore, isAfter]);

  if (rows === 0) return null;

  return (
    <div data-slot="calendar-grid-all-day" className="border-border-subtle bg-surface flex border-b">
      <div className="border-border-subtle bg-surface text-fg-muted text-2xs sticky start-0 z-10 flex w-16 shrink-0 items-start justify-end border-e pe-2 pt-1.5">
        {t('calendar.allDay')}
      </div>

      <div
        className="grid flex-1 gap-y-0.5 py-0.5"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(${resourceMode ? '11rem' : '0'}, 1fr))`,
          gridTemplateRows: `repeat(${rows}, auto)`,
        }}
      >
        {visible.map((span, index) => (
          <AllDayItem
            key={`${eventAccessors.getId(span.event)}-${index}`}
            event={span.event}
            status={span.status}
            style={{ gridColumn: `${span.startCol + 1} / ${span.endCol + 2}`, gridRow: span.lane + 1 }}
          />
        ))}

        {hiddenByColumn.map(([column, spans]) => (
          <div key={`more-${column}`} className="px-1" style={{ gridColumn: `${column + 1} / ${column + 2}`, gridRow: MAX_LANES }}>
            <Popover>
              <Popover.Trigger asChild>
                <Button variant="link" tone="accent" className="text-2xs h-auto p-0 font-medium">
                  {t('calendar.more', { count: spans.length })}
                </Button>
              </Popover.Trigger>

              <Popover.Content className="w-60 p-2" side="bottom" align="start">
                <div className="flex flex-col gap-1">
                  {spans.map((span, index) => (
                    <AllDayItem key={`${eventAccessors.getId(span.event)}-hidden-${index}`} event={span.event} status={span.status} />
                  ))}
                </div>
              </Popover.Content>
            </Popover>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllDayRow;
