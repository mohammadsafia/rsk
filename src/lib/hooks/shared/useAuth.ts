import { useAuth as useOidcAuth } from 'react-oidc-context';

import { useLogout } from 'hooks/auth/useLogout';

export const useAuth = () => {
  const auth = useOidcAuth();
  const { onLogoutHandler } = useLogout();
  const profile = auth.user?.profile;

  const currentUser = profile
    ? {
        name: (profile.name as string) ?? (profile.preferred_username as string) ?? '',
        email: (profile.email as string) ?? '',
        picture: (profile.picture as string) ?? '',
        userId: profile.sub,
      }
    : null;

  return {
    currentUser,
    removeCurrentUser: onLogoutHandler,
    isAuthed: auth.isAuthenticated && !auth.user?.expired,
  };
};
