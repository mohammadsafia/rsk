'use client';

import type { ReactElement, ReactNode } from 'react';

import { AuthProvider } from '@contexts';

import { AuthLayoutShell } from '@layouts';

/** The sign-in pages' frame: no session yet (the cookie is the server's); signed in, on to `redirectTo`. */
export function AuthFrame({ redirectTo, children }: { redirectTo: string; children: ReactNode }): ReactElement {
  return (
    <AuthProvider persist="none" initialSession={null}>
      <AuthLayoutShell redirectTo={redirectTo}>{children}</AuthLayoutShell>
    </AuthProvider>
  );
}
