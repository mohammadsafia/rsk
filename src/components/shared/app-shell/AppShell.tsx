'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

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

type AppShellComponent = FC<AppShellProps> & {
  Header: FC<ComponentPropsWithoutRef<'header'>>;
  Content: FC<ComponentPropsWithoutRef<'main'>>;
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

const Content: FC<ComponentPropsWithoutRef<'main'>> = ({ className, children, ...props }) => {
  const { setScrolled, contentId } = useAppShell();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { root: sentinel.parentElement });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [setScrolled]);

  return (
    <main
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
