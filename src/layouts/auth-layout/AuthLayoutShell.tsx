'use client';

import { type ReactElement, type ReactNode, useEffect } from 'react';

import { Spinner } from '@components/ui';
import { Logo, Toaster } from '@components/shared';
import { Conditional } from '@components/utils';

import { useKitNavigate } from '@contexts';
import { useAuth } from '@hooks/shared';

type AuthLayoutShellProps = {
  children: ReactNode;
  /** Where a signed-in visitor goes on to: a path inside this app, without a language prefix. */
  redirectTo: string;
};

/** The sign-in pages' frame. Signed in (or just signed in): it continues to `redirectTo`, keeping the frame while the app loads. */
export function AuthLayoutShell({ children, redirectTo }: AuthLayoutShellProps): ReactElement {
  const navigate = useKitNavigate();
  const { isAuthed } = useAuth();

  useEffect(() => {
    if (isAuthed) navigate(redirectTo, { replace: true });
  }, [isAuthed, navigate, redirectTo]);

  return (
    <>
      <Toaster />

      <main className="bg-canvas text-fg flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
        <Logo variant="lockup" size="lg" tagline />

        <Conditional>
          <Conditional.If condition={isAuthed}>
            <Spinner size="lg" />
          </Conditional.If>

          <Conditional.Else>{children}</Conditional.Else>
        </Conditional>
      </main>
    </>
  );
}
