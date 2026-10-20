import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import { AppLayout, AuthGuard, AuthLayout, ErrorBoundary } from '@layouts';

import { FULL_ROUTES_PATH } from './routes';
import { NotFound, SettingsPlaceholder } from './RoutePlaceholders';

const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));

export const router = createBrowserRouter([
  // The app starts on the dashboard; replace with a public landing page if you need one.
  {
    path: FULL_ROUTES_PATH.HOME.INDEX,
    element: <Navigate to={FULL_ROUTES_PATH.HOME.DASHBOARD} replace />,
  },

  // Sign in and password reset; a signed-in visitor is sent on to ?next= or the dashboard
  {
    path: FULL_ROUTES_PATH.AUTH.INDEX,
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: FULL_ROUTES_PATH.AUTH.LOGIN,
        element: (
          <Suspense>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: FULL_ROUTES_PATH.AUTH.FORGOT_PASSWORD,
        element: (
          <Suspense>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
    ],
  },

  // App routes — protected by AuthGuard, inside the app shell (sidebar, header, command palette)
  {
    element: <AuthGuard />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: FULL_ROUTES_PATH.HOME.DASHBOARD,
            element: <DashboardPage />,
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
