import { useLocation } from 'react-router-dom';

export const useRouteUtils = () => {
  const { pathname } = useLocation();

  const matchesRoute = (path: string): boolean => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return pathname === normalizedPath || pathname.startsWith(`${normalizedPath}/`);
  };

  const isAnyRouteActive = (paths: string[]): boolean => paths.some(matchesRoute);

  return {
    isActiveLink: matchesRoute,
    isActiveSubLink: matchesRoute,
    isAnyRouteActive,
  };
};
