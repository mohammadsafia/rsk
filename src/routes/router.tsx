import { lazy } from 'react';
import { createBrowserRouter, redirect } from 'react-router-dom';

import App from '../App';
import DashboardLayout from '@layouts/dashboard-layout';
import AuthLayout from '@layouts/auth-layout';
import ErrorBoundary from '@layouts/error-boundary';
import NotFound from '@layouts/not-found';
import AuthGuard from '@layouts/auth-guard';

import { FULL_ROUTES_PATH } from './routes';
import { ROLES } from '@app-types';

const UsersPage = lazy(() => import('@pages/users/UsersPage'));
const HomePage = lazy(() => import('@pages/home/HomePage'));

export const router = createBrowserRouter(
  [
    // Public routes
    {
      path: FULL_ROUTES_PATH.HOME.INDEX,
      element: <App />,
      children: [{ path: FULL_ROUTES_PATH.HOME.HOME, element: <HomePage /> }],
    },

    // Auth routes
    {
      path: FULL_ROUTES_PATH.AUTH.INDEX,
      element: <AuthLayout />,
      children: [
        {
          index: true,
          loader: () => redirect(FULL_ROUTES_PATH.HOME.INDEX),
        },
        {
          path: FULL_ROUTES_PATH.AUTH.SIGN_IN,
          element: <h1>SIGN IN</h1>,
        },
      ],
    },

    // Dashboard routes
    {
      element: <AuthGuard roles={[ROLES.ALL]} />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          element: <DashboardLayout />,
          children: [
            {
              path: FULL_ROUTES_PATH.USERS.INDEX,
              children: [{ index: true, element: <UsersPage /> }],
            },
          ],
        },
      ],
    },

    // Catch-all route
    {
      element: <AuthGuard roles={[ROLES.ALL]} />,
      children: [
        {
          path: '*',
          element: <NotFound />,
        },
      ],
    },
  ],

  {
    future: { v7_relativeSplatPath: true },
  },
);
