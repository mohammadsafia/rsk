import { Navigate, Outlet } from 'react-router';

import { Logo, Toaster } from '@components/shared';
import { useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

function AuthLayout() {
  const { isAuthed } = useAuth();

  if (isAuthed) return <Navigate to={FULL_ROUTES_PATH.HOME.DASHBOARD} replace />;

  return (
    <>
      <Toaster />

      <main className="bg-canvas text-fg flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
        <Logo variant="lockup" size="lg" tagline />

        <Outlet />
      </main>
    </>
  );
}

export default AuthLayout;
