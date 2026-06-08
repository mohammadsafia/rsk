import { type ComponentPropsWithoutRef, type FC, useMemo } from 'react';

import { Tabs, ToggleGroup } from '@components/ui';
import { TooltipButton } from '@components/shared';
import { type CalendarLegendItem, CalendarPicker, type CalendarPickerSelected, useCalendarGridContext } from '@components/calendar';

import { useDate } from '@hooks/shared';

import { cn } from '@utils';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List as ListIcon } from 'lucide-react';

type HeaderProps = ComponentPropsWithoutRef<'div'>;

type LegendProps = ComponentPropsWithoutRef<'div'> & { items: CalendarLegendItem[] };

type CalendarGridChromeComponents = FC & {
  Header: FC<HeaderProps>;
  Navigation: FC;
  ViewTabs: FC;
  ViewToggle: FC;
  Picker: FC;
  Legend: FC<LegendProps>;
};

const Header: FC<HeaderProps> = ({ className, children, ...props }) => (
  <div
    data-slot="calendar-grid-header"
    className={cn('border-muted-200 flex items-center justify-between gap-4 border-b px-4 py-3', className)}
    {...props}
  >
    {children}
  </div>
);

const Navigation: FC = () => {
  const { navigationLabel, goPrev, goNext } = useCalendarGridContext();

  return (
    <div data-slot="calendar-grid-navigation" className="flex items-center gap-2">
      <TooltipButton title="Previous" type="button" variant="ghost" size="icon-sm" onClick={goPrev}>
        <ChevronLeft size={20} className="text-muted-400" />
      </TooltipButton>

      <span className="text-foreground text-sm font-bold">{navigationLabel}</span>

      <TooltipButton title="Next" type="button" variant="ghost" size="icon-sm" onClick={goNext}>
        <ChevronRight size={20} className="text-muted-400" />
      </TooltipButton>
    </div>
  );
};

const ViewTabs: FC = () => {
  const { view, setView } = useCalendarGridContext();

  return (
    <Tabs
      className="min-w-1/3"
      value={view}
      onValueChange={(value) => {
        if (value === 'day' || value === 'week' || value === 'month') setView(value);
      }}
    >
      <Tabs.List>
        <Tabs.Trigger value="day">Day</Tabs.Trigger>

        <Tabs.Trigger value="week">Week</Tabs.Trigger>

        <Tabs.Trigger value="month">Month</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
};

const ViewToggle: FC = () => {
  const { viewMode, setViewMode } = useCalendarGridContext();

  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(value) => {
        if (value === 'calendar' || value === 'list') setViewMode(value);
      }}
    >
      <ToggleGroup.Item value="list" aria-label="List view">
        <ListIcon size={16} />
      </ToggleGroup.Item>

      <ToggleGroup.Item value="calendar" aria-label="Calendar view">
        <CalendarIcon size={16} />
      </ToggleGroup.Item>
    </ToggleGroup>
  );
};

const Picker: FC = () => {
  const { date, setDate, view } = useCalendarGridContext();
  const { toStartAndEndOf, toBoundaryDate, addDuration, toDate, constants } = useDate();

  const selected = useMemo<CalendarPickerSelected>(() => {
    if (view === 'day') return date;

    const { startOf, endOf } = toStartAndEndOf(date, view === 'week' ? constants.UnitOfTime.WEEK : constants.UnitOfTime.MONTH);

    return { from: startOf, to: endOf };
  }, [view, date, toStartAndEndOf, constants.UnitOfTime.WEEK, constants.UnitOfTime.MONTH]);

  return (
    <CalendarPicker
      value={date}
      selected={selected}
      triggerTooltip="Jump to date"
      calendarProps={{ captionLayout: 'dropdown', endMonth: toBoundaryDate(addDuration(toDate(), 10, constants.UnitOfTime.YEAR)) }}
      onChange={setDate}
    />
  );
};

const Legend: FC<LegendProps> = ({ items, className, ...props }) => (
  <div data-slot="calendar-grid-legend" className={cn('flex flex-wrap items-center gap-3 px-3 py-2', className)} {...props}>
    {items.map((item) => (
      <div key={item.label} data-slot="calendar-grid-legend-item" className="flex items-center gap-2">
        <span aria-hidden="true" className={cn('border-muted-200 size-3 shrink-0 rounded-full border', item.colorClass)} />

        <span className="text-muted-foreground text-xs">{item.label}</span>
      </div>
    ))}
  </div>
);

const CalendarGridChrome: CalendarGridChromeComponents = () => null;

CalendarGridChrome.Header = Header;
CalendarGridChrome.Navigation = Navigation;
CalendarGridChrome.ViewTabs = ViewTabs;
CalendarGridChrome.ViewToggle = ViewToggle;
CalendarGridChrome.Picker = Picker;
CalendarGridChrome.Legend = Legend;

export default CalendarGridChrome;
