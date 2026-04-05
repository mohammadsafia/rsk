import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AuthGuard, AuthLayout, DashboardLayout, ErrorBoundary } from '@layouts';

import { FULL_ROUTES_PATH } from './routes';

const ComponentsGalleryPage = lazy(() => import('@pages/components/ComponentsGalleryPage'));
const ComponentDetailPage = lazy(() => import('@pages/components/ComponentDetailPage'));

export const router = createBrowserRouter([
  // Public routes
  {
    path: FULL_ROUTES_PATH.HOME.INDEX,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <div className="flex h-dvh items-center justify-center">Home (Public)</div>,
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
            element: <div className="p-6">Dashboard</div>,
          },
          {
            path: FULL_ROUTES_PATH.COMPONENTS.INDEX,
            element: <ComponentsGalleryPage />,
          },
          {
            path: FULL_ROUTES_PATH.COMPONENTS.DETAIL,
            element: <ComponentDetailPage />,
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
