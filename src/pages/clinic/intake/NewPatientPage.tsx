import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { optionalEmail } from '@utils';

import { ClinicError, type NewPatientInput } from '@api/clinic';
import {
  FormCheckbox,
  FormDatePicker,
  FormFileUploader,
  FormInput,
  FormRadioGroup,
  FormSelect,
  FormWizard,
  FormWizardError,
} from '@components/forms';
import { PageHeader } from '@components/shared';

import { toast, useAppTranslation, useDate } from '@hooks/shared';
import { FULL_ROUTES_PATH, patientPath } from '@routes';

import { useDoctors, useInsurers, useRegisterPatient } from '../queries';
import { useClinicToday } from '../shared/useClinicToday';
import { useLocalized } from '../shared/useLocalized';

type IntakeValues = {
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr: string;
  lastNameAr: string;
  sex: 'female' | 'male';
  dob: string;
  primaryDoctorId: string;
  insured: boolean;
  phone: string;
  email: string;
  insurerId: string;
  policyNumber: string;
  documents: File[];
};

type Option = { id: string; name: string };

const DEFAULTS: IntakeValues = {
  firstNameEn: '',
  lastNameEn: '',
  firstNameAr: '',
  lastNameAr: '',
  sex: 'female',
  dob: '',
  primaryDoctorId: '',
  insured: false,
  phone: '',
  email: '',
  insurerId: '',
  policyNumber: '',
  documents: [],
};

/** Registers a patient: who they are, how to reach them, their insurance (if any) and documents, then a review. */
function NewPatientPage() {
  const { t } = useAppTranslation('clinic');
  const navigate = useNavigate();
  const localize = useLocalized();
  const { todayKey } = useClinicToday();
  const { formatNullableDate, constants } = useDate();
  const doctors = useDoctors();
  const insurers = useInsurers();
  const register = useRegisterPatient();
  const form = useForm<IntakeValues>({ defaultValues: DEFAULTS });
  const insured = useWatch({ control: form.control, name: 'insured' });

  const doctorOptions = useMemo<Option[]>(
    () => (doctors.data ?? []).map((doctor) => ({ id: doctor.id, name: localize(doctor.name) })),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize follows the language, which `t` tracks
    [doctors.data, t],
  );
  const insurerOptions = useMemo<Option[]>(
    () => (insurers.data ?? []).map((insurer) => ({ id: insurer.id, name: localize(insurer.name) })),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize follows the language, which `t` tracks
    [insurers.data, t],
  );
  const sexOptions = useMemo<Option[]>(
    () => [
      { id: 'female', name: t('profile.sex.female') },
      { id: 'male', name: t('profile.sex.male') },
    ],
    [t],
  );

  const schemas = useMemo(
    () => ({
      patient: z.object({
        firstNameEn: z.string().trim().min(1, t('intake.errors.firstNameRequired')),
        lastNameEn: z.string().trim().min(1, t('intake.errors.lastNameRequired')),
        firstNameAr: z.string(),
        lastNameAr: z.string(),
        sex: z.enum(['female', 'male']),
        dob: z
          .string({ error: t('intake.errors.dobRequired') })
          .min(1, t('intake.errors.dobRequired'))
          .refine((dob) => dob <= todayKey, t('intake.errors.dobFuture')),
        primaryDoctorId: z.string().min(1, t('intake.errors.doctorRequired')),
      }),
      contact: z.object({
        phone: z
          .string()
          .trim()
          .min(1, t('intake.errors.phoneRequired'))
          .refine((phone) => phone.replace(/\D/g, '').length >= 7, t('intake.errors.phoneInvalid')),
        email: optionalEmail(t('intake.errors.emailInvalid')),
      }),
      insurance: z.object({
        insurerId: z.string().min(1, t('intake.errors.insurerRequired')),
        policyNumber: z.string().trim().min(1, t('intake.errors.policyRequired')),
      }),
    }),
    [t, todayKey],
  );

  const register_ = async (values: IntakeValues) => {
    const english = `${values.firstNameEn.trim()} ${values.lastNameEn.trim()}`;
    // Each Arabic part falls back to its English one, so a half-filled Arabic name still reads as a full name.
    const arabic = `${values.firstNameAr.trim() || values.firstNameEn.trim()} ${values.lastNameAr.trim() || values.lastNameEn.trim()}`;
    const input: NewPatientInput = {
      name: { en: english, ar: arabic },
      sex: values.sex,
      dob: values.dob,
      phone: values.phone.trim(),
      email: values.email.trim() || null,
      // Unticking "has insurance", or skipping its step, sends no insurance at all.
      insurerId: values.insured && values.insurerId ? values.insurerId : null,
      policyNumber: values.insured && values.insurerId ? values.policyNumber.trim() || null : null,
      allergies: [],
      primaryDoctorId: values.primaryDoctorId,
    };
    try {
      const patient = await register.mutateAsync(input);
      toast({ title: t('intake.registered'), tone: 'success' });
      void navigate(patientPath(patient.id), { replace: true });
    } catch (error) {
      // Field errors (e.g. a phone already registered) go back to the step that owns the field.
      if (error instanceof ClinicError && error.fieldErrors) {
        throw new FormWizardError(
          Object.fromEntries(Object.entries(error.fieldErrors).map(([field, code]) => [field, t(`errors.${code}`)])),
        );
      }
      // Anything else stays on the Review step, with the draft kept, so the user can try again.
      throw new FormWizardError({ form: t(`errors.${error instanceof ClinicError ? error.code : 'forced'}`) });
    }
  };

  const optionLabel = (option: Option) => option.name;
  const optionValue = (option: Option) => option.id;
  const nameOf = (options: Option[], id: unknown) => options.find((option) => option.id === id)?.name ?? '—';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader back={FULL_ROUTES_PATH.PATIENTS.INDEX} title={t('intake.title')} description={t('intake.description')} />

      <div className="max-w-2xl">
        <FormWizard
          form={form}
          draftKey="clinic-intake"
          urlSync
          onSubmit={register_}
          onCancel={() => navigate(FULL_ROUTES_PATH.PATIENTS.INDEX)}
          submitLabel={t('intake.submit')}
        >
          <FormWizard.Step
            id="patient"
            title={t('intake.steps.patient')}
            description={t('intake.steps.patientDescription')}
            schema={schemas.patient}
            review={[
              { name: 'firstNameEn', label: t('intake.fields.firstNameEn') },
              { name: 'lastNameEn', label: t('intake.fields.lastNameEn') },
              { name: 'sex', label: t('intake.fields.sex'), format: (value) => nameOf(sexOptions, value) },
              {
                name: 'dob',
                label: t('intake.fields.dob'),
                format: (value) => formatNullableDate(value as string, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—'),
              },
              { name: 'primaryDoctorId', label: t('intake.fields.doctor'), format: (value) => nameOf(doctorOptions, value) },
            ]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput<IntakeValues> name="firstNameEn" label={t('intake.fields.firstNameEn')} required />
              <FormInput<IntakeValues> name="lastNameEn" label={t('intake.fields.lastNameEn')} required />
              <FormInput<IntakeValues> name="firstNameAr" label={t('intake.fields.firstNameAr')} dir="rtl" />
              <FormInput<IntakeValues> name="lastNameAr" label={t('intake.fields.lastNameAr')} dir="rtl" />
              <FormRadioGroup<IntakeValues, Option>
                name="sex"
                control={form.control}
                label={t('intake.fields.sex')}
                options={sexOptions}
                getOptionLabel={optionLabel}
                getOptionValue={optionValue}
              />
              <FormDatePicker<IntakeValues> name="dob" control={form.control} label={t('intake.fields.dob')} required />
              <FormSelect<IntakeValues, Option>
                name="primaryDoctorId"
                control={form.control}
                label={t('intake.fields.doctor')}
                options={doctorOptions}
                getOptionLabel={optionLabel}
                getOptionValue={optionValue}
                required
              />
              <div className="sm:col-span-2">
                <FormCheckbox<IntakeValues> name="insured" control={form.control} label={t('intake.fields.insured')} />
              </div>
            </div>
          </FormWizard.Step>

          <FormWizard.Step
            id="contact"
            title={t('intake.steps.contact')}
            schema={schemas.contact}
            review={[
              { name: 'phone', label: t('intake.fields.phone') },
              { name: 'email', label: t('intake.fields.email') },
            ]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput<IntakeValues> name="phone" label={t('intake.fields.phone')} type="tel" dir="ltr" required />
              <FormInput<IntakeValues> name="email" label={t('intake.fields.email')} type="email" dir="ltr" />
            </div>
          </FormWizard.Step>

          <FormWizard.Step
            id="insurance"
            title={t('intake.steps.insurance')}
            optional
            condition={insured}
            schema={schemas.insurance}
            review={[
              { name: 'insurerId', label: t('intake.fields.insurer'), format: (value) => nameOf(insurerOptions, value) },
              { name: 'policyNumber', label: t('intake.fields.policy') },
            ]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormSelect<IntakeValues, Option>
                name="insurerId"
                control={form.control}
                label={t('intake.fields.insurer')}
                options={insurerOptions}
                getOptionLabel={optionLabel}
                getOptionValue={optionValue}
                required
              />
              <FormInput<IntakeValues> name="policyNumber" label={t('intake.fields.policy')} dir="ltr" required />
            </div>
          </FormWizard.Step>

          <FormWizard.Step
            id="documents"
            title={t('intake.steps.documents')}
            description={t('intake.steps.documentsDescription')}
            review={(values) => t('intake.files', { count: Array.isArray(values.documents) ? values.documents.length : 0 })}
          >
            <FormFileUploader<IntakeValues>
              name="documents"
              control={form.control}
              label={t('intake.fields.documents')}
              multiple
              listVariant="chips"
            />
          </FormWizard.Step>

          <FormWizard.Review title={t('intake.steps.review')} />
        </FormWizard>
      </div>
    </div>
  );
}

export default NewPatientPage;
