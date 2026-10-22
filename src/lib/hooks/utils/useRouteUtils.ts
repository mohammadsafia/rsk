'use client';

import { usePathname } from '@contexts';

export const useRouteUtils = () => {
  const pathname = usePathname();

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
