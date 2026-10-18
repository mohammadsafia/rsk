import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject, useParams } from 'react-router';

import { Spinner } from '@components/ui';

// The docs site is a development tool. `vp build` replaces import.meta.env.DEV with false, so this
// function is dead code in production and none of its lazy chunks (layout, pages, MDX) are emitted.
const createDocsRoutes = (): RouteObject[] => {
  const DocsLayout = lazy(() => import('../layouts/docs-layout/DocsLayout'));
  const DocsDocPage = lazy(() => import('@pages/docs/DocsDocPage'));
  const DocsComponentPage = lazy(() => import('@pages/docs/DocsComponentPage'));
  const DocsComponentsPage = lazy(() => import('@pages/docs/DocsComponentsPage'));

  const RedirectComponent = () => <Navigate replace to={`/docs/components/${useParams().id ?? ''}`} />;

  return [
    {
      path: '/docs',
      element: (
        <Suspense fallback={<Spinner overlay size="lg" />}>
          <DocsLayout />
        </Suspense>
      ),
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
};

export const docsRoutes: RouteObject[] = import.meta.env.DEV ? createDocsRoutes() : [];
