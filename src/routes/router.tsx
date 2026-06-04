import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AuthGuard, AuthLayout, DashboardLayout, ErrorBoundary } from '@layouts';

import { FULL_ROUTES_PATH } from './routes';

const HomePage = lazy(() => import('@pages/home/HomePage'));
const ComponentsGalleryPage = lazy(() => import('@pages/components/ComponentsGalleryPage'));
const ComponentDetailPage = lazy(() => import('@pages/components/ComponentDetailPage'));
const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
const MembersPage = lazy(() => import('@pages/members/MembersPage'));

export const router = createBrowserRouter([
  // Public routes
  {
    path: FULL_ROUTES_PATH.HOME.INDEX,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Suspense><HomePage /></Suspense>,
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
        element: <div>Login Page</div>,
      },
    ],
  },

  // Dashboard routes — protected by AuthGuard
  {
    element: <AuthGuard />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: FULL_ROUTES_PATH.HOME.DASHBOARD,
            element: <DashboardPage />,
          },
          {
            path: FULL_ROUTES_PATH.COMPONENTS.INDEX,
            element: <ComponentsGalleryPage />,
          },
          {
            path: FULL_ROUTES_PATH.COMPONENTS.DETAIL,
            element: <ComponentDetailPage />,
          },
          {
            path: FULL_ROUTES_PATH.MEMBERS.INDEX,
            element: <MembersPage />,
          },
          {
            path: FULL_ROUTES_PATH.SETTINGS.INDEX,
            element: <div className="p-6">Settings</div>,
          },
        ],
      },
    ],
  },

  // Catch-all 404
  {
    path: '*',
    element: (
      <div className="text-muted-foreground flex h-dvh items-center justify-center text-lg">
        404 — Page not found
      </div>
    ),
  },
]);
