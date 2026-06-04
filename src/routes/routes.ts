import type { ElementType } from 'react';

import { LayoutDashboard, Component, Settings } from 'lucide-react';

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
  COMPONENTS: {
    INDEX: '/components',
    DETAIL: '/components/:id',
  },
  SETTINGS: {
    INDEX: '/settings',
  },
  ROOT: {
    INDEX: '..',
  },
} as const;

export const APP_MENU: AppMenu[] = [
  {
    id: 'dashboard',
    path: FULL_ROUTES_PATH.HOME.DASHBOARD,
    name: 'Dashboard',
    group: 'Main',
    icon: LayoutDashboard,
  },
  {
    id: 'components',
    path: FULL_ROUTES_PATH.COMPONENTS.INDEX,
    name: 'Components',
    group: 'Main',
    icon: Component,
  },
  {
    id: 'settings',
    path: FULL_ROUTES_PATH.SETTINGS.INDEX,
    name: 'Settings',
    group: 'Account',
    icon: Settings,
  },
];
