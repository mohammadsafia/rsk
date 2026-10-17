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
  submenu?: AppMenu[];
};

export const FULL_ROUTES_PATH = {
  HOME: {
    INDEX: '/',
    DASHBOARD: '/dashboard',
  },
  AUTH: {
    INDEX: '/auth',
    LOGIN: '/auth/login',
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
export const APP_MENU: AppMenu[] = [
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
