import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export const useDoctors = () =>
  useQuery({ queryKey: [CLINIC, ClinicReferenceHandler.doctors.queryKey], queryFn: ClinicReferenceHandler.doctors.request });
export const useInsurers = () =>
  useQuery({ queryKey: [CLINIC, ClinicReferenceHandler.insurers.queryKey], queryFn: ClinicReferenceHandler.insurers.request });

export const usePatients = () => useQuery({ queryKey: [CLINIC, PatientsHandler.list.queryKey], queryFn: PatientsHandler.list.request });
export const usePatient = (id: string) =>
  useQuery({ queryKey: [CLINIC, PatientsHandler.get.queryKey, id], queryFn: () => PatientsHandler.get.request(id) });

export const usePatientVisits = (patientId: string) =>
  useQuery({ queryKey: [CLINIC, VisitsHandler.byPatient.queryKey, patientId], queryFn: () => VisitsHandler.byPatient.request(patientId) });

type RangeOptions = { keepPreviousData?: boolean };

/** `keepPreviousData` keeps showing the last range while the next one loads (no flash when paging dates). */
export const useVisits = (range: DayRange, options: RangeOptions = {}) =>
  useQuery({
    queryKey: [CLINIC, VisitsHandler.list.queryKey, range.from, range.to],
    queryFn: () => VisitsHandler.list.request(range),
    placeholderData: options.keepPreviousData ? keepPreviousData : undefined,
  });
export const useLeave = (range: DayRange, options: RangeOptions = {}) =>
  useQuery({
    queryKey: [CLINIC, VisitsHandler.leave.queryKey, range.from, range.to],
    queryFn: () => VisitsHandler.leave.request(range),
    placeholderData: options.keepPreviousData ? keepPreviousData : undefined,
  });

export const useInvoices = () => useQuery({ queryKey: [CLINIC, InvoicesHandler.list.queryKey], queryFn: InvoicesHandler.list.request });
export const useInvoice = (id: string, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [CLINIC, InvoicesHandler.get.queryKey, id], queryFn: () => InvoicesHandler.get.request(id), ...options });

export const useMetrics = (days: MetricsRange) =>
  useQuery({ queryKey: [CLINIC, MetricsHandler.list.queryKey, days], queryFn: () => MetricsHandler.list.request(days) });

/** Every clinic write refreshes every clinic view: the dataset is small and nothing can go stale. */
const useClinicMutation = <TInput, TResult>(request: (input: TInput) => Promise<TResult>) => {
  const client = useQueryClient();
  return useMutation({ mutationFn: request, onSettled: () => client.invalidateQueries({ queryKey: [CLINIC] }) });
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
