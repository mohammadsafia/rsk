import type { ElementType } from 'react';

import { constructPlainRoutes } from '@utils';

export type AppMenu = {
  id: string;
  path: string;
  name?: string;
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
  ROOT: {
    INDEX: '..',
  },
} as const;

export const ROUTES_PATH = constructPlainRoutes(FULL_ROUTES_PATH);

export const APP_MENU: AppMenu[] = [];
