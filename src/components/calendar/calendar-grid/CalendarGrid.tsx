'use client';

import {
  Children,
  type ComponentPropsWithoutRef,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { type NowLineMode, Skeleton } from '@components/ui';
import { CalendarGridAgendaView } from './calendar-grid-agenda-view';
import { CalendarGridChrome } from './calendar-grid-chrome';
import { CalendarGridMonthView } from './calendar-grid-month-view';
import { CalendarGridTimeView } from './calendar-grid-time-view';

import { type DateInput, toast, UnitOfTime, useAppTranslation, useDate, useNow } from '@hooks/shared';

import { cn } from '@utils';

import { type CalendarSlots, slotDates } from './scheduling';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export type CalendarViewMode = 'calendar' | 'list';

export type EventTimeStatus = 'past' | 'current' | 'future';

export type CalendarRange = {
  startDate: string;
  endDate: string;
};

export type CalendarAccessors<T> = {
  getId: (event: T) => string;
  getStartTime: (event: T) => string;
  getEndTime: (event: T) => string;
  /** The resource (doctor, room…) an event belongs to; used by `resources` columns and the week filter. */
  getResourceId?: (event: T) => string | undefined;
  /** Puts an event in the all-day row. Events spanning midnight go there anyway. */
  isAllDay?: (event: T) => boolean;
};

export type CalendarResource = { id: string; label: string; avatar?: string };

/** A selected empty range, as local wall times with offset (`2026-10-16T10:00:00+03:00`). */
export type CalendarSlot = { start: string; end: string; resourceId?: string };

/** A move or resize to save; reject the promise to put the event back. */
export type CalendarEventChange<T> = { event: T; start: string; end: string; resourceId?: string };

type Override = {
  start: string;
  end: string;
  resourceId?: string;
  settled: boolean;
  /** Identifies the commit that wrote this override; replies from older commits must not touch it. */
  token: number;
  /** What to show if this commit is rejected: the last saved override, or nothing (the event's own times). */
  fallback?: Override;
};

export type CalendarLegendItem = {
  label: string;
  colorClass: string;
};

export type TimeRange = { startTime: string; endTime: string };

/** Availability by date (`{ '2026-10-16': [...] }`) or by resource then date (`{ haddad: { '2026-10-16': [...] } }`). */
type SlotsByDate = CalendarSlots | null | undefined;

type EventTemplateProps<TEvent> = {
  children: (event: TEvent, status: EventTimeStatus) => ReactNode;
};

type PopoverTemplateProps<TEvent> = {
  children: (event: TEvent, onClose: () => void) => ReactNode;
};

export type CalendarGridProps<TEvent> = {
  initialView?: CalendarView;
  initialDate?: DateInput;
  view?: CalendarView;
  date?: DateInput;
  onViewChange?: (view: CalendarView) => void;
  onDateChange?: (iso: string) => void;
  onRangeChange?: (range: CalendarRange) => void;
  initialViewMode?: CalendarViewMode;
  viewMode?: CalendarViewMode;
  onViewModeChange?: (mode: CalendarViewMode) => void;
  events: TEvent[];
  eventAccessors: CalendarAccessors<TEvent>;
  slots?: SlotsByDate;
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
  showStepLabels?: boolean;
  nowLine?: NowLineMode;
  isLoading?: boolean;
  /** Day view shows one column per resource; week view filters by `resourceFilter`. */
  resources?: CalendarResource[];
  resourceFilter?: string | null;
  onResourceFilterChange?: (resourceId: string | null) => void;
  /** Days the agenda view lists and pages by. @default 7 */
  agendaDays?: number;
  /** Click or drag on empty cells (or Enter on a focused cell) to select a range. */
  onSlotSelect?: (slot: CalendarSlot) => void;
  /** Let selection cover cells outside `slots`. @default false */
  allowOutsideAvailability?: boolean;
  /** Makes events draggable and resizable; shown optimistically, reverted with a toast if the promise rejects. */
  onEventChange?: (change: CalendarEventChange<TEvent>) => Promise<void> | void;
  /** Locks events (e.g. past ones) when `onEventChange` is set. */
  canEdit?: (event: TEvent) => boolean;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

type CalendarGridContextValue<T> = {
  view: CalendarView;
  date: string;
  viewMode: CalendarViewMode;
  setView: (v: CalendarView) => void;
  setDate: (d: DateInput) => void;
  setViewMode: (m: CalendarViewMode) => void;
  range: CalendarRange;
  navigationLabel: string;
  goNext: () => void;
  goPrev: () => void;
  goToday: () => void;
  events: T[];
  eventAccessors: CalendarAccessors<T>;
  renderEvent: (event: T, status: EventTimeStatus) => ReactNode;
  popoverContent: ((event: T, onClose: () => void) => ReactNode) | undefined;
  slots: SlotsByDate;
  slotCoverageDates: Set<string>;
  startHour: number;
  endHour: number;
  stepMinutes: number;
  showStepLabels: boolean;
  nowLine: NowLineMode;
  /** The current time, ticking once a minute (use it instead of a zero-argument toDate() while rendering). */
  now: Date;
  isLoading: boolean;
  resources: CalendarResource[];
  resourceFilter: string | null;
  setResourceFilter: (resourceId: string | null) => void;
  agendaDays: number;
  onSlotSelect: ((slot: CalendarSlot) => void) | undefined;
  allowOutsideAvailability: boolean;
  isEditable: (event: T) => boolean;
  commitChange: (change: CalendarEventChange<T>) => Promise<void>;
  announce: (message: string) => void;
};

type CalendarGridComponents = (<TEvent>(props: CalendarGridProps<TEvent>) => ReactNode) & {
  Header: typeof CalendarGridChrome.Header;
  Navigation: typeof CalendarGridChrome.Navigation;
  ViewTabs: typeof CalendarGridChrome.ViewTabs;
  ViewToggle: typeof CalendarGridChrome.ViewToggle;
  Picker: typeof CalendarGridChrome.Picker;
  Legend: typeof CalendarGridChrome.Legend;
  ResourceFilter: typeof CalendarGridChrome.ResourceFilter;
  EventTemplate: <T>(props: EventTemplateProps<T>) => null;
  PopoverTemplate: <T>(props: PopoverTemplateProps<T>) => null;
  DayView: typeof CalendarGridTimeView.DayView;
  WeekView: typeof CalendarGridTimeView.WeekView;
  MonthView: typeof CalendarGridMonthView.MonthView;
  AgendaView: typeof CalendarGridAgendaView.AgendaView;
};

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 24;
const DEFAULT_STEP_MINUTES = 30;

const DEFAULT_AGENDA_DAYS = 7;

const VIEW_TO_UNIT: Record<CalendarView, UnitOfTime> = {
  day: UnitOfTime.DAY,
  week: UnitOfTime.WEEK,
  month: UnitOfTime.MONTH,
  agenda: UnitOfTime.DAY,
};

const CalendarGridContext = createContext<CalendarGridContextValue<unknown> | null>(null);

export const useCalendarGridContext = <T = unknown,>() => {
  const context = useContext(CalendarGridContext) as CalendarGridContextValue<T> | null;

  if (!context) throw new Error('CalendarGrid subcomponents must be used within <CalendarGrid>');

  return context;
};

const EventTemplate = <T,>(_: EventTemplateProps<T>): null => null;

const PopoverTemplate = <T,>(_: PopoverTemplateProps<T>): null => null;

function CalendarGridRoot<TEvent>({
  initialView = 'month',
  initialDate,
  view: controlledView,
  date: controlledDate,
  onViewChange,
  onDateChange,
  onRangeChange,
  initialViewMode = 'calendar',
  viewMode: controlledViewMode,
  onViewModeChange,
  events: rawEvents,
  eventAccessors,
  slots,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
  stepMinutes = DEFAULT_STEP_MINUTES,
  showStepLabels = false,
  nowLine = 'in-range',
  isLoading = false,
  resources,
  resourceFilter: controlledResourceFilter,
  onResourceFilterChange,
  agendaDays = DEFAULT_AGENDA_DAYS,
  onSlotSelect,
  allowOutsideAvailability = false,
  onEventChange,
  canEdit,
  className,
  children,
  ...divProps
}: CalendarGridProps<TEvent>) {
  // An unparseable start/end would throw inside the date grouping; skip such events instead of blanking the calendar.
  const events = useMemo(
    () =>
      rawEvents.filter(
        (event) =>
          !Number.isNaN(Date.parse(eventAccessors.getStartTime(event))) && !Number.isNaN(Date.parse(eventAccessors.getEndTime(event))),
      ),
    [rawEvents, eventAccessors],
  );

  const { t } = useAppTranslation('common');
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [announcement, setAnnouncement] = useState('');

  // A saved change stays applied until the consumer hands over new events, so a refetch never flashes back.
  useEffect(() => {
    setOverrides((current) => {
      const pending = Object.entries(current).filter(([, override]) => !override.settled);
      return pending.length === Object.keys(current).length ? current : Object.fromEntries(pending);
    });
  }, [rawEvents]);

  const accessors = useMemo<CalendarAccessors<TEvent>>(() => {
    if (Object.keys(overrides).length === 0) return eventAccessors;
    const find = (event: TEvent) => overrides[eventAccessors.getId(event)];
    return {
      ...eventAccessors,
      getStartTime: (event) => find(event)?.start ?? eventAccessors.getStartTime(event),
      getEndTime: (event) => find(event)?.end ?? eventAccessors.getEndTime(event),
      getResourceId: (event) => {
        const override = find(event);
        return override ? override.resourceId : eventAccessors.getResourceId?.(event);
      },
    };
  }, [eventAccessors, overrides]);

  const commitToken = useRef(0);

  /**
   * Shows a change at once and saves it. Overlapping changes to one event are ordered by token: a reply only settles
   * or reverts the override it wrote, and a rejection falls back to the last saved position, not the original one.
   */
  const commitChange = useCallback(
    async (change: CalendarEventChange<TEvent>) => {
      const id = eventAccessors.getId(change.event);
      const token = (commitToken.current += 1);
      setOverrides((current) => {
        const previous = current[id];
        const fallback = previous?.settled ? previous : previous?.fallback;
        return {
          ...current,
          [id]: { start: change.start, end: change.end, resourceId: change.resourceId, settled: false, token, fallback },
        };
      });
      try {
        await onEventChange?.(change);
        setOverrides((current) => {
          const override = current[id];
          if (!override) return current;
          if (override.token === token) return { ...current, [id]: { ...override, settled: true, fallback: undefined } };
          // A newer change is still pending: this one is now its saved fallback.
          return {
            ...current,
            [id]: { ...override, fallback: { start: change.start, end: change.end, resourceId: change.resourceId, settled: true, token } },
          };
        });
      } catch {
        setOverrides((current) => {
          const override = current[id];
          if (!override || override.token !== token) return current;
          const { [id]: _reverted, ...rest } = current;
          return override.fallback ? { ...rest, [id]: override.fallback } : rest;
        });
        toast({ title: t('calendar.changeFailed'), description: t('calendar.changeFailedHint'), tone: 'danger' });
      }
    },
    [eventAccessors, onEventChange, t],
  );

  const isEditable = useCallback((event: TEvent) => !!onEventChange && (canEdit?.(event) ?? true), [onEventChange, canEdit]);

  const childArray = Children.toArray(children);
  const eventTemplateEl = childArray.find((c) => isValidElement(c) && c.type === EventTemplate);
  const popoverTemplateEl = childArray.find((c) => isValidElement(c) && c.type === PopoverTemplate);
  const renderEvent = (eventTemplateEl as ReactElement<EventTemplateProps<TEvent>> | undefined)?.props.children;
  const popoverContent = (popoverTemplateEl as ReactElement<PopoverTemplateProps<TEvent>> | undefined)?.props.children;
  const otherChildren = childArray.filter((c) => c !== eventTemplateEl && c !== popoverTemplateEl);

  if (events.length > 0 && !renderEvent) {
    throw new Error('CalendarGrid: <CalendarGrid.EventTemplate> is required when events are provided.');
  }

  const { toStartAndEndOf, addDuration, subtractDuration, formatDate, toDate, constants } = useDate();

  const [internalView, setInternalView] = useState<CalendarView>(initialView);
  const [internalDate, setInternalDate] = useState<string>(() => toDate(initialDate));
  const [internalViewMode, setInternalViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [internalResourceFilter, setInternalResourceFilter] = useState<string | null>(null);

  const view = controlledView ?? internalView;
  const now = useNow();
  const date = controlledDate !== undefined ? toDate(controlledDate) : internalDate;
  const viewMode = controlledViewMode ?? internalViewMode;
  const resourceFilter = controlledResourceFilter !== undefined ? controlledResourceFilter : internalResourceFilter;
  const resourceList = useMemo(() => resources ?? [], [resources]);

  const range = useMemo<CalendarRange>(() => {
    if (view === 'day') return { startDate: date, endDate: date };

    if (view === 'agenda') return { startDate: date, endDate: toDate(addDuration(date, agendaDays - 1, constants.UnitOfTime.DAY)) };

    if (view === 'week') {
      const { startOf, endOf } = toStartAndEndOf(date, constants.UnitOfTime.WEEK);

      return { startDate: startOf, endDate: endOf };
    }

    const month = toStartAndEndOf(date, constants.UnitOfTime.MONTH);
    const gridStart = toStartAndEndOf(month.startOf, constants.UnitOfTime.WEEK).startOf;
    const gridEnd = toStartAndEndOf(month.endOf, constants.UnitOfTime.WEEK).endOf;

    return { startDate: gridStart, endDate: gridEnd };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- addDuration/toDate are recreated per render (useDate); the inputs are listed
  }, [view, date, agendaDays, toStartAndEndOf, constants.UnitOfTime.MONTH, constants.UnitOfTime.WEEK, constants.UnitOfTime.DAY]);

  const navigationLabel = useMemo(() => {
    if (view === 'day') return formatDate(date, constants.DateFormats.FULL_DAY_MONTH_DATE);

    if (view === 'agenda') {
      return `${formatDate(range.startDate, constants.DateFormats.DAY_SHORT_MONTH)} – ${formatDate(range.endDate, constants.DateFormats.DAY_SHORT_MONTH)}`;
    }

    if (view === 'week') {
      const startMonth = formatDate(range.startDate, constants.DateFormats.SHORT_MONTH);
      const endMonth = formatDate(range.endDate, constants.DateFormats.SHORT_MONTH);

      if (startMonth !== endMonth) {
        const year = formatDate(range.endDate, constants.DateFormats.YEAR);

        return `${startMonth} - ${endMonth}, ${year}`;
      }
    }

    return formatDate(date, constants.DateFormats.FULL_MONTH_YEAR);
  }, [view, date, range, formatDate, constants]);

  const slotCoverageDates = useMemo(() => (slots ? slotDates(slots) : new Set<string>()), [slots]);

  const setView = useCallback(
    (v: CalendarView) => {
      onViewChange?.(v);
      if (controlledView === undefined) setInternalView(v);
    },
    [controlledView, onViewChange],
  );

  const setDate = useCallback(
    (d: DateInput) => {
      const iso = toDate(d);

      onDateChange?.(iso);

      if (controlledDate === undefined) setInternalDate(iso);
    },
    [controlledDate, onDateChange, toDate],
  );

  const setViewMode = useCallback(
    (m: CalendarViewMode) => {
      onViewModeChange?.(m);
      if (controlledViewMode === undefined) setInternalViewMode(m);
    },
    [controlledViewMode, onViewModeChange],
  );

  const setResourceFilter = useCallback(
    (resourceId: string | null) => {
      onResourceFilterChange?.(resourceId);
      if (controlledResourceFilter === undefined) setInternalResourceFilter(resourceId);
    },
    [controlledResourceFilter, onResourceFilterChange],
  );

  const goNext = useCallback(() => {
    setDate(addDuration(date, view === 'agenda' ? agendaDays : 1, VIEW_TO_UNIT[view]));
  }, [setDate, addDuration, date, view, agendaDays]);

  const goPrev = useCallback(() => {
    setDate(subtractDuration(date, view === 'agenda' ? agendaDays : 1, VIEW_TO_UNIT[view]));
  }, [setDate, subtractDuration, date, view, agendaDays]);

  const goToday = useCallback(() => {
    setDate(toDate());
  }, [setDate, toDate]);

  const contextValue = useMemo(
    () => ({
      view,
      date,
      viewMode,
      setView,
      setDate,
      setViewMode,
      range,
      navigationLabel,
      goNext,
      goPrev,
      goToday,
      events,
      eventAccessors: accessors,
      renderEvent,
      popoverContent,
      slots,
      slotCoverageDates,
      startHour,
      endHour,
      stepMinutes,
      showStepLabels,
      nowLine,
      now,
      isLoading,
      resources: resourceList,
      resourceFilter,
      setResourceFilter,
      agendaDays,
      onSlotSelect,
      allowOutsideAvailability,
      isEditable,
      commitChange,
      announce: setAnnouncement,
    }),
    [
      view,
      date,
      viewMode,
      setView,
      setDate,
      setViewMode,
      range,
      navigationLabel,
      goNext,
      goPrev,
      goToday,
      events,
      accessors,
      renderEvent,
      popoverContent,
      slots,
      slotCoverageDates,
      startHour,
      endHour,
      stepMinutes,
      showStepLabels,
      nowLine,
      now,
      isLoading,
      resourceList,
      resourceFilter,
      setResourceFilter,
      agendaDays,
      onSlotSelect,
      allowOutsideAvailability,
      isEditable,
      commitChange,
    ],
  );

  useEffect(() => {
    onRangeChange?.(range);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- string keys are the actual change signal; range object recomputes per render due to useDate closure instability
  }, [range.startDate, range.endDate]);

  if (isLoading && events.length === 0) {
    return (
      <div
        data-slot="calendar-grid-skeleton"
        aria-busy="true"
        aria-live="polite"
        className={cn('border-border bg-surface flex min-h-180 flex-col gap-3 overflow-clip rounded-lg border p-4', className)}
      >
        <Skeleton />

        <Skeleton size="sm" />

        <Skeleton shape="block" size="lg" className="flex-1" />
      </div>
    );
  }

  return (
    <CalendarGridContext.Provider value={contextValue as unknown as CalendarGridContextValue<unknown>}>
      <div
        data-slot="calendar-grid"
        role="application"
        aria-roledescription="calendar"
        className={cn('border-border bg-surface flex max-h-[80dvh] min-h-180 flex-col overflow-clip rounded-lg border', className)}
        {...divProps}
      >
        {otherChildren}

        <div data-slot="calendar-grid-announcer" aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </div>
    </CalendarGridContext.Provider>
  );
}

const CalendarGrid = CalendarGridRoot as CalendarGridComponents;

CalendarGrid.Header = CalendarGridChrome.Header;
CalendarGrid.Navigation = CalendarGridChrome.Navigation;
CalendarGrid.ViewTabs = CalendarGridChrome.ViewTabs;
CalendarGrid.ViewToggle = CalendarGridChrome.ViewToggle;
CalendarGrid.Picker = CalendarGridChrome.Picker;
CalendarGrid.Legend = CalendarGridChrome.Legend;
CalendarGrid.ResourceFilter = CalendarGridChrome.ResourceFilter;
CalendarGrid.EventTemplate = EventTemplate;
CalendarGrid.PopoverTemplate = PopoverTemplate;
CalendarGrid.DayView = CalendarGridTimeView.DayView;
CalendarGrid.WeekView = CalendarGridTimeView.WeekView;
CalendarGrid.MonthView = CalendarGridMonthView.MonthView;
CalendarGrid.AgendaView = CalendarGridAgendaView.AgendaView;

export default CalendarGrid;
