import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { ClinicError, type VisitType } from '@api/clinic';
import type { CalendarSlot } from '@components/calendar';
import { Button, Sheet } from '@components/ui';
import { FormCombobox, FormContainer, FormSelect, FormTextarea } from '@components/forms';

import { toast, useAppTranslation, useDate } from '@hooks/shared';

import { useCreateVisit, useDoctors, usePatients } from '../queries';
import { useLocalized } from '../shared/useLocalized';

const TYPES: VisitType[] = ['consultation', 'follow-up', 'procedure', 'check-up'];

type VisitForm = { patientId: string | null; type: VisitType; notes: string };
type PatientOption = { id: string; name: string };

/** Books a visit into the slot picked on the schedule; `preselectedPatientId` comes from ?patient=. */
function NewVisitSheet({
  slot,
  preselectedPatientId,
  onClose,
}: {
  slot: CalendarSlot | null;
  preselectedPatientId: string | null;
  onClose: () => void;
}) {
  const { t } = useAppTranslation('clinic');
  const { toDate, constants } = useDate();
  const localize = useLocalized();
  const patients = usePatients();
  const doctors = useDoctors();
  const create = useCreateVisit();

  const options = useMemo<PatientOption[]>(
    () => (patients.data ?? []).map((patient) => ({ id: patient.id, name: localize(patient.name) })),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize follows the language, which `t` tracks
    [patients.data, t],
  );
  const knownPatient = preselectedPatientId && options.some((option) => option.id === preselectedPatientId) ? preselectedPatientId : null;

  const schema = useMemo(
    () =>
      z.object({
        patientId: z
          .string({ required_error: t('schedule.newVisit.patientRequired'), invalid_type_error: t('schedule.newVisit.patientRequired') })
          .min(1, t('schedule.newVisit.patientRequired')),
        type: z.enum(['consultation', 'follow-up', 'procedure', 'check-up']),
        notes: z.string(),
      }),
    [t],
  );
  const form = useForm<VisitForm>({
    resolver: zodResolver(schema),
    defaultValues: { patientId: knownPatient, type: 'consultation', notes: '' },
  });

  // Each slot starts a fresh form, with the ?patient= preselection once the patients have loaded.
  useEffect(() => {
    if (slot) form.reset({ patientId: knownPatient, type: 'consultation', notes: '' });
  }, [slot, knownPatient, form]);

  const doctor = localize(doctors.data?.find((d) => d.id === slot?.resourceId)?.name);
  const when = slot
    ? t('schedule.newVisit.when', {
        day: toDate(slot.start, constants.DateFormats.DAY_SHORT_MONTH),
        start: toDate(slot.start, constants.TimeFormats.HOUR_MINUTES_12),
        end: toDate(slot.end, constants.TimeFormats.HOUR_MINUTES_12),
        doctor,
      })
    : '';

  return (
    <Sheet open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <Sheet.Content side="end" size="md" title={t('schedule.newVisit.title')} description={<bdi>{when}</bdi>}>
        <FormContainer
          formContext={form}
          className="flex min-h-0 flex-1 flex-col"
          onSuccess={async (values) => {
            if (!slot?.resourceId || !values.patientId) return;
            try {
              await create.mutateAsync({
                patientId: values.patientId,
                doctorId: slot.resourceId,
                type: values.type,
                start: slot.start,
                end: slot.end,
                notes: values.notes.trim() || null,
              });
              toast({ title: t('schedule.newVisit.booked'), tone: 'success' });
              onClose();
            } catch (error) {
              toast({ title: t(`errors.${error instanceof ClinicError ? error.code : 'forced'}`), tone: 'danger' });
            }
          }}
        >
          <Sheet.Body className="flex flex-col gap-4">
            <FormCombobox<VisitForm, PatientOption>
              name="patientId"
              control={form.control}
              label={t('schedule.newVisit.patient')}
              placeholder={t('schedule.newVisit.patientPlaceholder')}
              options={options}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              required
            />
            <FormSelect<VisitForm, VisitType>
              name="type"
              control={form.control}
              label={t('schedule.newVisit.type')}
              options={TYPES}
              getOptionLabel={(type) => t(`schedule.types.${String(type)}`)}
              getOptionValue={(type) => String(type)}
            />
            <FormTextarea<VisitForm> name="notes" label={t('schedule.newVisit.notes')} />
          </Sheet.Body>
          <Sheet.Footer>
            <Button type="submit" loading={create.isLoading}>
              {t('schedule.newVisit.submit')}
            </Button>
            <Sheet.Close asChild>
              <Button type="button" variant="ghost" className="ms-auto">
                {t('schedule.newVisit.cancel')}
              </Button>
            </Sheet.Close>
          </Sheet.Footer>
        </FormContainer>
      </Sheet.Content>
    </Sheet>
  );
}

export default NewVisitSheet;
