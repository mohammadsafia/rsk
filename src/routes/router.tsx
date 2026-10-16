import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AppLayout, AuthGuard, AuthLayout, ErrorBoundary } from '@layouts';

import { docsRoutes } from './docs-routes';
import { FULL_ROUTES_PATH } from './routes';
import { LoginPlaceholder, NotFound, SettingsPlaceholder } from './RoutePlaceholders';

const HomePage = lazy(() => import('@pages/home/HomePage'));
const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
const MembersPage = lazy(() => import('@pages/members/MembersPage'));

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
            element: <DashboardPage />,
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
