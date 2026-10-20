import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject, useParams } from 'react-router';

import { Spinner } from '@components/ui';

// The docs site exists in development and in the docs build (`pnpm docs:build`, mode "docs"). `vp build` replaces
// import.meta.env.DEV with false and MODE with "production", so in an app's build this function is dead code and
// none of its lazy chunks (layout, pages, MDX) are emitted.
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

export const docsRoutes: RouteObject[] = import.meta.env.DEV || import.meta.env.MODE === 'docs' ? createDocsRoutes() : [];
