import { Navigate, Outlet, useSearchParams } from 'react-router';

import { Spinner } from '@components/ui';

import { Logo, Toaster } from '@components/shared';
import { Conditional } from '@components/utils';

import { useAuth } from '@hooks/shared';

import { safeNext } from '@utils';
import { FULL_ROUTES_PATH } from '@routes';

function AuthLayout() {
  const [params] = useSearchParams();

  const { isAuthed } = useAuth();

  return (
    <>
      <Toaster />

      <main className="bg-canvas text-fg flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
        <Logo variant="lockup" size="lg" tagline />

        {/* Signed in (or just signed in): continue to where they were going, when that is a page of this app. The
            layout stays while the app's pages load, so the screen never goes blank. */}
        <Conditional>
          <Conditional.If condition={isAuthed}>
            <Spinner size="lg" />
            <Navigate to={safeNext(params.get('next'), FULL_ROUTES_PATH.HOME.DASHBOARD)} replace />
          </Conditional.If>

          <Conditional.Else>
            <Outlet />
          </Conditional.Else>
        </Conditional>
      </main>
    </>
  );
}

export default AuthLayout;
