import { httpClient } from 'api';

import { ApiEndpoints } from '@api/config';

import { pathBuilder } from '@utils';

import {
  ApiVersions,
  type DoctorAppointmentConfigForReadDto,
  type DoctorAppointmentConfigForUpdateDto,
  type DoctorBillingAddressForUpdateDto,
  type DoctorBillingAddressReadDto,
  type DoctorDetailsForReadDto,
  type DoctorDetailsForUpdateDto,
  type DoctorMailingAddressForUpdateDto,
  type DoctorMailingAddressReadDto,
  type DoctorRenderingProviderForUpdateDto,
  type DoctorRenderingProviderReadDto,
  type DoctorSpecialitiesAndLocationsForReadDto,
  type DoctorSpecialitiesAndLocationsForUpdateDto,
  type FolderForListDto,
} from '@app-types';
import type { DoctorBasicDetailsForCreateDto, DoctorBasicDetailsForReadDto, DoctorBasicDetailsForUpdateDto } from 'types/api-v2';

const URL = ApiEndpoints.DOCTORS;
const DOCTOR_MANAGEMENT_URL = ApiEndpoints.DOCTOR_MANAGEMENT;

function createDoctor(payload: DoctorBasicDetailsForCreateDto) {
  return httpClient.post<{ doctorId: string }>(URL.INDEX, payload, { apiVersion: ApiVersions.V2 });
}

function getDoctor(doctorId: string) {
  return httpClient.get<DoctorBasicDetailsForReadDto>(pathBuilder({ path: URL.CREATE_UPDATE, pathParams: { doctorId } }), {
    apiVersion: ApiVersions.V2,
  });
}

function updateDoctor({ doctorId, payload }: { payload: DoctorBasicDetailsForUpdateDto; doctorId: string }) {
  return httpClient.put(
    pathBuilder({
      path: URL.CREATE_UPDATE,
      pathParams: { doctorId },
    }),
    payload,
    {
      apiVersion: ApiVersions.V2,
    },
  );
}

function getDoctorCompleteProfileBillingAddress(doctorId: string) {
  return httpClient.get<DoctorBillingAddressReadDto>(pathBuilder({ path: URL.BILLING_ADDRESS, pathParams: { doctorId } }));
}

function updateDoctorCompleteProfileBillingAddress({ doctorId, payload }: { doctorId: string; payload: DoctorBillingAddressForUpdateDto }) {
  return httpClient.put(pathBuilder({ path: URL.BILLING_ADDRESS, pathParams: { doctorId } }), payload);
}

function getDoctorCompleteProfileMailingAddress(doctorId: string) {
  return httpClient.get<DoctorMailingAddressReadDto>(pathBuilder({ path: URL.MAILING_ADDRESS, pathParams: { doctorId } }));
}

function updateDoctorCompleteProfileMailingAddress({ doctorId, payload }: { doctorId: string; payload: DoctorMailingAddressForUpdateDto }) {
  return httpClient.put(pathBuilder({ path: URL.MAILING_ADDRESS, pathParams: { doctorId } }), payload);
}

function getDoctorFolders(doctorId: string) {
  return httpClient.get<FolderForListDto[]>(pathBuilder({ path: DOCTOR_MANAGEMENT_URL.FOLDERS, pathParams: { doctorId } }));
}

function uploadDoctorW9FolderDocument({ doctorId, folderId, payload }: { doctorId: string; folderId: string; payload: FormData }) {
  return httpClient.post<void>(pathBuilder({ path: DOCTOR_MANAGEMENT_URL.FOLDER_DOCUMENTS, pathParams: { doctorId, folderId } }), payload);
}

function getDoctorCompleteProfileDetails(doctorId: string) {
  return httpClient.get<DoctorDetailsForReadDto>(pathBuilder({ path: URL.DETAILS, pathParams: { doctorId } }));
}

function updateDoctorCompleteProfileDetails({ doctorId, payload }: { doctorId: string; payload: DoctorDetailsForUpdateDto }) {
  return httpClient.put(pathBuilder({ path: URL.DETAILS, pathParams: { doctorId } }), payload);
}

function uploadDoctorSignature({ doctorId, payload }: { doctorId: string; payload: FormData }) {
  return httpClient.put<void>(pathBuilder({ path: DOCTOR_MANAGEMENT_URL.UPLOAD_SIGNATURE, pathParams: { doctorId } }), payload);
}

function getDoctorSpecialitiesLocations(doctorId: string) {
  return httpClient.get<DoctorSpecialitiesAndLocationsForReadDto>(
    pathBuilder({ path: URL.SPECIALITIES_LOCATIONS, pathParams: { doctorId } }),
  );
}

function updateDoctorSpecialitiesLocations({
  doctorId,
  payload,
}: {
  doctorId: string;
  payload: DoctorSpecialitiesAndLocationsForUpdateDto;
}) {
  return httpClient.put(pathBuilder({ path: URL.SPECIALITIES_LOCATIONS, pathParams: { doctorId } }), payload);
}

function getDoctorCompleteProfileRenderingProvider(doctorId: string) {
  return httpClient.get<DoctorRenderingProviderReadDto>(pathBuilder({ path: URL.RENDERING_PROVIDER, pathParams: { doctorId } }));
}

function updateDoctorCompleteProfileRenderingProvider({
  doctorId,
  payload,
}: {
  doctorId: string;
  payload: DoctorRenderingProviderForUpdateDto;
}) {
  return httpClient.put(pathBuilder({ path: URL.RENDERING_PROVIDER, pathParams: { doctorId } }), payload);
}

function getDoctorCompleteProfileAppointmentConfiguration(doctorId: string) {
  return httpClient.get<DoctorAppointmentConfigForReadDto>(pathBuilder({ path: URL.APPOINTMENT_CONFIGURATION, pathParams: { doctorId } }));
}

function updateDoctorCompleteProfileAppointmentConfiguration({
  doctorId,
  payload,
}: {
  doctorId: string;
  payload: DoctorAppointmentConfigForUpdateDto;
}) {
  return httpClient.put(pathBuilder({ path: URL.APPOINTMENT_CONFIGURATION, pathParams: { doctorId } }), payload);
}

export const DoctorsHandler = {
  create: {
    mutationKey: 'doctors/create',
    request: createDoctor,
  },
  get: {
    queryKey: 'doctors/get',
    request: getDoctor,
  },
  update: {
    mutationKey: 'doctors/update',
    request: updateDoctor,
  },
  getDoctorCompleteProfileBillingAddress: {
    queryKey: 'doctor-management/get-doctor-complete-profile-billing-address',
    request: getDoctorCompleteProfileBillingAddress,
  },
  updateDoctorCompleteProfileBillingAddress: {
    mutationKey: 'doctor-management/update-doctor-complete-profile-billing-address',
    request: updateDoctorCompleteProfileBillingAddress,
  },
  getDoctorCompleteProfileMailingAddress: {
    queryKey: 'doctor-management/get-doctor-complete-profile-mailing-address',
    request: getDoctorCompleteProfileMailingAddress,
  },
  updateDoctorCompleteProfileMailingAddress: {
    mutationKey: 'doctor-management/update-doctor-complete-profile-mailing-address',
    request: updateDoctorCompleteProfileMailingAddress,
  },
  getDoctorFolders: {
    queryKey: 'doctor-management/get-doctor-folders',
    request: getDoctorFolders,
  },
  uploadDoctorW9FolderDocument: {
    mutationKey: 'doctor-management/upload-doctor-w9-folder-document',
    request: uploadDoctorW9FolderDocument,
  },
  getDoctorCompleteProfileDetails: {
    queryKey: 'doctor-management/get-doctor-complete-profile-details',
    request: getDoctorCompleteProfileDetails,
  },
  updateDoctorCompleteProfileDetails: {
    mutationKey: 'doctor-management/update-doctor-complete-profile-details',
    request: updateDoctorCompleteProfileDetails,
  },
  uploadDoctorSignature: {
    mutationKey: 'doctor-management/upload-doctor-signature',
    request: uploadDoctorSignature,
  },
  getSpecialitiesLocations: {
    queryKey: 'doctor-management/get-specialities-locations',
    request: getDoctorSpecialitiesLocations,
  },
  updateSpecialitiesLocations: {
    mutationKey: 'doctor-management/update-specialities-locations',
    request: updateDoctorSpecialitiesLocations,
  },
  getDoctorCompleteProfileRenderingProvider: {
    queryKey: 'doctor-management/get-doctor-complete-profile-rendering-provider',
    request: getDoctorCompleteProfileRenderingProvider,
  },
  updateDoctorCompleteProfileRenderingProvider: {
    mutationKey: 'doctor-management/update-doctor-complete-profile-rendering-provider',
    request: updateDoctorCompleteProfileRenderingProvider,
  },
  getDoctorCompleteProfileAppointmentConfiguration: {
    queryKey: 'doctor-management/get-doctor-complete-profile-appointment-configuration',
    request: getDoctorCompleteProfileAppointmentConfiguration,
  },
  updateDoctorCompleteProfileAppointmentConfiguration: {
    mutationKey: 'doctor-management/update-doctor-complete-profile-appointment-configuration',
    request: updateDoctorCompleteProfileAppointmentConfiguration,
  },
} as const;
