import { clinicService, type DayRange, type NewVisitInput, type VisitPatch } from '../service';
import type { VisitStatus } from '../types';

export const VisitsHandler = {
  list: { queryKey: 'clinic/visits/list', request: (range: DayRange) => clinicService.listVisits(range) },
  byPatient: { queryKey: 'clinic/visits/by-patient', request: (patientId: string) => clinicService.listPatientVisits(patientId) },
  leave: { queryKey: 'clinic/leave/list', request: (range: DayRange) => clinicService.listLeave(range) },
  create: { request: (input: NewVisitInput) => clinicService.createVisit(input) },
  update: { request: (id: string, patch: VisitPatch) => clinicService.updateVisit(id, patch) },
  setStatus: { request: (id: string, status: VisitStatus) => clinicService.setVisitStatus(id, status) },
} as const;
