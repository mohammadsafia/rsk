import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import { AuthGuard, AuthLayout, ErrorBoundary } from '@layouts';

import { appBlockRoutes, bareBlockRoutes, BlockErrorElement } from '../blocks';
import { FULL_ROUTES_PATH } from './routes';
import { NotFound, SettingsPlaceholder } from './RoutePlaceholders';

const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));

// A block's error page (kit:add system-pages) replaces the kit's when one is added; it loads only when a route fails.
const RouteError = BlockErrorElement ?? ErrorBoundary;

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
    errorElement: (
      <Suspense>
        <RouteError />
      </Suspense>
    ),
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

  // App routes — protected by AuthGuard, inside the app shell (sidebar, header, command palette). The shell and each
  // page load with the route (in parallel), so a signed-out visitor on the sign-in page never downloads them.
  {
    element: <AuthGuard />,
    errorElement: (
      <Suspense>
        <RouteError />
      </Suspense>
    ),
    children: [
      {
        lazy: async () => ({ Component: (await import('../layouts/app-layout/AppLayout')).default }),
        children: [
          {
            path: FULL_ROUTES_PATH.HOME.DASHBOARD,
            lazy: async () => ({ Component: (await import('@pages/dashboard/DashboardPage')).default }),
          },
          {
            path: FULL_ROUTES_PATH.SETTINGS.INDEX,
            element: <SettingsPlaceholder />,
          },
          // Pages of the blocks added with kit:add (src/blocks/index.ts)
          ...appBlockRoutes,
        ],
      },
    ],
  },

  // Blocks' pages without the app shell; a block's 404 comes before the one below, so it wins. The pathless parent
  // gives them the error page (e.g. when their chunk fails to load).
  {
    errorElement: (
      <Suspense>
        <RouteError />
      </Suspense>
    ),
    children: bareBlockRoutes,
  },

  // Catch-all 404
  {
    path: '*',
    element: <NotFound />,
  },
]);
