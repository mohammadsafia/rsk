'use client';

import { type ReactElement } from 'react';

import { Conditional } from '@components/utils';

import { type ErrorScreenProps } from './errorScreen';
import NotFoundPage from './NotFoundPage';
import ServerErrorScreen from './ServerErrorScreen';
import { type SystemPageProps } from './SystemPage';

/**
 * 500: the page for a route that failed (the app's router uses it once this block is added). A 404 shows the not-found
 * page instead; "Try again" calls `retry` (Vite: re-runs the route's loaders). The router supplies the props: the
 * block index's BlockErrorElement in a Vite app, error.tsx in a Next app.
 */
const reloadPage = (): void => window.location.reload();

function ServerErrorPage({
  layout,
  retry = reloadPage,
  retrying = false,
  notFound = false,
}: ErrorScreenProps & Pick<SystemPageProps, 'layout'>): ReactElement {
  return (
    <Conditional>
      <Conditional.If condition={notFound}>
        <NotFoundPage layout={layout} />
      </Conditional.If>

      <Conditional.Else>
        <ServerErrorScreen layout={layout} retrying={retrying} onRetry={retry} />
      </Conditional.Else>
    </Conditional>
  );
}

export default ServerErrorPage;
