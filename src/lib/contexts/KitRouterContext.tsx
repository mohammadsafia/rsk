'use client';

import {
  type AnchorHTMLAttributes,
  type ComponentType,
  createContext,
  type FC,
  type ReactElement,
  type ReactNode,
  useContext,
} from 'react';

import { fallbackKitRouter } from './kitRouterFallback';

export type KitLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; replace?: boolean };
export type KitNavigate = (to: string | -1, options?: { replace?: boolean }) => void;
export type KitLanguage = 'en' | 'ar';

/** What the kit needs from a router. Each starter's app-owned src/routes/routerAdapter.tsx fills it in. */
export type KitRouter = {
  Link: ComponentType<KitLinkProps>;
  useNavigate(): KitNavigate;
  /** The path without a language prefix: kit code never sees /en or /ar. */
  usePathname(): string;
  /** The matched route pattern ('/patients/:id'), '' when the router can't tell. */
  useRoutePattern(): string;
  /** Vite: i18n.changeLanguage. Next: swaps the [lang] segment and remembers the choice. */
  useSetLanguage(): (language: KitLanguage) => void;
  /** For storage keys only: links never add it (the framework already does). */
  basePath: string;
};

const KitRouterContext = createContext<KitRouter>(fallbackKitRouter);

export function KitRouterProvider({ router, children }: { router: KitRouter; children: ReactNode }): ReactElement {
  return <KitRouterContext value={router}>{children}</KitRouterContext>;
}

const useKitRouter = (): KitRouter => useContext(KitRouterContext);

export const KitLink: FC<KitLinkProps> = (props) => {
  const { Link } = useKitRouter();
  return <Link {...props} />;
};

export const useKitNavigate = (): KitNavigate => useKitRouter().useNavigate();
export const usePathname = (): string => useKitRouter().usePathname();
export const useRoutePattern = (): string => useKitRouter().useRoutePattern();
export const useSetLanguage = (): ((language: KitLanguage) => void) => useKitRouter().useSetLanguage();
export const useBasePath = (): string => useKitRouter().basePath;
