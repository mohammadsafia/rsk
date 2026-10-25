import type { ElementType } from 'react';

import { LayoutDashboard, Settings } from 'lucide-react';

export type AppMenu = {
  id: string;
  path: string;
  name?: string;
  group?: string;
  permission?: string;
  permissions?: string[];
  roles?: string[];
  icon: ElementType;
  /** The label's translation key, when it isn't `nav:<id>` (a block's entries use `block-<id>:nav.<id>`). */
  labelKey?: string;
  submenu?: AppMenu[];
};

export const FULL_ROUTES_PATH = {
  HOME: {
    INDEX: '/',
    DASHBOARD: '/dashboard',
  },
  // Language-free: the router puts /en or /ar in front (src/routes/routerAdapter.tsx).
  AUTH: {
    INDEX: '/login',
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
  },
  SETTINGS: {
    INDEX: '/settings',
  },
  ROOT: {
    INDEX: '..',
  },
} as const;

/** Flattened route map used by breadcrumb/navigation helpers. */
export const PLAIN_ROUTES = FULL_ROUTES_PATH;

/** Sidebar and command-palette entries. The label comes from `nav.json` by `id`. */
const BASE_MENU: AppMenu[] = [
  {
    id: 'dashboard',
    path: FULL_ROUTES_PATH.HOME.DASHBOARD,
    name: 'Dashboard',
    group: 'main',
    icon: LayoutDashboard,
  },
  {
    id: 'settings',
    path: FULL_ROUTES_PATH.SETTINGS.INDEX,
    name: 'Settings',
    group: 'account',
    icon: Settings,
  },
];

/** The app's entries (a Next app's blocks arrive with the next kit version). */
export const APP_MENU: AppMenu[] = BASE_MENU;
