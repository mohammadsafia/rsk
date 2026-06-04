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
  useState,
} from 'react';

import { type NowLineMode, Skeleton } from '@components/ui';
import { CalendarGridChrome } from './calendar-grid-chrome';
import { CalendarGridMonthView } from './calendar-grid-month-view';
import { CalendarGridTimeView } from './calendar-grid-time-view';

import { type DateInput, UnitOfTime, useDate } from '@hooks/shared';

import { cn } from '@utils';

export type CalendarView = 'day' | 'week' | 'month';

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
};

export type CalendarLegendItem = {
  label: string;
  colorClass: string;
};

export type TimeRange = { startTime: string; endTime: string };

type SlotsByDate = Record<string, TimeRange[]> | null | undefined;

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
  isLoading: boolean;
};

type CalendarGridComponents = (<TEvent>(props: CalendarGridProps<TEvent>) => ReactNode) & {
  Header: typeof CalendarGridChrome.Header;
  Navigation: typeof CalendarGridChrome.Navigation;
  ViewTabs: typeof CalendarGridChrome.ViewTabs;
  ViewToggle: typeof CalendarGridChrome.ViewToggle;
  Picker: typeof CalendarGridChrome.Picker;
  Legend: typeof CalendarGridChrome.Legend;
  EventTemplate: <T>(props: EventTemplateProps<T>) => null;
  PopoverTemplate: <T>(props: PopoverTemplateProps<T>) => null;
  DayView: typeof CalendarGridTimeView.DayView;
  WeekView: typeof CalendarGridTimeView.WeekView;
  MonthView: typeof CalendarGridMonthView.MonthView;
};

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 24;
const DEFAULT_STEP_MINUTES = 30;

const VIEW_TO_UNIT: Record<CalendarView, UnitOfTime> = {
  day: UnitOfTime.DAY,
  week: UnitOfTime.WEEK,
  month: UnitOfTime.MONTH,
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
  events,
  eventAccessors,
  slots,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
  stepMinutes = DEFAULT_STEP_MINUTES,
  showStepLabels = false,
  nowLine = 'in-range',
  isLoading = false,
  className,
  children,
  ...divProps
}: CalendarGridProps<TEvent>) {
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

  const view = controlledView ?? internalView;
  const date = controlledDate !== undefined ? toDate(controlledDate) : internalDate;
  const viewMode = controlledViewMode ?? internalViewMode;

  const range = useMemo<CalendarRange>(() => {
    if (view === 'day') return { startDate: date, endDate: date };

    if (view === 'week') {
      const { startOf, endOf } = toStartAndEndOf(date, constants.UnitOfTime.WEEK);

      return { startDate: startOf, endDate: endOf };
    }

    const month = toStartAndEndOf(date, constants.UnitOfTime.MONTH);
    const gridStart = toStartAndEndOf(month.startOf, constants.UnitOfTime.WEEK).startOf;
    const gridEnd = toStartAndEndOf(month.endOf, constants.UnitOfTime.WEEK).endOf;

    return { startDate: gridStart, endDate: gridEnd };
  }, [view, date, toStartAndEndOf, constants.UnitOfTime.MONTH, constants.UnitOfTime.WEEK]);

  const navigationLabel = useMemo(() => {
    if (view === 'day') return formatDate(date, constants.DateFormats.FULL_DAY_MONTH_DATE);

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

  const slotCoverageDates = useMemo(() => (slots ? new Set(Object.keys(slots)) : new Set<string>()), [slots]);

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

  const goNext = useCallback(() => {
    setDate(addDuration(date, 1, VIEW_TO_UNIT[view]));
  }, [setDate, addDuration, date, view]);

  const goPrev = useCallback(() => {
    setDate(subtractDuration(date, 1, VIEW_TO_UNIT[view]));
  }, [setDate, subtractDuration, date, view]);

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
      eventAccessors,
      renderEvent,
      popoverContent,
      slots,
      slotCoverageDates,
      startHour,
      endHour,
      stepMinutes,
      showStepLabels,
      nowLine,
      isLoading,
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
      eventAccessors,
      renderEvent,
      popoverContent,
      slots,
      slotCoverageDates,
      startHour,
      endHour,
      stepMinutes,
      showStepLabels,
      nowLine,
      isLoading,
    ],
  );

  useEffect(() => {
    onRangeChange?.(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- string keys are the actual change signal; range object recomputes per render due to useDate closure instability
  }, [range.startDate, range.endDate]);

  if (isLoading && events.length === 0) {
    return (
      <div
        data-slot="calendar-grid-skeleton"
        aria-busy="true"
        aria-live="polite"
        className={cn('border-muted-200 bg-background flex min-h-180 flex-col gap-3 overflow-clip rounded-2xl border p-4', className)}
      >
        <Skeleton shape="text" size="md" />

        <Skeleton shape="text" size="xs" />

        <Skeleton shape="banner" size="xl" className="flex-1" />
      </div>
    );
  }

  return (
    <CalendarGridContext.Provider value={contextValue as unknown as CalendarGridContextValue<unknown>}>
      <div
        data-slot="calendar-grid"
        role="application"
        aria-roledescription="calendar"
        className={cn('border-muted-200 bg-background flex max-h-[80dvh] min-h-180 flex-col overflow-clip rounded-2xl border', className)}
        {...divProps}
      >
        {otherChildren}
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
CalendarGrid.EventTemplate = EventTemplate;
CalendarGrid.PopoverTemplate = PopoverTemplate;
CalendarGrid.DayView = CalendarGridTimeView.DayView;
CalendarGrid.WeekView = CalendarGridTimeView.WeekView;
CalendarGrid.MonthView = CalendarGridMonthView.MonthView;

export default CalendarGrid;
