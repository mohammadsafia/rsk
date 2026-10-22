'use client';

import { type AnchorHTMLAttributes, createElement, type ReactElement, useSyncExternalStore } from 'react';
import i18n from 'i18next';

import type { KitLanguage, KitLinkProps, KitNavigate, KitRouter } from './KitRouterContext';

/** The Navigation API, where the browser has it (Chromium, Safari): it also hears pushState, which popstate doesn't. */
const navigationApi = (): EventTarget | undefined => (window as Window & { navigation?: EventTarget }).navigation;

/** Back/forward, and the app's own router moving (its pushState) where the Navigation API reports it. */
const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener('popstate', onChange);
  navigationApi()?.addEventListener('currententrychange', onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    navigationApi()?.removeEventListener('currententrychange', onChange);
  };
};

const readPathname = (): string => window.location.pathname;

const FallbackLink = ({ href, replace: _replace, ...props }: KitLinkProps): ReactElement =>
  createElement('a', { ...(props as AnchorHTMLAttributes<HTMLAnchorElement>), href });

const navigateByPageLoad: KitNavigate = (to, options) => {
  if (to === -1) window.history.back();
  else if (options?.replace) window.location.replace(to);
  else window.location.assign(to);
};

/**
 * The router when an app has no KitRouterProvider yet (one updated by kit:update before it wires one): plain links and
 * full page navigation, so nothing breaks and only client-side routing is lost. kit:update reports the missing wiring.
 */
export const fallbackKitRouter: KitRouter = {
  Link: FallbackLink,
  useNavigate: () => navigateByPageLoad,
  usePathname: () => useSyncExternalStore(subscribe, readPathname, () => '/'),
  useRoutePattern: () => '',
  useSetLanguage: () => (language: KitLanguage) => void i18n.changeLanguage(language),
  basePath: '/',
};
