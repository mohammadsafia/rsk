import { type ReactElement } from 'react';
import { isRouteErrorResponse, useRevalidator, useRouteError } from 'react-router';

import { Conditional } from '@components/utils';

import NotFoundPage from './NotFoundPage';
import ServerErrorScreen from './ServerErrorScreen';
import { type SystemPageProps } from './SystemPage';

/**
 * 500: a route's error element (the app's whole router uses it once this block is added). A 404 response thrown by a
 * loader shows the not-found page instead; "Try again" re-runs the route's loaders. Needs a data router
 * (createBrowserRouter); outside one, use ServerErrorScreen.
 */
function ServerErrorPage({ layout }: Pick<SystemPageProps, 'layout'>): ReactElement {
  const error = useRouteError();
  const revalidator = useRevalidator();

  const handleRetry = () => {
    void revalidator.revalidate();
  };

  return (
    <Conditional>
      <Conditional.If condition={isRouteErrorResponse(error) && error.status === 404}>
        <NotFoundPage layout={layout} />
      </Conditional.If>

      <Conditional.Else>
        <ServerErrorScreen layout={layout} retrying={revalidator.state === 'loading'} onRetry={handleRetry} />
      </Conditional.Else>
    </Conditional>
  );
}

export default ServerErrorPage;
