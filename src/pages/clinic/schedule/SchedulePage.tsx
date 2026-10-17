import { type FC, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

import type { VisitStatus } from '@api/clinic';
import { CalendarGrid, type CalendarEventChange, type CalendarRange, type CalendarSlot, type CalendarView } from '@components/calendar';
import { Alert, Badge, Button } from '@components/ui';
import { PageHeader } from '@components/shared';

import { toast, useAppTranslation, useDate } from '@hooks/shared';
import { patientPath } from '@routes';

import { cn } from '@utils';

import { useDoctors, useLeave, usePatients, useSetVisitStatus, useUpdateVisit, useVisits } from '../queries';
import { VISIT_TONE } from '../shared/status';
import { useClinicToday } from '../shared/useClinicToday';
import { useLocalized } from '../shared/useLocalized';
import { type ScheduleEvent, scheduleAccessors, toResources, toScheduleEvents, toSlots } from './adapters';
import NewVisitSheet from './NewVisitSheet';

const VIEWS = ['day', 'week', 'month', 'agenda'] as const;
const VIEW_PARAM = parseAsStringLiteral(VIEWS).withDefault('day');

/** Status colours for visit blocks: soft semantic fills, never side stripes. */
const STATUS_FILL: Record<VisitStatus, string> = {
  scheduled: 'bg-info-subtle',
  arrived: 'bg-accent-subtle',
  completed: 'bg-success-subtle',
  'no-show': 'bg-warning-subtle',
  cancelled: 'bg-surface-sunken',
};

type Action = { status: VisitStatus; label: string };

const VisitPopover: FC<{
  event: Extract<ScheduleEvent, { kind: 'visit' }>;
  patientName: string;
  doctorName: string;
  onClose: () => void;
}> = ({ event, patientName, doctorName, onClose }) => {
  const { t } = useAppTranslation('clinic');
  const { toDate, constants } = useDate();
  const setStatus = useSetVisitStatus();
  const { visit } = event;

  const actions: Action[] =
    visit.status === 'scheduled'
      ? [
          { status: 'arrived', label: t('schedule.actions.arrived') },
          { status: 'no-show', label: t('schedule.actions.noShow') },
        ]
      : visit.status === 'arrived'
        ? [{ status: 'completed', label: t('schedule.actions.complete') }]
        : [];

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <Link to={patientPath(visit.patientId)} className="text-fg focus-ring rounded-sm text-sm font-semibold hover:underline">
          {patientName}
        </Link>
        <Badge tone={VISIT_TONE[visit.status]}>{t(`schedule.status.${visit.status}`)}</Badge>
      </div>
      <p className="text-fg-muted text-sm">
        <bdi dir="ltr">{`${toDate(visit.start, constants.TimeFormats.HOUR_MINUTES_12)} – ${toDate(visit.end, constants.TimeFormats.HOUR_MINUTES_12)}`}</bdi>{' '}
        · {doctorName} · {t(`schedule.types.${visit.type}`)}
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            size="sm"
            variant="outline"
            loading={setStatus.isLoading && setStatus.variables?.status === action.status}
            onClick={async () => {
              try {
                await setStatus.mutateAsync({ id: visit.id, status: action.status });
                toast({ title: t('schedule.actions.updated'), tone: 'success' });
                onClose();
              } catch {
                toast({ title: t('errors.forced'), tone: 'danger' });
              }
            }}
          >
            {action.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" asChild>
          <Link to={patientPath(visit.patientId)}>{t('schedule.actions.openProfile')}</Link>
        </Button>
      </div>
    </div>
  );
};

/** The clinic's week by doctor: book from free slots, drag to reschedule, and update a visit's status from its popover. */
function SchedulePage() {
  const { t } = useAppTranslation('clinic');
  const localize = useLocalized();
  const { todayKey, now } = useClinicToday();
  const [view, setView] = useQueryState('view', VIEW_PARAM);
  const [date, setDate] = useQueryState('date', parseAsString.withDefault(todayKey));
  const [patientParam] = useQueryState('patient', parseAsString);
  const [range, setRange] = useState<CalendarRange>({ startDate: date, endDate: date });
  const [slot, setSlot] = useState<CalendarSlot | null>(null);

  const visits = useVisits({ from: range.startDate, to: range.endDate });
  const leave = useLeave({ from: range.startDate, to: range.endDate });
  const doctors = useDoctors();
  const patients = usePatients();
  const updateVisit = useUpdateVisit();

  const events = useMemo(() => toScheduleEvents(visits.data ?? [], leave.data ?? []), [visits.data, leave.data]);
  const resources = useMemo(
    () => toResources(doctors.data ?? [], localize),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize follows the language, which `t` tracks
    [doctors.data, t],
  );
  const slots = useMemo(() => toSlots(doctors.data ?? [], leave.data ?? [], range), [doctors.data, leave.data, range]);
  const names = useMemo(() => new Map((patients.data ?? []).map((patient) => [patient.id, patient.name])), [patients.data]);
  const doctorNames = useMemo(() => new Map((doctors.data ?? []).map((doctor) => [doctor.id, doctor.name])), [doctors.data]);

  const canEdit = useCallback(
    (event: ScheduleEvent) =>
      event.kind === 'visit' &&
      (event.visit.status === 'scheduled' || event.visit.status === 'arrived') &&
      Date.parse(event.end) > now.getTime(),
    [now],
  );

  // A rejection (e.g. a double booking) makes CalendarGrid put the visit back and say so.
  const onEventChange = useCallback(
    async ({ event, start, end, resourceId }: CalendarEventChange<ScheduleEvent>) => {
      await updateVisit.mutateAsync({ id: event.id, patch: { start, end, doctorId: resourceId ?? event.doctorId } });
    },
    [updateVisit],
  );

  const failed = visits.isError || leave.isError || doctors.isError || patients.isError;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title={t('schedule.title')} description={t('schedule.description')} />

      {failed ? (
        <Alert tone="danger">
          <Alert.Title>{t('schedule.error.title')}</Alert.Title>
          <Alert.Description className="flex flex-wrap items-center gap-3">
            {t('schedule.error.description')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                for (const query of [visits, leave, doctors, patients]) if (query.isError) void query.refetch();
              }}
            >
              {t('retry')}
            </Button>
          </Alert.Description>
        </Alert>
      ) : null}

      <CalendarGrid<ScheduleEvent>
        className="min-h-0 flex-1"
        view={view as CalendarView}
        onViewChange={(next) => void setView(next)}
        date={date}
        onDateChange={(next) => void setDate(next === todayKey ? null : next)}
        onRangeChange={setRange}
        events={events}
        eventAccessors={scheduleAccessors}
        resources={resources}
        slots={slots}
        startHour={7}
        endHour={18}
        stepMinutes={15}
        isLoading={(visits.isLoading || doctors.isLoading) && events.length === 0}
        onSlotSelect={setSlot}
        onEventChange={onEventChange}
        canEdit={canEdit}
      >
        <CalendarGrid.Header>
          <CalendarGrid.Navigation />
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <CalendarGrid.ResourceFilter />
            <CalendarGrid.ViewTabs views={[...VIEWS]} />
            <CalendarGrid.Picker />
          </div>
        </CalendarGrid.Header>

        <CalendarGrid.EventTemplate<ScheduleEvent>>
          {(event, status) =>
            event.kind === 'leave' ? (
              <span className="bg-surface-sunken text-fg-muted flex size-full items-center rounded-md px-1.5 text-xs">
                {t(event.leave.reason === 'leave' ? 'schedule.onLeave' : 'schedule.conference')}
              </span>
            ) : (
              <span
                className={cn(
                  'text-fg flex size-full flex-col overflow-hidden rounded-md px-1.5 py-1 text-xs',
                  STATUS_FILL[event.visit.status],
                  status === 'past' && 'opacity-70',
                )}
              >
                <span className="truncate font-medium">{localize(names.get(event.visit.patientId))}</span>
                <span className="text-fg-muted truncate">{t(`schedule.types.${event.visit.type}`)}</span>
              </span>
            )
          }
        </CalendarGrid.EventTemplate>

        <CalendarGrid.PopoverTemplate<ScheduleEvent>>
          {(event, onClose) =>
            event.kind === 'visit' ? (
              <VisitPopover
                event={event}
                patientName={localize(names.get(event.visit.patientId))}
                doctorName={localize(doctorNames.get(event.doctorId))}
                onClose={onClose}
              />
            ) : (
              <p className="text-fg-muted p-4 text-sm">{localize(doctorNames.get(event.doctorId))}</p>
            )
          }
        </CalendarGrid.PopoverTemplate>

        <CalendarGrid.DayView />
        <CalendarGrid.WeekView />
        <CalendarGrid.MonthView />
        <CalendarGrid.AgendaView />
      </CalendarGrid>

      <NewVisitSheet slot={slot} preselectedPatientId={patientParam} onClose={() => setSlot(null)} />
    </div>
  );
}

export default SchedulePage;
