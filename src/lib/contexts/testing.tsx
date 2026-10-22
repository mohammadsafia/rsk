'use client';

import { type ReactElement, type ReactNode, useState, useSyncExternalStore } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import i18n from 'i18next';

import { type KitLinkProps, type KitRouter, KitRouterProvider } from './KitRouterContext';

type MemoryOptions = { initialPath?: string; pattern?: string };
type MemoryKitRouter = KitRouter & { history: string[] };

/** An in-memory KitRouter for kit tests (no React Router, no Next): `history` lists every path visited. */
export function createMemoryKitRouter({ initialPath = '/', pattern = '' }: MemoryOptions = {}): MemoryKitRouter {
  const history = [initialPath];
  const listeners = new Set<() => void>();
  const current = (): string => history[history.length - 1];
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const go = (to: string, replace = false): void => {
    if (replace) history[history.length - 1] = to;
    else history.push(to);
    listeners.forEach((listener) => listener());
  };

  const MemoryLink = ({ href, replace, onClick, ...props }: KitLinkProps): ReactElement => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        go(href, replace);
      }}
    />
  );

  return {
    history,
    Link: MemoryLink,
    useNavigate: () => (to, options) => {
      if (to !== -1) go(to, options?.replace);
      else if (history.length > 1) go(history[history.length - 2]);
    },
    usePathname: () => useSyncExternalStore(subscribe, current, current),
    useRoutePattern: () => pattern,
    useSetLanguage: () => (language) => void i18n.changeLanguage(language),
    basePath: '/',
  };
}

/** A drop-in for React Router's MemoryRouter in kit tests: one memory KitRouter for the life of the tree. */
export function MemoryKitRouter({ children, ...options }: MemoryOptions & { children: ReactNode }): ReactElement {
  const [router] = useState(() => createMemoryKitRouter(options));
  return <KitRouterProvider router={router}>{children}</KitRouterProvider>;
}

/** Renders `ui` under a memory KitRouter; the result carries the router's `history`. */
export function renderWithKitRouter(ui: ReactElement, options?: MemoryOptions): RenderResult & { history: string[] } {
  const router = createMemoryKitRouter(options);
  return Object.assign(render(<KitRouterProvider router={router}>{ui}</KitRouterProvider>), { history: router.history });
}
