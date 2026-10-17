// The clinic mock backend. Handlers are the only layer a real API replaces: swap each `request` for an httpClient call.
export * from './handlers';
export * from './types';
export { invoiceBalance, invoicePaid, invoiceTotal } from './calc';
export {
  ClinicError,
  type BulkResult,
  type ClinicErrorCode,
  type DayRange,
  type NewPatientInput,
  type NewVisitInput,
  type PatientPatch,
  type VisitPatch,
} from './service';
// The store is exported for tests and a dev reset only; pages go through the handlers.
export { clinicStore, type ClinicOp } from './store';
