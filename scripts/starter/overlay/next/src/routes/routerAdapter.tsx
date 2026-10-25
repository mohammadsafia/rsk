'use client';

import { createContext, type FC, type ReactElement, type ReactNode, useContext } from 'react';
import NextLink from 'next/link';
import { useParams, usePathname as useNextPathname, useRouter, useSelectedLayoutSegments } from 'next/navigation';

import { type KitLanguage, type KitLinkProps, type KitRouter, KitRouterProvider } from '@contexts';

import { DEFAULT_LANG, isLang } from '@env';

import { LANG_COOKIE, patternOf, stripLang, swapLang, withLang } from './paths';

const PatternContext = createContext('');

/** The page's language, from its [lang] segment. */
const useLang = (): KitLanguage => {
  const { lang } = useParams<{ lang?: string }>() ?? {};
  return isLang(lang) ? lang : DEFAULT_LANG;
};

const AdapterLink: FC<KitLinkProps> = ({ href, ...props }) => {
  const lang = useLang();
  return <NextLink href={withLang(lang, href)} {...props} />;
};

/** The kit's router in a Next app: next/navigation underneath, the language kept in the URL. */
export const nextKitAdapter: KitRouter = {
  Link: AdapterLink,
  useNavigate: () => {
    const router = useRouter();
    const lang = useLang();
    return (to, options) => {
      if (to === -1) router.back();
      else if (options?.replace) router.replace(withLang(lang, to));
      else router.push(withLang(lang, to));
    };
  },
  usePathname: () => stripLang(useNextPathname()),
  useRoutePattern: () => useContext(PatternContext),
  // A full load of the same page in the other language: the server sends its html lang/dir, the theme script runs
  // before paint, and every per-request instance starts fresh in that language.
  useSetLanguage: () => (language) => {
    document.cookie = `${LANG_COOKIE}=${language}; path=/; max-age=31536000; samesite=lax`;
    window.location.assign(swapLang(window.location.pathname, window.location.search, language));
  },
  basePath: '',
};

/**
 * Supplies the kit's router. Rendered once in the [lang] layout, where the matched segments below it are known: the
 * route pattern is worked out here, not in each kit component (there, the segments would be only those below it).
 */
export function NextKitRouterProvider({ children }: { children: ReactNode }): ReactElement {
  const segments = useSelectedLayoutSegments();
  const params = useParams() ?? {};
  return (
    <PatternContext value={patternOf(segments, params)}>
      <KitRouterProvider router={nextKitAdapter}>{children}</KitRouterProvider>
    </PatternContext>
  );
}
