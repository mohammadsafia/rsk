'use client';

import { type ComponentPropsWithoutRef, type FC, useMemo } from 'react';

import { IconButton, Select, ToggleGroup } from '@components/ui';
import {
  type CalendarLegendItem,
  CalendarPicker,
  type CalendarView,
  type CalendarPickerSelected,
  useCalendarGridContext,
} from '@components/calendar';

import { useAppTranslation, useDate } from '@hooks/shared';

import { cn } from '@utils';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List as ListIcon } from 'lucide-react';

type HeaderProps = ComponentPropsWithoutRef<'div'>;

type LegendProps = ComponentPropsWithoutRef<'div'> & { items: CalendarLegendItem[] };

type CalendarGridChromeComponents = FC & {
  Header: FC<HeaderProps>;
  Navigation: FC;
  ViewTabs: FC<{ views?: CalendarView[] }>;
  ViewToggle: FC;
  Picker: FC;
  Legend: FC<LegendProps>;
  ResourceFilter: FC;
};

const Header: FC<HeaderProps> = ({ className, children, ...props }) => (
  <div
    data-slot="calendar-grid-header"
    className={cn('border-border-subtle flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3', className)}
    {...props}
  >
    {children}
  </div>
);

const Navigation: FC = () => {
  const { t } = useAppTranslation('common');
  const { navigationLabel, goPrev, goNext } = useCalendarGridContext();

  return (
    <div data-slot="calendar-grid-navigation" className="flex items-center gap-2">
      <IconButton size="sm" type="button" aria-label={t('previous')} onClick={goPrev}>
        <ChevronLeft size={20} className="text-fg-muted rtl:rotate-180" />
      </IconButton>

      <span className="text-fg text-sm font-bold">{navigationLabel}</span>

      <IconButton size="sm" type="button" aria-label={t('next')} onClick={goNext}>
        <ChevronRight size={20} className="text-fg-muted rtl:rotate-180" />
      </IconButton>
    </div>
  );
};

const DEFAULT_VIEWS: CalendarView[] = ['day', 'week', 'month'];

/** View tabs. Agenda is opt-in: `views={['day', 'week', 'month', 'agenda']}`. */
const ViewTabs: FC<{ views?: CalendarView[] }> = ({ views = DEFAULT_VIEWS }) => {
  const { t } = useAppTranslation('common');
  const { view, setView } = useCalendarGridContext();

  // A view switch has no panels: it's a single choice (radio items), not tabs.
  return (
    <ToggleGroup
      type="single"
      variant="ghost"
      size="sm"
      aria-label={t('calendar.views')}
      className="min-w-1/3"
      value={view}
      onValueChange={(value) => {
        const next = views.find((candidate) => candidate === value);
        if (next) setView(next);
      }}
    >
      {views.map((candidate) => (
        <ToggleGroup.Item key={candidate} value={candidate} className="flex-1">
          {t(`calendar.${candidate}`)}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup>
  );
};

const ViewToggle: FC = () => {
  const { t } = useAppTranslation('common');
  const { viewMode, setViewMode } = useCalendarGridContext();

  return (
    <ToggleGroup
      type="single"
      variant="ghost"
      aria-label={t('calendar.layout')}
      value={viewMode}
      onValueChange={(value) => {
        if (value === 'calendar' || value === 'list') setViewMode(value);
      }}
    >
      <ToggleGroup.Item value="list" aria-label={t('calendar.listView')}>
        <ListIcon aria-hidden="true" />
      </ToggleGroup.Item>

      <ToggleGroup.Item value="calendar" aria-label={t('calendar.calendarView')}>
        <CalendarIcon aria-hidden="true" />
      </ToggleGroup.Item>
    </ToggleGroup>
  );
};

const Picker: FC = () => {
  const { t } = useAppTranslation('common');
  const { date, setDate, view } = useCalendarGridContext();
  const { toStartAndEndOf, toBoundaryDate, addDuration, toDate, constants } = useDate();

  const selected = useMemo<CalendarPickerSelected>(() => {
    if (view === 'day' || view === 'agenda') return date;

    const { startOf, endOf } = toStartAndEndOf(date, view === 'week' ? constants.UnitOfTime.WEEK : constants.UnitOfTime.MONTH);

    return { from: startOf, to: endOf };
  }, [view, date, toStartAndEndOf, constants.UnitOfTime.WEEK, constants.UnitOfTime.MONTH]);

  return (
    <CalendarPicker
      value={date}
      selected={selected}
      triggerTooltip={t('calendar.jumpToDate')}
      calendarProps={{ captionLayout: 'dropdown', endMonth: toBoundaryDate(addDuration(toDate(), 10, constants.UnitOfTime.YEAR)) }}
      onChange={setDate}
    />
  );
};

const Legend: FC<LegendProps> = ({ items, className, ...props }) => (
  <div data-slot="calendar-grid-legend" className={cn('flex flex-wrap items-center gap-3 px-3 py-2', className)} {...props}>
    {items.map((item) => (
      <div key={item.label} data-slot="calendar-grid-legend-item" className="flex items-center gap-2">
        <span aria-hidden="true" className={cn('border-border-subtle size-3 shrink-0 rounded-full border', item.colorClass)} />

        <span className="text-fg-muted text-xs">{item.label}</span>
      </div>
    ))}
  </div>
);

const ALL_RESOURCES = '__all__';

/** Week view: pick one resource or all of them. Renders nothing in other views or without resources. */
const ResourceFilter: FC = () => {
  const { t } = useAppTranslation('common');
  const { resources, resourceFilter, setResourceFilter, view } = useCalendarGridContext();

  if (view !== 'week' || resources.length === 0) return null;

  return (
    <Select value={resourceFilter ?? ALL_RESOURCES} onValueChange={(value) => setResourceFilter(value === ALL_RESOURCES ? null : value)}>
      <Select.Trigger size="sm" aria-label={t('calendar.resource')} className="w-48">
        <Select.Value />
      </Select.Trigger>

      <Select.Content>
        <Select.Item value={ALL_RESOURCES}>{t('calendar.allResources')}</Select.Item>

        {resources.map((resource) => (
          <Select.Item key={resource.id} value={resource.id}>
            {resource.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};

const CalendarGridChrome: CalendarGridChromeComponents = () => null;

CalendarGridChrome.Header = Header;
CalendarGridChrome.Navigation = Navigation;
CalendarGridChrome.ViewTabs = ViewTabs;
CalendarGridChrome.ViewToggle = ViewToggle;
CalendarGridChrome.Picker = Picker;
CalendarGridChrome.Legend = Legend;
CalendarGridChrome.ResourceFilter = ResourceFilter;

export default CalendarGridChrome;
