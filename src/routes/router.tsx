import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AppLayout, AuthGuard, AuthLayout, ErrorBoundary } from '@layouts';

import { docsRoutes } from './docs-routes';
import { FULL_ROUTES_PATH } from './routes';
import { LoginPlaceholder, NotFound, SettingsPlaceholder } from './RoutePlaceholders';

const HomePage = lazy(() => import('@pages/home/HomePage'));
const OperationsDashboard = lazy(() => import('@pages/clinic/dashboard/OperationsDashboard'));
const MembersPage = lazy(() => import('@pages/members/MembersPage'));
const PatientsPage = lazy(() => import('@pages/clinic/patients/PatientsPage'));
const BillingPage = lazy(() => import('@pages/clinic/billing/BillingPage'));
const SchedulePage = lazy(() => import('@pages/clinic/schedule/SchedulePage'));
const PatientProfilePage = lazy(() => import('@pages/clinic/patient-profile/PatientProfilePage'));

export const router = createBrowserRouter([
  // Public documentation site (no auth) and redirects from the old /components gallery
  ...docsRoutes.map((route) => (route.path === '/docs' ? { ...route, errorElement: <ErrorBoundary /> } : route)),

  // Public routes
  {
    path: FULL_ROUTES_PATH.HOME.INDEX,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense>
            <HomePage />
          </Suspense>
        ),
      },
    ],
  },

  // Auth routes (login, register, etc.) — redirects to dashboard if already authenticated
  {
    path: FULL_ROUTES_PATH.AUTH.INDEX,
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: FULL_ROUTES_PATH.AUTH.LOGIN,
        element: <LoginPlaceholder />,
      },
    ],
  },

  // Dashboard routes — protected by AuthGuard
  {
    element: <AuthGuard />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: FULL_ROUTES_PATH.HOME.DASHBOARD,
            element: <OperationsDashboard />,
          },
          {
            path: FULL_ROUTES_PATH.SCHEDULE.INDEX,
            element: <SchedulePage />,
          },
          {
            path: FULL_ROUTES_PATH.PATIENTS.INDEX,
            element: <PatientsPage />,
          },
          {
            path: FULL_ROUTES_PATH.PATIENTS.DETAIL,
            element: <PatientProfilePage />,
          },
          {
            path: FULL_ROUTES_PATH.BILLING.INDEX,
            element: <BillingPage />,
          },
          {
            path: FULL_ROUTES_PATH.MEMBERS.INDEX,
            element: <MembersPage />,
          },
          {
            path: FULL_ROUTES_PATH.SETTINGS.INDEX,
            element: <SettingsPlaceholder />,
          },
        ],
      },
    ],
  },

  // Catch-all 404
  {
    path: '*',
    element: <NotFound />,
  },
]);
