import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AuthGuard from 'router/AuthGuard';
import AuthorizationGuard from 'router/AuthorizationGuard';
import Permissions from 'app-constants/Permissions';

import { DashboardLayout, DigitalFormLayout, ErrorBoundary } from '@layouts';

import { FULL_ROUTES_PATH } from './routes';

// ─── Auth Pages ───────────────────────────────────────────────────────
const AuthCallbackPage = lazy(() => import('pages/AuthCallback'));
const AuthErrorPage = lazy(() => import('pages/AuthError'));
const SignoutCallbackPage = lazy(() => import('pages/SignoutCallback'));
const PrivacyPolicyPage = lazy(() => import('pages/privacy-policy/PrivacyPolicy'));

// ─── Error Pages ──────────────────────────────────────────────────────
const NotFoundPage = lazy(() => import('pages/not-found/NotFoundPage'));
const ForbiddenPage = lazy(() => import('pages/forbidden/ForbiddenPage'));

// ─── Setup & Components ───────────────────────────────────────────────
const SetupPage = lazy(() => import('pages/authentication/SetupPage'));
const ComponentsGalleryPage = lazy(() => import('pages/components/ComponentsGalleryPage'));

// ─── Doctors ──────────────────────────────────────────────────────────
const DoctorListPage = lazy(() => import('pages/doctors/DoctorListPage'));
const DoctorProfilePage = lazy(() => import('pages/doctors/DoctorProfilePage'));
const DoctorFolderDetailsPage = lazy(() => import('pages/doctors/DoctorFolderDetailsPage'));
const DoctorCreatePage = lazy(() => import('pages/doctors/DoctorCreatePage'));
const DoctorUpdatePage = lazy(() => import('pages/doctors/DoctorUpdatePage'));
const DoctorPersonalProfilePage = lazy(() => import('pages/doctors/DoctorPersonalProfilePage'));
const DoctorPersonalUpdatePage = lazy(() => import('pages/doctors/DoctorPersonalUpdatePage'));

// ─── Doctors V2 ───────────────────────────────────────────────────────
const CreateDoctorPage = lazy(() => import('pages/doctor/CreateDoctorPage'));
const DoctorCompleteProfilePage = lazy(() => import('pages/doctor/DoctorCompleteProfilePage'));
const DoctorPage = lazy(() => import('pages/doctor/DoctorPage'));

// ─── Appointments ─────────────────────────────────────────────────────
const AppointmentListPage = lazy(() => import('pages/appointments/AppointmentListPage'));
const AppointmentProfilePage = lazy(() => import('pages/appointments/AppointmentProfilePage'));
const AppointmentFolderDetailsPage = lazy(() => import('pages/appointments/AppointmentFolderDetailsPage'));
const AppointmentFinancialsRequestsListPage = lazy(() => import('pages/appointments/AppointmentFinancialsRequestsListPage'));
const RecordsPage = lazy(() => import('pages/records-management/RecordsPage'));
const AppointmentCreatePage = lazy(() => import('pages/appointments/AppointmentCreatePage'));
const AppointmentUpdatePage = lazy(() => import('pages/appointments/AppointmentUpdatePage'));

// ─── Appointments V2 ──────────────────────────────────────────────────
const CreateAppointmentPageV2 = lazy(() => import('pages/appointment-management/CreateAppointmentPage'));
const UpdateAppointmentPageV2 = lazy(() => import('pages/appointment-management/UpdateAppointmentPage'));

// ─── Active Reports ───────────────────────────────────────────────────
const ActiveReportListPage = lazy(() => import('pages/active-reports/ActiveReportListPage'));
const ActiveReportProfilePage = lazy(() => import('pages/active-reports/ActiveReportProfilePage'));
const ActiveReportFolderDetailsPage = lazy(() => import('pages/active-reports/ActiveReportFolderDetailsPage'));
const ActiveReportCreatePage = lazy(() => import('pages/active-reports/ActiveReportCreatePage'));
const ActiveReportUpdatePage = lazy(() => import('pages/active-reports/ActiveReportUpdatePage'));

// ─── Archived Reports ─────────────────────────────────────────────────
const ArchivedReportListPage = lazy(() => import('pages/archived-reports/ArchivedReportListPage'));
const ArchivedReportProfilePage = lazy(() => import('pages/archived-reports/ArchivedReportProfilePage'));
const ArchivedReportFolderDetailsPage = lazy(() => import('pages/archived-reports/ArchivedReportFolderDetailsPage'));

// ─── Users ────────────────────────────────────────────────────────────
const UserListPage = lazy(() => import('pages/users/UserListPage'));
const UsersPage = lazy(() => import('pages/users/UsersPage'));
const UserProfilePage = lazy(() => import('pages/users/UserProfilePage'));
const UserCreatePage = lazy(() => import('pages/users/UserCreatePage'));
const UserUpdatePage = lazy(() => import('pages/users/UserUpdatePage'));
const UserPersonalProfilePage = lazy(() => import('pages/users/UserPersonalProfilePage'));
const UserPersonalUpdatePage = lazy(() => import('pages/users/UserPersonalUpdatePage'));

// ─── Patients ─────────────────────────────────────────────────────────
const PatientsListPage = lazy(() => import('pages/patients/PatientsListPage'));
const PatientProfilePage = lazy(() => import('pages/patients/PatientProfilePage'));
const PatientFolderDetailsPage = lazy(() => import('pages/patients/PatientFolderDetailsPage'));
const PatientCreatePage = lazy(() => import('pages/patients/PatientCreatePage'));
const PatientUpdatePage = lazy(() => import('pages/patients/PatientUpdatePage'));

// ─── Management ───────────────────────────────────────────────────────
const ManagementHomePage = lazy(() => import('pages/management/ManagementHomePage'));
const RoleListPage = lazy(() => import('pages/management/roles/RoleListPage'));
const RoleDetailsPage = lazy(() => import('pages/management/roles/RoleDetailsPage'));
const SingleRoleDetailsPage = lazy(() => import('pages/management/roles/SingleRoleDetailsPage'));
const PermissionsMatrixPage = lazy(() => import('pages/management/roles/PermissionsMatrixPage'));

// ─── Adjusters ────────────────────────────────────────────────────────
const AdjustersListPage = lazy(() => import('pages/adjusters-management/AdjustersListPage'));
const AdjusterProfilePage = lazy(() => import('pages/adjusters-management/AdjusterProfilePage'));
const AdjusterCreatePage = lazy(() => import('pages/adjusters-management/AdjusterCreatePage'));
const AdjusterUpdatePage = lazy(() => import('pages/adjusters-management/AdjusterUpdatePage'));

// ─── Attorneys ────────────────────────────────────────────────────────
const AttorneyListPage = lazy(() => import('pages/attorney-management/AttorneyListPage'));
const AttorneyProfilePage = lazy(() => import('pages/attorney-management/AttorneyProfilePage'));
const AttorneyCreatePage = lazy(() => import('pages/attorney-management/AttorneyCreatePage'));
const AttorneyUpdatePage = lazy(() => import('pages/attorney-management/AttorneyUpdatePage'));

// ─── Financials ───────────────────────────────────────────────────────
const FinancialRequestsPage = lazy(() => import('pages/financial-requests/FinancialRequestsPage'));
const FinancialRequestProfilePage = lazy(() => import('pages/financial-requests/FinancialRequestProfilePage'));
const FinancialRequestFolderDetailsPage = lazy(() => import('pages/financial-requests/FinancialRequestFolderDetailsPage'));
const FinancialReportsPage = lazy(() => import('pages/financial-requests/ReportsPage'));
const AgingReportsPage = lazy(() => import('pages/aging-reports/AgingReportsPage'));
const PendingBillingPage = lazy(() => import('pages/pending-billing/PendingBillingPage'));
const PendingBillingProfilePage = lazy(() => import('pages/pending-billing/PendingBillingProfilePage'));

// ─── Financials V2 ───────────────────────────────────────────────────────
const FinancialRequestPage = lazy(() => import('pages/financial-requests-management/FinancialRequestPage'));

// ─── Payments ─────────────────────────────────────────────────────────
const PaymentsPage = lazy(() => import('pages/payments/PaymentsPage'));
const PaymentProfilePage = lazy(() => import('pages/payments/PaymentProfilePage'));
const PaymentCreatePage = lazy(() => import('pages/payments/PaymentCreatePage'));
const PaymentUpdatePage = lazy(() => import('pages/payments/PaymentUpdatePage'));

// ─── Extra Payments ───────────────────────────────────────────────────
const ExtraPaymentsPage = lazy(() => import('pages/extra-payments/ExtraPaymentsPage'));
const ExtraPaymentProfilePage = lazy(() => import('pages/extra-payments/ExtraPaymentProfilePage'));
const ExtraPaymentCreatePage = lazy(() => import('pages/extra-payments/ExtraPaymentCreatePage'));
const ExtraPaymentUpdatePage = lazy(() => import('pages/extra-payments/ExtraPaymentUpdatePage'));

// ─── Locations Management ─────────────────────────────────────────────
const LocationsPage = lazy(() => import('pages/locations/LocationsPage'));
const LocationProfilePage = lazy(() => import('pages/locations/LocationProfilePage'));
const CreateLocationPage = lazy(() => import('pages/locations/CreateLocationPage'));
const UpdateLocationPage = lazy(() => import('pages/locations/UpdateLocationPage'));

// ─── Notifications ────────────────────────────────────────────────────
const NotificationsPage = lazy(() => import('pages/notifications/NotificationsPage'));

// ─── Delivery Tracker ─────────────────────────────────────────────────
const DeliveryTrackerPage = lazy(() => import('pages/delivery-tracker/DeliveryTrackerPage'));

// ─── System Settings ──────────────────────────────────────────────────
const SpecialitiesPage = lazy(() => import('pages/system-settings/specialities/SpecialitiesPage'));
const SpecialityProfilePage = lazy(() => import('pages/system-settings/specialities/SpecialityProfilePage'));
const SpecialityCreatePage = lazy(() => import('pages/system-settings/specialities/SpecialityCreatePage'));
const SpecialityUpdatePage = lazy(() => import('pages/system-settings/specialities/SpecialityUpdatePage'));
const BodyPartsPage = lazy(() => import('pages/system-settings/body-parts/BodyPartsPage'));
const BodyPartProfilePage = lazy(() => import('pages/system-settings/body-parts/BodyPartProfilePage'));
const BodyPartCreatePage = lazy(() => import('pages/system-settings/body-parts/BodyPartCreatePage'));
const BodyPartUpdatePage = lazy(() => import('pages/system-settings/body-parts/BodyPartUpdatePage'));

// ─── Digital Forms ────────────────────────────────────────────────────
const DigitalFormPage = lazy(() => import('pages/digital-forms/DigitalFormPage'));

// ─── Permission constants ─────────────────────────────────────────────
const P = {
  // Doctors
  ViewDoctors: Permissions.Doctors.Actions.ViewDoctors,
  CreateDoctor: Permissions.Doctors.Actions.CreateDoctor,
  EditDoctor: Permissions.Doctors.Actions.EditDoctor,
  ViewMyDoctorProfile: Permissions.Doctors.Actions.ViewMyProfile,
  EditMyDoctorProfile: Permissions.Doctors.Actions.EditMyProfile,
  // Users
  ViewUsers: Permissions.Users.Actions.ViewUsers,
  CreateUser: Permissions.Users.Actions.CreateUser,
  EditUser: Permissions.Users.Actions.EditUser,
  ViewMyProfile: Permissions.Users.Actions.ViewMyProfile,
  EditMyProfile: Permissions.Users.Actions.EditMyProfile,
  // Patients
  ViewPatient: Permissions.Patient.Actions.ViewPatient,
  CreatePatient: Permissions.Patient.Actions.CreatePatient,
  EditPatient: Permissions.Patient.Actions.EditPatient,
  // Appointments
  ViewAppointment: Permissions.Appointments.Actions.ViewAppointment,
  CreateAppointment: Permissions.Appointments.Actions.CreateAppointment,
  EditAppointment: Permissions.Appointments.Actions.EditAppointment,
  // Active Reports
  ViewReport: Permissions.ReportManagement.Actions.ViewReport,
  CreateReport: Permissions.ReportManagement.Actions.CreateReport,
  EditReport: Permissions.ReportManagement.Actions.EditReport,
  // Archived Reports
  ViewArchivedReport: Permissions.ArchivedReports.Actions.ViewReport,
  // Financials
  ViewFinancialRequests: Permissions.GeneralPermissions.Actions.ViewFinancialRequests,
  ViewFinancialReports: Permissions.ReportsPermissions.Actions.ViewFinancialReports,
  ViewAgingReport: Permissions.AgingReportPermissions.Actions.ViewAgingReport,
  ViewPendingBilling: Permissions.PendingBilling.Actions.ViewAppointmentsPendingBilling,
  // Payments
  ViewPayments: Permissions.PaymentPermissions.Actions.ViewPayments,
  CreatePayment: Permissions.PaymentPermissions.Actions.CreatePayment,
  EditPayment: Permissions.PaymentPermissions.Actions.EditPayments,
  // Extra Payments
  ViewExtraPayments: Permissions.ExtraPaymentsPermissions.Actions.ViewExtraPayments,
  CreateExtraPayment: Permissions.ExtraPaymentsPermissions.Actions.CreateExtraPayment,
  EditExtraPayment: Permissions.ExtraPaymentsPermissions.Actions.UpdateExtraPayment,
  // Roles
  ViewRole: Permissions.Roles.Actions.ViewRole,
  // Adjusters
  ViewAdjusters: Permissions.AdjustersPermissions.Actions.ViewAdjusters,
  CreateAdjuster: Permissions.AdjustersPermissions.Actions.CreateAdjuster,
  EditAdjuster: Permissions.AdjustersPermissions.Actions.EditAdjuster,
  // Attorneys
  ViewAttorneys: Permissions.AttorneysPermissions.Actions.ViewAttorneys,
  CreateAttorney: Permissions.AttorneysPermissions.Actions.CreateAttorney,
  EditAttorney: Permissions.AttorneysPermissions.Actions.EditAttorney,
  // Locations
  ViewLocations: Permissions.LocationPermissions.Actions.ViewLocations,
  CreateLocation: Permissions.LocationPermissions.Actions.CreateLocation,
  EditLocation: Permissions.LocationPermissions.Actions.EditLocation,
  // Notifications
  ViewNotifications: Permissions.Notifications.Actions.ViewNotifications,
  // Delivery Tracker
  ViewDeliveryTracker: Permissions.Tracking.Actions.ViewDeliveryTracker,
  // System Settings
  ViewSpeciality: Permissions.SpecialityGeneral.Actions.ViewSpeciality,
  CreateSpeciality: Permissions.SpecialityGeneral.Actions.CreateSpeciality,
  EditSpeciality: Permissions.SpecialityGeneral.Actions.UpdateSpeciality,
  ViewBodyPart: Permissions.General.Actions.ViewBodyPart,
  CreateBodyPart: Permissions.General.Actions.CreateBodyPart,
  EditBodyPart: Permissions.General.Actions.UpdateBodyPart,
} as const;

export const router = createBrowserRouter(
  [
    // ─── Public / Auth routes (no dashboard layout) ─────────────────
    {
      path: '/',
      children: [
        {
          element: <AuthGuard requiredAuth={false} />,
          children: [
            { path: FULL_ROUTES_PATH.AUTH.CALLBACK, element: <AuthCallbackPage /> },
            { path: FULL_ROUTES_PATH.AUTH.ERROR, element: <AuthErrorPage /> },
            { path: FULL_ROUTES_PATH.AUTH.SIGNOUT_CALLBACK, element: <SignoutCallbackPage /> },
            { path: FULL_ROUTES_PATH.PRIVACY_POLICY.INDEX, element: <PrivacyPolicyPage /> },
          ],
        },

        // ─── Digital Forms (separate layout, auth required) ───────
        {
          element: <AuthGuard requiredAuth />,
          children: [
            {
              element: <DigitalFormLayout />,
              children: [
                {
                  path: FULL_ROUTES_PATH.DIGITAL_FORMS.INDEX,
                  children: [{ path: FULL_ROUTES_PATH.DIGITAL_FORMS.WELCOME, element: <DigitalFormPage /> }],
                },
              ],
            },
          ],
        },

        // ─── Dashboard routes (AuthGuard + DashboardLayout + ErrorBoundary) ───────
        {
          element: <AuthGuard requiredAuth />,
          errorElement: <ErrorBoundary />,
          children: [
            {
              element: <DashboardLayout />,
              children: [
                // Home → redirect to setup
                { index: true, element: <Navigate to={FULL_ROUTES_PATH.HOME.SETUP} replace /> },
                { path: FULL_ROUTES_PATH.HOME.SETUP, element: <SetupPage /> },

                // ─── Doctors ──────────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.DOCTORS.INDEX,
                  children: [
                    { index: true, element: <DoctorListPage /> },
                    {
                      path: FULL_ROUTES_PATH.DOCTORS.PROFILE,
                      children: [
                        { index: true, element: <DoctorProfilePage /> },
                        { path: FULL_ROUTES_PATH.DOCTORS.FOLDERS, element: <DoctorFolderDetailsPage /> },
                      ],
                    },
                    {
                      path: FULL_ROUTES_PATH.DOCTORS.PERSONAL_PROFILE,
                      children: [
                        { index: true, element: <DoctorPersonalProfilePage /> },
                        { path: FULL_ROUTES_PATH.DOCTORS.FOLDERS, element: <DoctorFolderDetailsPage /> },
                      ],
                    },
                    {
                      path: FULL_ROUTES_PATH.DOCTORS.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateDoctor]}>
                          <DoctorCreatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.DOCTORS.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditDoctor]}>
                          <DoctorUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.DOCTORS.PERSONAL_UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditMyDoctorProfile]}>
                          <DoctorPersonalUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Doctors V2 ───────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.DOCTORS_V2.INDEX,
                  children: [
                    {
                      path: FULL_ROUTES_PATH.DOCTORS_V2.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateDoctor]}>
                          <CreateDoctorPage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.DOCTORS_V2.COMPLETE_PROFILE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditDoctor]}>
                          <DoctorCompleteProfilePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.DOCTORS_V2.PROFILE,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewDoctors]}>
                          <DoctorPage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Appointments ─────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.APPOINTMENTS.INDEX,
                  element: <AuthorizationGuard permissions={[P.ViewAppointment]} />,
                  children: [
                    { index: true, element: <AppointmentListPage /> },
                    {
                      path: FULL_ROUTES_PATH.APPOINTMENTS.PROFILE,
                      children: [
                        { index: true, element: <AppointmentProfilePage /> },
                        { path: FULL_ROUTES_PATH.APPOINTMENTS.FOLDERS, element: <AppointmentFolderDetailsPage /> },
                      ],
                    },
                    { path: FULL_ROUTES_PATH.APPOINTMENTS.FINANCIALS_REQUESTS, element: <AppointmentFinancialsRequestsListPage /> },
                    { path: FULL_ROUTES_PATH.APPOINTMENTS.RECORDS, element: <RecordsPage /> },
                    {
                      path: FULL_ROUTES_PATH.APPOINTMENTS.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateAppointment]}>
                          <AppointmentCreatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.APPOINTMENTS.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditAppointment]}>
                          <AppointmentUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Appointments V2 ──────────────────────────────
                {
                  path: FULL_ROUTES_PATH.APPOINTMENTS_V2.INDEX,
                  children: [
                    {
                      path: FULL_ROUTES_PATH.APPOINTMENTS_V2.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateAppointment]}>
                          <CreateAppointmentPageV2 />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.APPOINTMENTS_V2.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditAppointment]}>
                          <UpdateAppointmentPageV2 />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Active Reports ───────────────────────────────
                {
                  path: FULL_ROUTES_PATH.ACTIVE_REPORTS.INDEX,
                  element: <AuthorizationGuard permissions={[P.ViewReport]} />,
                  children: [
                    { index: true, element: <ActiveReportListPage /> },
                    {
                      path: FULL_ROUTES_PATH.ACTIVE_REPORTS.PROFILE,
                      children: [
                        { index: true, element: <ActiveReportProfilePage /> },
                        { path: FULL_ROUTES_PATH.ACTIVE_REPORTS.FOLDERS, element: <ActiveReportFolderDetailsPage /> },
                      ],
                    },
                    {
                      path: FULL_ROUTES_PATH.ACTIVE_REPORTS.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateReport]}>
                          <ActiveReportCreatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.ACTIVE_REPORTS.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditReport]}>
                          <ActiveReportUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Archived Reports ─────────────────────────────
                {
                  path: FULL_ROUTES_PATH.ARCHIVED_REPORTS.INDEX,
                  element: <AuthorizationGuard permissions={[P.ViewArchivedReport]} />,
                  children: [
                    { index: true, element: <ArchivedReportListPage /> },
                    {
                      path: FULL_ROUTES_PATH.ARCHIVED_REPORTS.PROFILE,
                      children: [
                        { index: true, element: <ArchivedReportProfilePage /> },
                        { path: FULL_ROUTES_PATH.ARCHIVED_REPORTS.FOLDERS, element: <ArchivedReportFolderDetailsPage /> },
                      ],
                    },
                  ],
                },

                // ─── Users ────────────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.USERS.INDEX,
                  children: [
                    {
                      index: true,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewUsers]}>
                          <UserListPage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.USERS.PROFILE,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewUsers]}>
                          <UserProfilePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.USERS.PERSONAL_PROFILE,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewMyProfile]}>
                          <UserPersonalProfilePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.USERS.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateUser]}>
                          <UserCreatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.USERS.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditUser]}>
                          <UserUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.USERS.PERSONAL_UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditMyProfile]}>
                          <UserPersonalUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Users V2 ─────────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.USERS_V2.INDEX,
                  children: [
                    {
                      index: true,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewUsers]}>
                          <UsersPage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Patients ─────────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.PATIENTS.INDEX,
                  element: <AuthorizationGuard permissions={[P.ViewPatient]} />,
                  children: [
                    { index: true, element: <PatientsListPage /> },
                    {
                      path: FULL_ROUTES_PATH.PATIENTS.PROFILE,
                      children: [
                        { index: true, element: <PatientProfilePage /> },
                        { path: FULL_ROUTES_PATH.PATIENTS.FOLDERS, element: <PatientFolderDetailsPage /> },
                      ],
                    },
                    {
                      path: FULL_ROUTES_PATH.PATIENTS.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreatePatient]}>
                          <PatientCreatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.PATIENTS.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditPatient]}>
                          <PatientUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Financials ───────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.FINANCIALS.INDEX,
                  children: [
                    { index: true, element: <Navigate to={FULL_ROUTES_PATH.FINANCIALS.REQUESTS} replace /> },
                    {
                      path: FULL_ROUTES_PATH.FINANCIALS.REQUESTS,
                      element: <AuthorizationGuard permissions={[P.ViewFinancialRequests]} />,
                      children: [
                        { index: true, element: <FinancialRequestsPage /> },
                        {
                          path: FULL_ROUTES_PATH.FINANCIALS.REQUESTS_PROFILE,
                          children: [
                            { index: true, element: <FinancialRequestProfilePage /> },
                            { path: FULL_ROUTES_PATH.FINANCIALS.FOLDERS, element: <FinancialRequestFolderDetailsPage /> },
                          ],
                        },
                      ],
                    },
                    {
                      path: FULL_ROUTES_PATH.FINANCIALS.REPORTS,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewFinancialReports]}>
                          <FinancialReportsPage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.FINANCIALS.AGING_REPORTS,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewAgingReport]}>
                          <AgingReportsPage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.FINANCIALS.PENDING_BILLING.replace(`${FULL_ROUTES_PATH.FINANCIALS.INDEX}/`, ''),
                      element: <AuthorizationGuard permissions={[P.ViewPendingBilling]} />,
                      children: [
                        { index: true, element: <PendingBillingPage /> },
                        {
                          path: 'profile/:appointmentId',
                          children: [
                            { index: true, element: <PendingBillingProfilePage /> },
                            { path: 'folders/:sectionId/:folderId', element: <ActiveReportFolderDetailsPage /> },
                          ],
                        },
                      ],
                    },
                    // Payments
                    {
                      path: FULL_ROUTES_PATH.FINANCIALS.PAYMENTS.INDEX,
                      children: [
                        {
                          index: true,
                          element: (
                            <AuthorizationGuard permissions={[P.ViewPayments]}>
                              <PaymentsPage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.FINANCIALS.PAYMENTS.PROFILE,
                          element: (
                            <AuthorizationGuard permissions={[P.ViewPayments]}>
                              <PaymentProfilePage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.FINANCIALS.PAYMENTS.CREATE,
                          element: (
                            <AuthorizationGuard permissions={[P.CreatePayment]}>
                              <PaymentCreatePage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.FINANCIALS.PAYMENTS.UPDATE,
                          element: (
                            <AuthorizationGuard permissions={[P.EditPayment]}>
                              <PaymentUpdatePage />
                            </AuthorizationGuard>
                          ),
                        },
                      ],
                    },
                    // Extra Payments
                    {
                      path: FULL_ROUTES_PATH.FINANCIALS.EXTRA_PAYMENTS.INDEX,
                      children: [
                        {
                          index: true,
                          element: (
                            <AuthorizationGuard permissions={[P.ViewExtraPayments]}>
                              <ExtraPaymentsPage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.FINANCIALS.EXTRA_PAYMENTS.PROFILE,
                          element: (
                            <AuthorizationGuard permissions={[P.ViewExtraPayments]}>
                              <ExtraPaymentProfilePage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.FINANCIALS.EXTRA_PAYMENTS.CREATE,
                          element: (
                            <AuthorizationGuard permissions={[P.CreateExtraPayment]}>
                              <ExtraPaymentCreatePage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.FINANCIALS.EXTRA_PAYMENTS.UPDATE,
                          element: (
                            <AuthorizationGuard permissions={[P.EditExtraPayment]}>
                              <ExtraPaymentUpdatePage />
                            </AuthorizationGuard>
                          ),
                        },
                      ],
                    },
                  ],
                },

                // ─── Financials V2 ───────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.FINANCIALS_V2.INDEX,
                  children: [
                    { index: true, element: <Navigate to={FULL_ROUTES_PATH.FINANCIALS_V2.REQUESTS} replace /> },
                    {
                      path: FULL_ROUTES_PATH.FINANCIALS_V2.REQUESTS,
                      element: <AuthorizationGuard permissions={[P.ViewFinancialRequests]} />,
                      children: [
                        { index: true, element: <FinancialRequestsPage /> },
                        { path: FULL_ROUTES_PATH.FINANCIALS_V2.REQUESTS_PROFILE, element: <FinancialRequestPage /> },
                      ],
                    },
                  ],
                },

                // ─── Management ───────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.MANAGEMENT.INDEX,
                  children: [{ index: true, element: <ManagementHomePage /> }],
                },

                // ─── Roles Management ─────────────────────────────
                {
                  path: FULL_ROUTES_PATH.MANAGEMENT.ROLES.INDEX,
                  element: <AuthorizationGuard permissions={[P.ViewRole]} />,
                  children: [
                    { index: true, element: <RoleListPage /> },
                    { path: 'update/:roleId', element: <RoleDetailsPage /> },
                    { path: 'update-single/:roleId', element: <SingleRoleDetailsPage /> },
                  ],
                },

                // ─── Permissions Matrix ──────────────────────────
                {
                  path: `${FULL_ROUTES_PATH.MANAGEMENT.INDEX}/${FULL_ROUTES_PATH.MANAGEMENT.ROLES.PERMISSIONS_MATRIX}`,
                  element: (
                    <AuthorizationGuard permissions={[P.ViewRole]}>
                      <PermissionsMatrixPage />
                    </AuthorizationGuard>
                  ),
                },

                // ─── Adjusters ────────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.MANAGEMENT.ADJUSTERS.INDEX,
                  children: [
                    {
                      index: true,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewAdjusters]}>
                          <AdjustersListPage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.MANAGEMENT.ADJUSTERS.PROFILE,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewAdjusters]}>
                          <AdjusterProfilePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.MANAGEMENT.ADJUSTERS.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateAdjuster]}>
                          <AdjusterCreatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.MANAGEMENT.ADJUSTERS.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditAdjuster]}>
                          <AdjusterUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Attorneys ────────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.MANAGEMENT.ATTORNEYS.INDEX,
                  children: [
                    {
                      index: true,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewAttorneys]}>
                          <AttorneyListPage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.MANAGEMENT.ATTORNEYS.PROFILE,
                      element: (
                        <AuthorizationGuard permissions={[P.ViewAttorneys]}>
                          <AttorneyProfilePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.MANAGEMENT.ATTORNEYS.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateAttorney]}>
                          <AttorneyCreatePage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.MANAGEMENT.ATTORNEYS.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditAttorney]}>
                          <AttorneyUpdatePage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Locations Management ─────────────────────────
                {
                  path: FULL_ROUTES_PATH.LOCATIONS_MANAGEMENT.INDEX,
                  element: <AuthorizationGuard permissions={[P.ViewLocations]} />,
                  children: [
                    { index: true, element: <LocationsPage /> },
                    { path: FULL_ROUTES_PATH.LOCATIONS_MANAGEMENT.PROFILE, element: <LocationProfilePage /> },
                    {
                      path: FULL_ROUTES_PATH.LOCATIONS_MANAGEMENT.CREATE,
                      element: (
                        <AuthorizationGuard permissions={[P.CreateLocation]}>
                          <CreateLocationPage />
                        </AuthorizationGuard>
                      ),
                    },
                    {
                      path: FULL_ROUTES_PATH.LOCATIONS_MANAGEMENT.UPDATE,
                      element: (
                        <AuthorizationGuard permissions={[P.EditLocation]}>
                          <UpdateLocationPage />
                        </AuthorizationGuard>
                      ),
                    },
                  ],
                },

                // ─── Notifications ────────────────────────────────
                {
                  path: FULL_ROUTES_PATH.NOTIFICATIONS.INDEX,
                  element: (
                    <AuthorizationGuard permissions={[P.ViewNotifications]}>
                      <NotificationsPage />
                    </AuthorizationGuard>
                  ),
                },

                // ─── Delivery Tracker ─────────────────────────────
                {
                  path: FULL_ROUTES_PATH.DELIVERY_TRACKER.INDEX,
                  element: (
                    <AuthorizationGuard permissions={[P.ViewDeliveryTracker]}>
                      <DeliveryTrackerPage />
                    </AuthorizationGuard>
                  ),
                },

                // ─── System Settings ──────────────────────────────
                {
                  path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.INDEX,
                  children: [
                    {
                      index: true,
                      element: <Navigate to={FULL_ROUTES_PATH.SYSTEM_SETTINGS.SPECIALITIES.INDEX} replace />,
                    },
                    {
                      path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.SPECIALITIES.INDEX,
                      element: <AuthorizationGuard permissions={[P.ViewSpeciality]} />,
                      children: [
                        { index: true, element: <SpecialitiesPage /> },
                        { path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.SPECIALITIES.PROFILE, element: <SpecialityProfilePage /> },
                        {
                          path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.SPECIALITIES.CREATE,
                          element: (
                            <AuthorizationGuard permissions={[P.CreateSpeciality]}>
                              <SpecialityCreatePage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.SPECIALITIES.UPDATE,
                          element: (
                            <AuthorizationGuard permissions={[P.EditSpeciality]}>
                              <SpecialityUpdatePage />
                            </AuthorizationGuard>
                          ),
                        },
                      ],
                    },
                    {
                      path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.BODY_PARTS.INDEX,
                      element: <AuthorizationGuard permissions={[P.ViewBodyPart]} />,
                      children: [
                        { index: true, element: <BodyPartsPage /> },
                        { path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.BODY_PARTS.PROFILE, element: <BodyPartProfilePage /> },
                        {
                          path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.BODY_PARTS.CREATE,
                          element: (
                            <AuthorizationGuard permissions={[P.CreateBodyPart]}>
                              <BodyPartCreatePage />
                            </AuthorizationGuard>
                          ),
                        },
                        {
                          path: FULL_ROUTES_PATH.SYSTEM_SETTINGS.BODY_PARTS.UPDATE,
                          element: (
                            <AuthorizationGuard permissions={[P.EditBodyPart]}>
                              <BodyPartUpdatePage />
                            </AuthorizationGuard>
                          ),
                        },
                      ],
                    },
                  ],
                },

                // ─── Components Gallery (for development/testing) ──────────────────────────────
                { path: FULL_ROUTES_PATH.COMPONENTS.INDEX, element: <ComponentsGalleryPage /> },
              ],
            },
          ],
        },

        // ─── Error & Utility Pages ────────────────────────
        {
          element: <AuthGuard requiredAuth />,
          children: [{ path: FULL_ROUTES_PATH.ERRORS.FORBIDDEN, element: <ForbiddenPage /> }],
        },

        // Catch-all route
        {
          element: <AuthGuard requiredAuth />,
          children: [
            {
              path: '*',
              element: <NotFoundPage />,
            },
          ],
        },
      ],
    },
  ],
  { basename: '/med-legal' },
);
