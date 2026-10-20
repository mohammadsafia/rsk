import type { ElementType } from 'react';

import { CalendarDays, Component, Contact, LayoutDashboard, Receipt, Settings, Users } from 'lucide-react';

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
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  COMPONENTS: {
    INDEX: '/components',
    DETAIL: '/components/:id',
  },
  DOCS: {
    INDEX: '/docs',
    DOC: '/docs/:docId',
    COMPONENTS: '/docs/components',
    COMPONENT: '/docs/components/:id',
  },
  SETTINGS: {
    INDEX: '/settings',
  },
  MEMBERS: {
    INDEX: '/members',
  },
  PATIENTS: {
    INDEX: '/patients',
    NEW: '/patients/new',
    DETAIL: '/patients/:id',
  },
  BILLING: {
    INDEX: '/billing',
  },
  SCHEDULE: {
    INDEX: '/schedule',
  },
  ROOT: {
    INDEX: '..',
  },
} as const;

/** Path of a patient's profile. */
export const patientPath = (id: string) => FULL_ROUTES_PATH.PATIENTS.DETAIL.replace(':id', encodeURIComponent(id));

/** Flattened route map used by breadcrumb/navigation helpers. */
export const PLAIN_ROUTES = FULL_ROUTES_PATH;

export const APP_MENU: AppMenu[] = [
  {
    id: 'dashboard',
    path: FULL_ROUTES_PATH.HOME.DASHBOARD,
    name: 'Dashboard',
    group: 'main',
    icon: LayoutDashboard,
  },
  {
    id: 'schedule',
    path: FULL_ROUTES_PATH.SCHEDULE.INDEX,
    name: 'Schedule',
    group: 'main',
    icon: CalendarDays,
  },
  {
    id: 'patients',
    path: FULL_ROUTES_PATH.PATIENTS.INDEX,
    name: 'Patients',
    group: 'main',
    icon: Contact,
  },
  {
    id: 'billing',
    path: FULL_ROUTES_PATH.BILLING.INDEX,
    name: 'Billing',
    group: 'main',
    icon: Receipt,
  },
  // The docs site: development and the docs build only (see docs-routes.tsx).
  ...(import.meta.env.DEV || import.meta.env.MODE === 'docs'
    ? [
        {
          id: 'components',
          path: FULL_ROUTES_PATH.DOCS.COMPONENTS,
          name: 'Components',
          group: 'main',
          icon: Component,
        },
      ]
    : []),
  {
    id: 'members',
    path: FULL_ROUTES_PATH.MEMBERS.INDEX,
    name: 'Members',
    group: 'main',
    icon: Users,
  },
  {
    id: 'settings',
    path: FULL_ROUTES_PATH.SETTINGS.INDEX,
    name: 'Settings',
    group: 'account',
    icon: Settings,
  },
];
