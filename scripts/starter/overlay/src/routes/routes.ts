import type { ElementType } from 'react';

import { LayoutDashboard, Settings } from 'lucide-react';

import { blockNav } from '../blocks';

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
  AUTH: {
    INDEX: '/auth',
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
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

/** The app's own entries, then those of the blocks added with kit:add. */
export const APP_MENU: AppMenu[] = [...BASE_MENU, ...blockNav];
