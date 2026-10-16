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

      <main className="bg-canvas text-fg flex min-h-dvh items-center justify-center p-6">
        <Outlet />
      </main>
    </>
  );
}

export default AuthLayout;
