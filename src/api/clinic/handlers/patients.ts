import { clinicService, type NewPatientInput, type PatientPatch } from '../service';

export const PatientsHandler = {
  list: { queryKey: 'clinic/patients/list', request: () => clinicService.listPatients() },
  get: { queryKey: 'clinic/patients/get', request: (id: string) => clinicService.getPatient(id) },
  register: { request: (input: NewPatientInput) => clinicService.registerPatient(input) },
  update: { request: (id: string, patch: PatientPatch) => clinicService.updatePatient(id, patch) },
} as const;
