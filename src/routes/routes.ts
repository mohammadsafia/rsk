import type { ElementType } from 'react';

import { constructPlainRoutes } from '@utils';

import Permissions from 'app-constants/Permissions';

import { UserRoles } from 'app-constants';

import { Archive, Building2, CalendarDays, Cog, DollarSign, FileText, Settings, Stethoscope, Truck, UserRound, Users } from 'lucide-react';

export type AppMenu = {
  id: string;
  path: string;
  name?: string;
  permission?: string;
  permissions?: string[];
  roles?: UserRoles[];
  icon: ElementType;
  submenu?: AppMenu[];
};

export const FULL_ROUTES_PATH = {
  HOME: {
    INDEX: '/',
    SETUP: 'setup',
  },
  AUTH: {
    INDEX: 'auth',
    CALLBACK: 'auth/callback',
    ERROR: 'auth/error',
    SIGNOUT_CALLBACK: 'auth/signout-callback',
  },
  DOCTORS: {
    INDEX: 'doctors',
    CREATE: 'create',
    UPDATE: 'update/:doctorId',
    PROFILE: 'profile/:doctorId',
    PERSONAL_PROFILE: 'personal-profile/:doctorId',
    PERSONAL_UPDATE: 'personal-update/:doctorId',
    FOLDERS: 'folders/:sectionId/:folderId',
  },
  DOCTORS_V2: {
    INDEX: 'v2/doctors',
    CREATE: 'create',
    COMPLETE_PROFILE: ':doctorId/complete-profile',
    PROFILE: 'profile/:doctorId',
  },
  USERS: {
    INDEX: 'users',
    CREATE: 'create',
    UPDATE: 'update/:userId',
    PROFILE: 'profile/:userId',
    PERSONAL_PROFILE: 'personal-profile/:userId',
    PERSONAL_UPDATE: 'personal-update/:userId',
  },
  USERS_V2: {
    INDEX: 'v2/users',
  },
  PATIENTS: {
    INDEX: 'patients',
    CREATE: 'create',
    UPDATE: 'update/:patientId',
    PROFILE: 'profile/:patientId',
    FOLDERS: 'folders/:sectionId/:folderId',
  },
  APPOINTMENTS: {
    INDEX: 'appointments',
    CREATE: 'create',
    UPDATE: 'update/:appointmentId',
    PROFILE: 'profile/:appointmentId',
    FINANCIALS_REQUESTS: 'financials-requests/:appointmentId',
    RECORDS: 'records/:appointmentId/:folderId',
    FOLDERS: 'folders/:sectionId/:folderId',
  },
  APPOINTMENTS_V2: {
    INDEX: 'v2/appointments',
    CREATE: 'create',
    UPDATE: 'update/:appointmentId',
  },
  ACTIVE_REPORTS: {
    INDEX: 'active-reports',
    CREATE: 'create',
    UPDATE: 'update/:activeReportId',
    PROFILE: 'profile/:activeReportId',
    FOLDERS: 'folders/:sectionId/:folderId',
  },
  ARCHIVED_REPORTS: {
    INDEX: 'archived-reports',
    PROFILE: 'profile/:archivedReportId',
    FOLDERS: 'folders/:sectionId/:folderId',
  },
  FINANCIALS: {
    INDEX: 'financials',
    REQUESTS: 'requests',
    REQUESTS_PROFILE: 'profile/:financialRequestId',
    REPORTS: 'reports',
    AGING_REPORTS: 'aging-reports',
    PENDING_BILLING: 'pending-billing',
    PENDING_BILLING_PROFILE: 'pending-billing/profile/:appointmentId',
    PAYMENTS: {
      INDEX: 'payments',
      CREATE: 'create',
      UPDATE: 'update/:paymentId',
      PROFILE: 'profile/:paymentId',
    },
    EXTRA_PAYMENTS: {
      INDEX: 'extra-payments',
      CREATE: 'create',
      UPDATE: 'update/:paymentId',
      PROFILE: 'profile/:paymentId',
    },
    FOLDERS: 'folders/:sectionId/:folderId',
  },
  FINANCIALS_V2: {
    INDEX: 'v2/financials',
    REQUESTS: 'requests',
    REQUESTS_PROFILE: 'profile/:financialRequestId',
  },
  MANAGEMENT: {
    INDEX: 'management',
    ROLES: {
      INDEX: 'roles-management',
      UPDATE: 'update/:roleId',
      UPDATE_SINGLE: 'update-single/:roleId',
      PERMISSIONS_MATRIX: 'permissions-matrix',
    },
    ADJUSTERS: {
      INDEX: 'adjuster-management',
      CREATE: 'create',
      UPDATE: 'update/:adjusterId',
      PROFILE: 'profile/:adjusterId',
    },
    ATTORNEYS: {
      INDEX: 'attorney-management',
      CREATE: 'create',
      UPDATE: 'update/:attorneyId',
      PROFILE: 'profile/:attorneyId',
    },
  },
  LOCATIONS_MANAGEMENT: {
    INDEX: 'locations-management',
    CREATE: 'create',
    UPDATE: 'update/:locationId',
    PROFILE: 'profile/:locationId',
  },
  NOTIFICATIONS: {
    INDEX: 'notifications',
  },
  DELIVERY_TRACKER: {
    INDEX: 'delivery-tracker',
  },
  SYSTEM_SETTINGS: {
    INDEX: 'system-settings',
    SPECIALITIES: {
      INDEX: 'specialities',
      CREATE: 'create',
      UPDATE: 'update/:specialityId',
      PROFILE: 'profile/:specialityId',
    },
    BODY_PARTS: {
      INDEX: 'body-parts',
      CREATE: 'create',
      UPDATE: 'update/:bodyPartId',
      PROFILE: 'profile/:bodyPartId',
    },
  },
  DIGITAL_FORMS: {
    INDEX: 'digital-form',
    WELCOME: 'welcome',
  },
  PRIVACY_POLICY: {
    INDEX: 'privacy-policy',
  },
  ERRORS: {
    NOT_FOUND: 'not-found',
    FORBIDDEN: 'forbidden',
  },
  COMPONENTS: {
    INDEX: '/components',
  },
  ROOT: {
    INDEX: '..',
  },
} as const;

export const ROUTES_PATH = constructPlainRoutes(FULL_ROUTES_PATH);

export const APP_MENU: AppMenu[] = [
  {
    id: '1',
    path: FULL_ROUTES_PATH.DOCTORS.INDEX,
    icon: Stethoscope,
    name: 'Doctors',
    permission: Permissions.Doctors.Actions.ViewDoctors,
  },
  {
    id: '2',
    path: FULL_ROUTES_PATH.USERS.INDEX,
    icon: Users,
    name: 'Users',
    permission: Permissions.Users.Actions.ViewUsers,
  },
  {
    id: '3',
    path: FULL_ROUTES_PATH.PATIENTS.INDEX,
    icon: UserRound,
    name: 'Patients',
    permission: Permissions.Patient.Actions.ViewPatient,
  },
  {
    id: '4',
    path: FULL_ROUTES_PATH.APPOINTMENTS.INDEX,
    icon: CalendarDays,
    name: 'Appointments',
    permission: Permissions.Appointments.Actions.ViewAppointment,
  },
  {
    id: '5',
    path: FULL_ROUTES_PATH.ACTIVE_REPORTS.INDEX,
    icon: FileText,
    name: 'Active Reports',
    permission: Permissions.ReportManagement.Actions.ViewReport,
  },
  {
    id: '6',
    path: FULL_ROUTES_PATH.FINANCIALS.INDEX,
    icon: DollarSign,
    name: 'Financial & Billing',
    permissions: [
      Permissions.ExtraPaymentsPermissions.Actions.ViewExtraPayments,
      Permissions.PendingBilling.Actions.ViewAppointmentsPendingBilling,
      Permissions.PaymentPermissions.Actions.ViewPayments,
      Permissions.AgingReportPermissions.Actions.ViewAgingReport,
      Permissions.ReportsPermissions.Actions.ViewFinancialReports,
      Permissions.GeneralPermissions.Actions.ViewFinancialRequests,
    ],
    submenu: [
      {
        id: '6-1',
        path: `${FULL_ROUTES_PATH.FINANCIALS.INDEX}/${FULL_ROUTES_PATH.FINANCIALS.PENDING_BILLING}`,
        icon: DollarSign,
        name: 'Appointments Pending Billing',
        permission: Permissions.PendingBilling.Actions.ViewAppointmentsPendingBilling,
      },
      {
        id: '6-2',
        path: `${FULL_ROUTES_PATH.FINANCIALS.INDEX}/${FULL_ROUTES_PATH.FINANCIALS.REQUESTS}`,
        icon: DollarSign,
        name: 'Financial Requests',
        permission: Permissions.GeneralPermissions.Actions.ViewFinancialRequests,
      },
      {
        id: '6-3',
        path: `${FULL_ROUTES_PATH.FINANCIALS.INDEX}/${FULL_ROUTES_PATH.FINANCIALS.REPORTS}`,
        icon: DollarSign,
        name: 'Financial Reports',
        permission: Permissions.ReportsPermissions.Actions.ViewFinancialReports,
      },
      {
        id: '6-4',
        path: `${FULL_ROUTES_PATH.FINANCIALS.INDEX}/${FULL_ROUTES_PATH.FINANCIALS.PAYMENTS.INDEX}`,
        icon: DollarSign,
        name: 'Payments',
        permission: Permissions.PaymentPermissions.Actions.ViewPayments,
      },
      {
        id: '6-5',
        path: `${FULL_ROUTES_PATH.FINANCIALS.INDEX}/${FULL_ROUTES_PATH.FINANCIALS.EXTRA_PAYMENTS.INDEX}`,
        icon: DollarSign,
        name: 'Extra Payments',
        permission: Permissions.ExtraPaymentsPermissions.Actions.ViewExtraPayments,
      },
      {
        id: '6-6',
        path: `${FULL_ROUTES_PATH.FINANCIALS.INDEX}/${FULL_ROUTES_PATH.FINANCIALS.AGING_REPORTS}`,
        icon: DollarSign,
        name: 'Aging Reports',
        permission: Permissions.AgingReportPermissions.Actions.ViewAgingReport,
        roles: [UserRoles.Doctor],
      },
    ],
  },
  {
    id: '7',
    path: FULL_ROUTES_PATH.ARCHIVED_REPORTS.INDEX,
    icon: Archive,
    name: 'Archived Reports',
    permission: Permissions.ArchivedReports.Actions.ViewReport,
  },
  {
    id: '8',
    path: FULL_ROUTES_PATH.LOCATIONS_MANAGEMENT.INDEX,
    icon: Building2,
    name: 'Locations Management',
    permission: Permissions.LocationPermissions.Actions.ViewLocations,
  },
  {
    id: '9',
    path: FULL_ROUTES_PATH.DELIVERY_TRACKER.INDEX,
    icon: Truck,
    name: 'Delivery Tracker',
    permission: Permissions.Tracking.Actions.ViewDeliveryTracker,
  },
  {
    id: '10',
    path: `${FULL_ROUTES_PATH.SYSTEM_SETTINGS.INDEX}`,
    icon: Cog,
    name: 'System Settings',
    permissions: [Permissions.SpecialityGeneral.Actions.ViewSpeciality, Permissions.General.Actions.ViewBodyPart],
    submenu: [
      {
        id: '10-1',
        path: `${FULL_ROUTES_PATH.SYSTEM_SETTINGS.INDEX}/${FULL_ROUTES_PATH.SYSTEM_SETTINGS.SPECIALITIES.INDEX}`,
        icon: Cog,
        name: 'Specialities Management',
        permission: Permissions.SpecialityGeneral.Actions.ViewSpeciality,
      },
      {
        id: '10-2',
        path: `${FULL_ROUTES_PATH.SYSTEM_SETTINGS.INDEX}/${FULL_ROUTES_PATH.SYSTEM_SETTINGS.BODY_PARTS.INDEX}`,
        icon: Cog,
        name: 'Body Parts',
        permission: Permissions.General.Actions.ViewBodyPart,
      },
    ],
  },
  {
    id: '11',
    path: FULL_ROUTES_PATH.MANAGEMENT.INDEX,
    icon: Settings,
    name: 'Management',
    permissions: [
      Permissions.Roles.Actions.ViewRole,
      Permissions.AdjustersPermissions.Actions.ViewAdjusters,
      Permissions.AttorneysPermissions.Actions.ViewAttorneys,
    ],
    submenu: [
      {
        id: '11-1',
        path: FULL_ROUTES_PATH.MANAGEMENT.ADJUSTERS.INDEX,
        icon: Settings,
        name: 'Adjusters',
        permission: Permissions.AdjustersPermissions.Actions.ViewAdjusters,
      },
      {
        id: '11-2',
        path: FULL_ROUTES_PATH.MANAGEMENT.ATTORNEYS.INDEX,
        icon: Settings,
        name: 'Attorneys',
        permission: Permissions.AttorneysPermissions.Actions.ViewAttorneys,
      },
      {
        id: '11-3',
        path: FULL_ROUTES_PATH.MANAGEMENT.ROLES.INDEX,
        icon: Settings,
        name: 'Roles',
        permission: Permissions.Roles.Actions.ViewRole,
      },
      {
        id: '11-4',
        path: `${FULL_ROUTES_PATH.MANAGEMENT.INDEX}/${FULL_ROUTES_PATH.MANAGEMENT.ROLES.PERMISSIONS_MATRIX}`,
        icon: Settings,
        name: 'Permissions',
        permission: Permissions.Roles.Actions.ViewRole,
      },
    ],
  },
];
