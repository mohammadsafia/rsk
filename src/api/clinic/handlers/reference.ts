import { clinicService } from '../service';

export const ClinicReferenceHandler = {
  doctors: { queryKey: 'clinic/doctors/list', request: () => clinicService.listDoctors() },
  insurers: { queryKey: 'clinic/insurers/list', request: () => clinicService.listInsurers() },
} as const;
