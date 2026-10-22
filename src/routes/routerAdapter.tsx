import { type FC, type ReactNode, useContext } from 'react';
import { Link, UNSAFE_RouteContext as RouteContext, useLocation, useNavigate } from 'react-router';
import i18n from 'i18next';

import { type KitLinkProps, type KitRouter, KitRouterProvider } from '@contexts';

const AdapterLink: FC<KitLinkProps> = ({ href, ...props }) => <Link to={href} {...props} />;

/** The kit's router in a Vite app: React Router underneath. */
export const reactRouterKitAdapter: KitRouter = {
  Link: AdapterLink,
  useNavigate: () => {
    const navigate = useNavigate();
    return (to, options) => void (to === -1 ? navigate(-1) : navigate(to, options));
  },
  usePathname: () => useLocation().pathname,
  // The chain of matched route paths up to the calling component, joined: '/patients/:id'.
  useRoutePattern: () =>
    useContext(RouteContext)
      .matches.map((match) => match.route.path)
      .filter(Boolean)
      .join('/')
      .replace(/\/{2,}/g, '/'),
  useSetLanguage: () => (language) => void i18n.changeLanguage(language),
  basePath: import.meta.env.BASE_URL,
};

/** Wraps the app's RouterProvider: kit components call these hooks from inside the routes it renders. */
export const ReactRouterKitProvider: FC<{ children: ReactNode }> = ({ children }) => (
  <KitRouterProvider router={reactRouterKitAdapter}>{children}</KitRouterProvider>
);
