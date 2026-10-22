'use client';

import { type FC, useId, useMemo, useState } from 'react';

import { EmptyState, Popover } from '@components/ui';
import { type EventTimeStatus, useCalendarGridContext } from '@components/calendar';

import { useAppTranslation, useDate } from '@hooks/shared';

import { isAllDayEvent } from '../calendar-grid-time-view/placement';
import { dayKeyOf, dayKeysBetween, lastDayKeyOf } from '../scheduling';

type CalendarGridAgendaViewComponents = FC & { AgendaView: FC };

type AgendaItem = { event: unknown; status: EventTimeStatus };

const AgendaRow: FC<AgendaItem> = ({ event, status }) => {
  const { t } = useAppTranslation('common');
  const { renderEvent, popoverContent, eventAccessors, resources } = useCalendarGridContext();
  const { toDate, constants } = useDate();
  const [open, setOpen] = useState(false);

  const start = eventAccessors.getStartTime(event);
  const end = eventAccessors.getEndTime(event);
  const resourceId = eventAccessors.getResourceId?.(event);
  const resource = resources.find((candidate) => candidate.id === resourceId);
  const time = (input: string) => toDate(input, constants.TimeFormats.HOUR_MINUTES_12);

  const content = (
    <>
      <span className="text-fg-muted w-32 shrink-0 text-xs tabular-nums">
        {isAllDayEvent(event, eventAccessors) ? t('calendar.allDay') : <bdi dir="ltr">{`${time(start)} – ${time(end)}`}</bdi>}
      </span>

      <span className="min-w-0 flex-1">{renderEvent(event, status)}</span>

      {resource ? <span className="text-fg-muted shrink-0 text-xs">{resource.label}</span> : null}
    </>
  );

  const rowClass = 'flex w-full items-center gap-4 px-4 py-3 text-start';

  if (!popoverContent) return <li className={rowClass}>{content}</li>;

  return (
    <li>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className={`${rowClass} hover:bg-hover focus-ring cursor-pointer`} onClick={() => setOpen(true)}>
            {content}
          </button>
        </Popover.Trigger>

        <Popover.Content className="w-80 p-0">{popoverContent(event, () => setOpen(false))}</Popover.Content>
      </Popover>
    </li>
  );
};

const AgendaDay: FC<{ dayKey: string; items: AgendaItem[] }> = ({ dayKey, items }) => {
  const { t } = useAppTranslation('common');
  const { now } = useCalendarGridContext();
  const { formatDate, toDate, constants } = useDate();
  const headingId = useId();
  const label = formatDate(dayKey, constants.DateFormats.DAY_SHORT_MONTH);

  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="bg-surface text-fg-muted border-border-subtle sticky top-0 z-10 border-b px-4 py-2 text-xs font-semibold"
      >
        {dayKey === toDate(now) ? `${t('calendar.today')} · ${label}` : label}
      </h3>

      <ul className="divide-border-subtle divide-y">
        {items.map((item, index) => (
          <AgendaRow key={`${index}`} {...item} />
        ))}
      </ul>
    </section>
  );
};

/** List of the range's events grouped by day; days without events are left out. */
const AgendaView: FC = () => {
  const { t } = useAppTranslation('common');
  const { view, viewMode, range, events, eventAccessors, now: clock } = useCalendarGridContext();
  const { toDate, isBefore, isAfter } = useDate();

  const groups = useMemo(() => {
    const now = toDate(clock);
    const sorted = [...events].sort((a, b) => Date.parse(eventAccessors.getStartTime(a)) - Date.parse(eventAccessors.getStartTime(b)));

    return dayKeysBetween(range.startDate, range.endDate).flatMap((dayKey) => {
      const items = sorted.flatMap((event): AgendaItem[] => {
        const start = eventAccessors.getStartTime(event);
        const end = eventAccessors.getEndTime(event);
        if (dayKey < dayKeyOf(start) || dayKey > lastDayKeyOf(start, end)) return [];
        return [{ event, status: isBefore(end, now) ? 'past' : isAfter(start, now) ? 'future' : 'current' }];
      });
      return items.length ? [{ dayKey, items }] : [];
    });
  }, [events, eventAccessors, range.startDate, range.endDate, clock, toDate, isBefore, isAfter]);

  if (view !== 'agenda' || viewMode !== 'calendar') return null;

  return (
    <div data-slot="calendar-grid-agenda" className="min-h-0 flex-1 overflow-y-auto">
      {groups.length === 0 ? (
        <EmptyState kind="first-use" size="sm" title={t('calendar.agendaEmpty')} description={t('calendar.agendaEmptyHint')} />
      ) : (
        groups.map((group) => <AgendaDay key={group.dayKey} dayKey={group.dayKey} items={group.items} />)
      )}
    </div>
  );
};

const CalendarGridAgendaView: CalendarGridAgendaViewComponents = () => null;

CalendarGridAgendaView.AgendaView = AgendaView;

export default CalendarGridAgendaView;
