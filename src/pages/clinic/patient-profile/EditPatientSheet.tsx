import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { optionalEmail } from '@utils';

import { ClinicError, type PatientSummary } from '@api/clinic';
import { Button, Sheet } from '@components/ui';
import { FormContainer, FormInput, FormSelect } from '@components/forms';

import { toast, useAppTranslation } from '@hooks/shared';

import { useInsurers, useUpdatePatient } from '../queries';
import { useLocalized } from '../shared/useLocalized';

const SELF_PAY = 'self-pay';

type ContactForm = { phone: string; email: string; insurerId: string; policyNumber: string };
type InsurerOption = { id: string; name: string };

const toForm = (patient: PatientSummary): ContactForm => ({
  phone: patient.phone,
  email: patient.email ?? '',
  insurerId: patient.insurerId ?? SELF_PAY,
  policyNumber: patient.policyNumber ?? '',
});

/** Contact details a front desk changes: phone, email and insurance. A phone another patient uses is refused. */
function EditPatientSheet({ patient, onClose }: { patient: PatientSummary | null; onClose: () => void }) {
  const { t } = useAppTranslation('clinic');
  const localize = useLocalized();
  const insurers = useInsurers();
  const update = useUpdatePatient();

  const options = useMemo<InsurerOption[]>(
    () => [
      ...(insurers.data ?? []).map((insurer) => ({ id: insurer.id, name: localize(insurer.name) })),
      { id: SELF_PAY, name: t('patients.selfPay') },
    ],
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize follows the language, which `t` tracks
    [insurers.data, t],
  );

  const schema = useMemo(
    () =>
      z
        .object({
          phone: z
            .string()
            .trim()
            .min(1, t('profile.editSheet.phoneRequired'))
            .refine((phone) => phone.replace(/\D/g, '').length >= 7, t('profile.editSheet.phoneInvalid')),
          email: optionalEmail(t('profile.editSheet.emailInvalid')),
          insurerId: z.string(),
          policyNumber: z.string().trim(),
        })
        .refine((values) => values.insurerId === SELF_PAY || values.policyNumber.length > 0, {
          message: t('profile.editSheet.policyRequired'),
          path: ['policyNumber'],
        }),
    [t],
  );

  const form = useForm<ContactForm>({ resolver: zodResolver(schema), defaultValues: patient ? toForm(patient) : undefined });

  // Opening the Sheet starts from the patient's current details.
  useEffect(() => {
    if (patient) form.reset(toForm(patient));
  }, [patient, form]);

  return (
    <Sheet open={!!patient} onOpenChange={(open) => !open && onClose()}>
      <Sheet.Content side="end" size="md" title={t('profile.editSheet.title')}>
        <FormContainer
          formContext={form}
          className="flex min-h-0 flex-1 flex-col"
          onSuccess={async (values) => {
            if (!patient) return;
            const insured = values.insurerId !== SELF_PAY;
            try {
              await update.mutateAsync({
                id: patient.id,
                patch: {
                  phone: values.phone.trim(),
                  email: values.email.trim() || null,
                  insurerId: insured ? values.insurerId : null,
                  policyNumber: insured ? values.policyNumber.trim() : null,
                },
              });
              toast({ title: t('profile.editSheet.saved'), tone: 'success' });
              onClose();
            } catch (error) {
              if (error instanceof ClinicError && error.fieldErrors?.phone) {
                form.setError('phone', { message: t(`errors.${error.fieldErrors.phone}`) }, { shouldFocus: true });
                return;
              }
              toast({ title: t(`errors.${error instanceof ClinicError ? error.code : 'forced'}`), tone: 'danger' });
            }
          }}
        >
          <Sheet.Body className="flex flex-col gap-4">
            <FormInput<ContactForm> name="phone" label={t('profile.editSheet.phone')} type="tel" dir="ltr" required />
            <FormInput<ContactForm> name="email" label={t('profile.editSheet.email')} type="email" dir="ltr" />
            <FormSelect<ContactForm, InsurerOption>
              name="insurerId"
              control={form.control}
              // The policy rule reads the insurer, so changing the insurer re-checks the policy number too.
              rules={{ deps: ['policyNumber'] }}
              label={t('profile.editSheet.insurer')}
              options={options}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
            />
            <FormInput<ContactForm> name="policyNumber" label={t('profile.editSheet.policy')} dir="ltr" />
          </Sheet.Body>
          <Sheet.Footer>
            <Button type="submit" loading={update.isPending}>
              {t('profile.editSheet.save')}
            </Button>
            <Sheet.Close asChild>
              <Button type="button" variant="ghost" className="ms-auto">
                {t('profile.editSheet.cancel')}
              </Button>
            </Sheet.Close>
          </Sheet.Footer>
        </FormContainer>
      </Sheet.Content>
    </Sheet>
  );
}

export default EditPatientSheet;
