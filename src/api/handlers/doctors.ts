
import { ApiEndpoints, httpClient } from '@api/config';

import { pathBuilder } from '@utils';

const URL = ApiEndpoints.DOCTORS;

function getDoctor(doctorId: string) {
  return httpClient.get<string[]>(pathBuilder({ path: URL.DETAILS, pathParams: { doctorId } }));
}

export const DoctorsHandler = {
  get: {
    queryKey: 'doctors/get',
    request: getDoctor,
  },
} as const;
