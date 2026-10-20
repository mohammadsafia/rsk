export const ApiEndpoints = {
  AUTH: {
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  DOCTORS: {
    INDEX: '/doctors',
    DETAILS: '/doctors/:doctorId/details',
  },
} as const;
