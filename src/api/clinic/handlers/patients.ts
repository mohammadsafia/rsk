import { clinicService, type NewPatientInput } from '../service';

export const PatientsHandler = {
  list: { queryKey: 'clinic/patients/list', request: () => clinicService.listPatients() },
  get: { queryKey: 'clinic/patients/get', request: (id: string) => clinicService.getPatient(id) },
  register: { request: (input: NewPatientInput) => clinicService.registerPatient(input) },
} as const;
