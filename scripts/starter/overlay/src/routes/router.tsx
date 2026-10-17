import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppLayout, AuthGuard, AuthLayout, ErrorBoundary } from '@layouts';

import { FULL_ROUTES_PATH } from './routes';
import { LoginPlaceholder, NotFound, SettingsPlaceholder } from './RoutePlaceholders';

const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));

export const router = createBrowserRouter([
  // The app starts on the dashboard; replace with a public landing page if you need one.
  {
    path: FULL_ROUTES_PATH.HOME.INDEX,
    element: <Navigate to={FULL_ROUTES_PATH.HOME.DASHBOARD} replace />,
  },

  // Auth routes (login, register, etc.)
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
