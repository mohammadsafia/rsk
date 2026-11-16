'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { usePathname } from '@contexts';
import { useAppTranslation, useIsHydrated } from '@hooks/shared';

import { cn } from '@utils';

import { Menu } from 'lucide-react';

import { AppShellContext, type AppShellState, useAppShell } from './AppShellContext';

const DEFAULT_STORAGE_KEY = 'rsk:sidebar-collapsed';

/** The stored choice, or null when there is none (no key, nothing stored, storage blocked). */
const readStored = (key: string | null): boolean | null => {
  if (!key) return null;
  try {
    const value = localStorage.getItem(key);
    return value === null ? null : value === 'true';
  } catch {
    return null;
  }
};

const writeStored = (key: string | null, value: boolean) => {
  if (!key) return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage blocked (private mode, quota): the preference just isn't remembered.
  }
};

export type AppShellProps = {
  sidebar: ReactNode;
  /** localStorage key for the collapsed preference; `null` disables persistence. */
  storageKey?: string | null;
  /** The collapsed state a server renders before storage can be read (a Next app reads it from a cookie). */
  initialCollapsed?: boolean;
  /** Called when the person collapses or expands the sidebar, e.g. to keep the choice in a cookie a server reads. */
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
  children: ReactNode;
};

export type AppShellContentProps = ComponentPropsWithoutRef<'main'> & {
  /**
   * After a route change, move the focus to the new page's first heading (h1), or to the main region when the page
   * has none, so keyboard and screen reader users start on the page they asked for. Default true.
   */
  focusOnNavigate?: boolean;
};

type AppShellComponent = FC<AppShellProps> & {
  Header: FC<ComponentPropsWithoutRef<'header'>>;
  Content: FC<AppShellContentProps>;
  MenuButton: FC<{ className?: string }>;
};

const Header: FC<ComponentPropsWithoutRef<'header'>> = ({ className, ...props }) => {
  const { scrolled } = useAppShell();

  return (
    <header
      data-slot="app-shell-header"
      data-scrolled={scrolled}
      className={cn(
        'bg-canvas border-border relative z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 transition-shadow md:px-6',
        'data-[scrolled=true]:shadow-raised',
        className,
      )}
      {...props}
    />
  );
};

/** The page's first h1, skipping the previous page's, which Suspense keeps hidden (display: none) while the next loads. */
const visibleHeading = (main: HTMLElement): HTMLElement | null => {
  for (const heading of main.querySelectorAll<HTMLElement>('h1')) {
    let hidden = false;
    for (let node: HTMLElement | null = heading; node && node !== main; node = node.parentElement)
      if (node.style.display === 'none' || node.hidden) hidden = true;
    if (!hidden) return heading;
  }
  return null;
};

/** How long a lazily loaded page's heading is waited for. */
const HEADING_WAIT_MS = 3000;
/** How soon the main region takes the focus while the page has no heading yet. */
const INTERIM_FOCUS_MS = 100;

/**
 * Moves the focus into `main` when the path changes (never on the first load): to the page's first h1, else to `main`
 * itself. A lazily loaded page renders its heading later: `main` holds the focus meanwhile and hands it to the heading
 * when it appears. Focus the person or the page moved anywhere else (an autofocused field) is left alone.
 */
function useFocusOnNavigate(mainRef: { current: HTMLElement | null }, enabled: boolean) {
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  useEffect(() => {
    const main = mainRef.current;
    if (!enabled || !main || pathname === firstPath.current) return;
    firstPath.current = '';
    const startedOn = document.activeElement;
    // Still ours to move: where it was before the navigation, nowhere, or on the region we focused.
    const ours = () => [startedOn, document.body, main, null].includes(document.activeElement);

    const focusHeading = (): boolean => {
      if (!ours()) return true;
      const heading = visibleHeading(main);
      if (!heading) return false;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus();
      return true;
    };
    if (focusHeading()) return;

    const observer = new MutationObserver(() => {
      if (focusHeading()) stop();
    });
    const interim = setTimeout(() => {
      if (ours()) main.focus({ preventScroll: true });
    }, INTERIM_FOCUS_MS);
    const timer = setTimeout(() => stop(), HEADING_WAIT_MS);
    const stop = () => {
      observer.disconnect();
      clearTimeout(interim);
      clearTimeout(timer);
    };
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden'] });
    return stop;
  }, [pathname, enabled, mainRef]);
}

const Content: FC<AppShellContentProps> = ({ className, children, focusOnNavigate = true, ...props }) => {
  const { setScrolled, contentId } = useAppShell();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  useFocusOnNavigate(mainRef, focusOnNavigate);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { root: sentinel.parentElement });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [setScrolled]);

  return (
    <main
      ref={mainRef}
      id={contentId}
      tabIndex={-1}
      data-slot="app-shell-content"
      className={cn('relative min-h-0 flex-1 overflow-y-auto p-4 focus:outline-none md:p-6', className)}
      {...props}
    >
      <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" />

      {children}
    </main>
  );
};

const MenuButton: FC<{ className?: string }> = ({ className }) => {
  const { t } = useAppTranslation('nav');
  const { mobileOpen, openMobile, closeMobile, menuButtonRef, sidebarId } = useAppShell();

  return (
    <IconButton
      ref={menuButtonRef}
      tooltip={false}
      aria-label={t(mobileOpen ? 'closeMenu' : 'openMenu')}
      aria-expanded={mobileOpen}
      aria-controls={sidebarId}
      className={cn('md:hidden', className)}
      onClick={() => (mobileOpen ? closeMobile(true) : openMobile())}
    >
      <Menu aria-hidden="true" />
    </IconButton>
  );
};

const AppShell: AppShellComponent = ({
  sidebar,
  storageKey = DEFAULT_STORAGE_KEY,
  initialCollapsed = false,
  onCollapsedChange,
  className,
  children,
}) => {
  const { t } = useAppTranslation('nav');
  const hydrated = useIsHydrated();
  const shellId = useId().replaceAll(':', '');
  const sidebarId = `app-sidebar-${shellId}`;
  const contentId = `main-content-${shellId}`;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Until the person toggles it: the stored choice once storage is readable (from the first render under createRoot),
  // else the initial state (with no storage, the server's state holds through hydration).
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const collapsed = chosen ?? (hydrated ? (readStored(storageKey) ?? initialCollapsed) : initialCollapsed);

  const setCollapsed = useCallback(
    (value: boolean) => {
      setChosen(value);
      writeStored(storageKey, value);
      onCollapsedChange?.(value);
    },
    [storageKey, onCollapsedChange],
  );

  const closeMobile = useCallback((restoreFocus = false) => {
    setMobileOpen(false);
    // Lift `inert` now so the menu button (inside the main region) can take focus before React re-renders.
    mainRef.current?.removeAttribute('inert');
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  // Widening to desktop while the drawer is open closes it, so no modal state lingers off-screen.
  useEffect(() => {
    const query = typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 768px)') : null;
    if (!query) return;

    const onChange = (event: { matches: boolean }) => {
      if (event.matches) closeMobile(false);
    };
    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
  }, [closeMobile]);

  // The open drawer is modal: the page behind it leaves the tab order and the accessibility tree.
  useEffect(() => {
    mainRef.current?.toggleAttribute('inert', mobileOpen);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    asideRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobile(true);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, closeMobile]);

  const value = useMemo<AppShellState>(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed: () => setCollapsed(!collapsed),
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile,
      menuButtonRef,
      sidebarId,
      contentId,
      scrolled,
      setScrolled,
    }),
    [collapsed, setCollapsed, mobileOpen, closeMobile, sidebarId, contentId, scrolled],
  );

  return (
    <AppShellContext.Provider value={value}>
      <div data-slot="app-shell" className={cn('bg-canvas text-fg flex h-dvh overflow-hidden', className)}>
        <a
          href={`#${contentId}`}
          className="bg-surface-raised text-fg shadow-overlay focus-ring sr-only z-[60] rounded-md px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:start-2 focus:top-2"
        >
          {t('skipToContent')}
        </a>

        <Conditional.If condition={mobileOpen}>
          <div
            data-slot="app-shell-scrim"
            aria-hidden="true"
            className="bg-overlay fixed inset-0 z-40 md:hidden"
            onClick={() => closeMobile(true)}
          />
        </Conditional.If>

        <aside
          ref={asideRef}
          id={sidebarId}
          aria-label={t('navigation')}
          tabIndex={-1}
          data-slot="app-shell-sidebar"
          data-collapsed={collapsed}
          data-open={mobileOpen}
          className={cn(
            'bg-sidebar border-sidebar-border fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e focus:outline-none',
            'transition-[translate,visibility] duration-base ease-out motion-reduce:transition-none',
            'md:static md:transition-[width] md:motion-reduce:transition-none',
            collapsed ? 'md:w-16' : 'md:w-64',
            !mobileOpen && 'max-md:invisible max-md:-translate-x-full max-md:rtl:translate-x-full',
          )}
        >
          {sidebar}
        </aside>

        <div ref={mainRef} data-slot="app-shell-main" className="flex min-w-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </AppShellContext.Provider>
  );
};

AppShell.Header = Header;
AppShell.Content = Content;
AppShell.MenuButton = MenuButton;
AppShell.displayName = 'AppShell';

export default AppShell;
