import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type BulkInvoiceAction,
  ClinicReferenceHandler,
  type DayRange,
  InvoicesHandler,
  MetricsHandler,
  type MetricsRange,
  type PatientPatch,
  type PaymentInput,
  PatientsHandler,
  type VisitPatch,
  VisitsHandler,
  type VisitStatus,
} from '@api/clinic';

const CLINIC = 'clinic';

export const useDoctors = () => useQuery([CLINIC, ClinicReferenceHandler.doctors.queryKey], ClinicReferenceHandler.doctors.request);
export const useInsurers = () => useQuery([CLINIC, ClinicReferenceHandler.insurers.queryKey], ClinicReferenceHandler.insurers.request);

export const usePatients = () => useQuery([CLINIC, PatientsHandler.list.queryKey], PatientsHandler.list.request);
export const usePatient = (id: string) => useQuery([CLINIC, PatientsHandler.get.queryKey, id], () => PatientsHandler.get.request(id));

export const usePatientVisits = (patientId: string) =>
  useQuery([CLINIC, VisitsHandler.byPatient.queryKey, patientId], () => VisitsHandler.byPatient.request(patientId));

export const useVisits = (range: DayRange) =>
  useQuery([CLINIC, VisitsHandler.list.queryKey, range.from, range.to], () => VisitsHandler.list.request(range));
export const useLeave = (range: DayRange) =>
  useQuery([CLINIC, VisitsHandler.leave.queryKey, range.from, range.to], () => VisitsHandler.leave.request(range));

export const useInvoices = () => useQuery([CLINIC, InvoicesHandler.list.queryKey], InvoicesHandler.list.request);
export const useInvoice = (id: string, options: { enabled?: boolean } = {}) =>
  useQuery([CLINIC, InvoicesHandler.get.queryKey, id], () => InvoicesHandler.get.request(id), options);

export const useMetrics = (days: MetricsRange) =>
  useQuery([CLINIC, MetricsHandler.list.queryKey, days], () => MetricsHandler.list.request(days));

/** Every clinic write refreshes every clinic view: the dataset is small and nothing can go stale. */
const useClinicMutation = <TInput, TResult>(request: (input: TInput) => Promise<TResult>) => {
  const client = useQueryClient();
  return useMutation(request, { onSettled: () => client.invalidateQueries([CLINIC]) });
};

export const useRegisterPatient = () => useClinicMutation(PatientsHandler.register.request);
export const useUpdatePatient = () =>
  useClinicMutation(({ id, patch }: { id: string; patch: PatientPatch }) => PatientsHandler.update.request(id, patch));
export const useCreateVisit = () => useClinicMutation(VisitsHandler.create.request);
export const useUpdateVisit = () =>
  useClinicMutation(({ id, patch }: { id: string; patch: VisitPatch }) => VisitsHandler.update.request(id, patch));
export const useSetVisitStatus = () =>
  useClinicMutation(({ id, status }: { id: string; status: VisitStatus }) => VisitsHandler.setStatus.request(id, status));
export const useRecordPayment = () =>
  useClinicMutation(({ id, payment }: { id: string; payment: PaymentInput }) => InvoicesHandler.recordPayment.request(id, payment));
export const useSendInvoice = () => useClinicMutation(InvoicesHandler.send.request);
export const useVoidInvoice = () => useClinicMutation(InvoicesHandler.void.request);
export const useBulkInvoices = () =>
  useClinicMutation(({ ids, action }: { ids: string[]; action: BulkInvoiceAction }) => InvoicesHandler.bulk.request(ids, action));
