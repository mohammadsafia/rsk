'use client';

import { type ReactElement, type ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { AuthProvider, type Session } from '@contexts';

import { AppLayoutShell } from '@layouts';

/** The cookie the server reads to render the sidebar as the person left it. */
export const SIDEBAR_COOKIE = 'rsk-sidebar';

type AppLayoutProps = {
  /** The signed-in person, from the server's cookie: the user only, never the token. */
  session: Session | null;
  sidebarCollapsed: boolean;
  children: ReactNode;
};

/** The signed-in app around each page: the session from the server, sign-out through it, the sidebar from a cookie. */
export function AppLayout({ session, sidebarCollapsed, children }: AppLayoutProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleCollapsedChange = useCallback((collapsed: boolean) => {
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  // The server clears the cookie; the refresh re-runs the (app) layout, which then sends the person to sign in.
  const handleSignOut = useCallback(
    () =>
      fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(() =>
        router.refresh(),
      ),
    [router],
  );
  const handleSessionEnd = useCallback(() => queryClient.clear(), [queryClient]);

  return (
    <AuthProvider persist="none" initialSession={session} signOutWith={handleSignOut} onSignOut={handleSessionEnd}>
      <AppLayoutShell shell={{ storageKey: null, initialCollapsed: sidebarCollapsed, onCollapsedChange: handleCollapsedChange }}>
        {children}
      </AppLayoutShell>
    </AuthProvider>
  );
}
