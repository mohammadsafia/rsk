import { Outlet, useSearchParams } from 'react-router';

import { safeNext } from '@utils';
import { FULL_ROUTES_PATH } from '@routes';

import { AuthLayoutShell } from './AuthLayoutShell';

/** The Vite app's sign-in layout: a signed-in visitor continues to ?next= when that is a page of this app. */
function AuthLayout() {
  const [params] = useSearchParams();

  return (
    <AuthLayoutShell redirectTo={safeNext(params.get('next'), FULL_ROUTES_PATH.HOME.DASHBOARD)}>
      <Outlet />
    </AuthLayoutShell>
  );
}

export default AuthLayout;
