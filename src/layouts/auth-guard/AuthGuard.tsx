import type { PropsWithChildren } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { PrimeLoader } from '@components/shared';
import { useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

type AuthGuardProps = PropsWithChildren;

function AuthGuard(props: AuthGuardProps) {
  const { isAuthed } = useAuth();

  if (!isAuthed) return <Navigate to={FULL_ROUTES_PATH.AUTH.LOGIN} replace />;

  return props.children ?? <Outlet />;
}

export default AuthGuard;
