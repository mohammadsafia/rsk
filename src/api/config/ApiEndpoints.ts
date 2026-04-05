export const ApiEndpoints = {
  DOCTORS: {
    INDEX: '/doctors',
    CREATE_UPDATE: '/doctors/:doctorId',
    BILLING_ADDRESS: '/doctors/:doctorId/billing-address',
    MAILING_ADDRESS: '/doctors/:doctorId/mailing-address',
    DETAILS: '/doctors/:doctorId/details',
    SPECIALITIES_LOCATIONS: '/doctors/:doctorId/speciality-locations',
    RENDERING_PROVIDER: '/doctors/:doctorId/rendering-provider',
    APPOINTMENT_CONFIGURATION: '/doctors/:doctorId/appointment-configuration',
  },
  DOCTOR_MANAGEMENT: {
    INDEX: '/doctors-management',
    FOLDERS: '/doctors-management/:doctorId/folders',
    FOLDER_DOCUMENTS: '/doctors-management/:doctorId/folders/:folderId/documents',
    UPLOAD_SIGNATURE: '/doctors-management/:doctorId/signature',
  },
  USERS: {
    INDEX: '/users-management',
  },
} as const;
