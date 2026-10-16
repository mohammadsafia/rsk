import { lazy } from 'react';
import { Navigate, type RouteObject, useParams } from 'react-router-dom';

import { DocsLayout } from '@layouts';

const DocsDocPage = lazy(() => import('@pages/docs/DocsDocPage'));
const DocsComponentPage = lazy(() => import('@pages/docs/DocsComponentPage'));
const DocsComponentsPage = lazy(() => import('@pages/docs/DocsComponentsPage'));

const RedirectComponent = () => <Navigate replace to={`/docs/components/${useParams().id ?? ''}`} />;

export const docsRoutes: RouteObject[] = [
  {
    path: '/docs',
    element: <DocsLayout />,
    children: [
      { index: true, element: <DocsDocPage /> },
      { path: 'components', element: <DocsComponentsPage /> },
      { path: 'components/:id', element: <DocsComponentPage /> },
      { path: ':docId', element: <DocsDocPage /> },
    ],
  },
  { path: '/components', element: <Navigate replace to="/docs/components" /> },
  { path: '/components/:id', element: <RedirectComponent /> },
];
