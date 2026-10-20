import type { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

type AuthGuardProps = PropsWithChildren;

/** Signed-out visitors go to sign in, carrying where they were going (?next=) so they land there afterwards. */
function AuthGuard(props: AuthGuardProps) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`${FULL_ROUTES_PATH.AUTH.LOGIN}?next=${next}`} replace />;
  }

  return props.children ?? <Outlet />;
}

export default AuthGuard;
