import { ROLES } from '@app-types';
import { ROUTES_PATH } from '@routes';

import { useAuth } from './useAuth';

export const useRoles = () => {
  const { currentUser } = useAuth();

  const isAllowed = (roles: ROLES[]): boolean => {
    if (!currentUser) return false;
    if (roles.includes(ROLES.ALL)) return true;
    return roles.includes(currentUser.role);
  };

  const returnURL = ROUTES_PATH.HOME.INDEX;

  return { isAllowed, returnURL };
};
