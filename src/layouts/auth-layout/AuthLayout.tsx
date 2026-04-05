import { Navigate, Outlet } from 'react-router-dom';

import { Toaster } from '@components/shared';
import { useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

function AuthLayout() {
  const { isAuthed } = useAuth();

  if (isAuthed) return <Navigate to={FULL_ROUTES_PATH.HOME.DASHBOARD} replace />;

  return (
    <>
      <Toaster />

      <div className="bg-background flex h-screen w-screen items-center justify-center">
        <Outlet />
      </div>
    </>
  );
}

export default AuthLayout;
