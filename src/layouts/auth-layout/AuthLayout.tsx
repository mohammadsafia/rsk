import { Navigate, Outlet, useSearchParams } from 'react-router';

import { Logo, Toaster } from '@components/shared';
import { useAuth } from '@hooks/shared';
import { safeNext } from '@utils';

import { FULL_ROUTES_PATH } from '@routes';

function AuthLayout() {
  const { isAuthed } = useAuth();
  const [params] = useSearchParams();

  // Signed in (or just signed in): continue to where they were going, when that is a page of this app.
  if (isAuthed) return <Navigate to={safeNext(params.get('next'), FULL_ROUTES_PATH.HOME.DASHBOARD)} replace />;

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
