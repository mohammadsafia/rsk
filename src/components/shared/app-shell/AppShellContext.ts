'use client';

import { createContext, type RefObject, useContext } from 'react';

export type AppShellState = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  /** `restoreFocus` sends focus back to the menu button (Escape, scrim). */
  closeMobile: (restoreFocus?: boolean) => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  sidebarId: string;
  contentId: string;
  scrolled: boolean;
  setScrolled: (scrolled: boolean) => void;
};

const noop = () => {};

export const AppShellContext = createContext<AppShellState>({
  collapsed: false,
  setCollapsed: noop,
  toggleCollapsed: noop,
  mobileOpen: false,
  openMobile: noop,
  closeMobile: noop,
  menuButtonRef: { current: null },
  sidebarId: 'app-sidebar',
  contentId: 'main-content',
  scrolled: false,
  setScrolled: noop,
});

export const useAppShell = () => useContext(AppShellContext);
