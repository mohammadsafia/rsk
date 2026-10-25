// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { KitLink, usePathname, useRoutePattern, useSetLanguage } from '@contexts';

import { NextKitRouterProvider } from './routerAdapter';

const push = vi.fn();
const nav = vi.hoisted(() => ({
  pathname: '/en/settings',
  segments: ['(app)', 'settings'],
  params: { lang: 'en' } as Record<string, string>,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useParams: () => nav.params,
  useSelectedLayoutSegments: () => nav.segments,
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const assign = vi.fn();

beforeEach(() => {
  vi.stubGlobal('location', { pathname: '/en/settings', search: '?tab=a', assign });
  document.cookie = 'rsk-lang=; max-age=0; path=/';
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function Probe() {
  const setLanguage = useSetLanguage();
  return (
    <>
      <KitLink href="/settings">Settings</KitLink>
      <p data-testid="path">{usePathname()}</p>
      <p data-testid="pattern">{useRoutePattern()}</p>
      <button type="button" onClick={() => setLanguage('ar')}>
        AR
      </button>
    </>
  );
}

describe('the Next router adapter', () => {
  it('gives the kit language-free paths and puts the language back on links', () => {
    render(
      <NextKitRouterProvider>
        <Probe />
      </NextKitRouterProvider>,
    );
    expect(screen.getByTestId('path').textContent).toBe('/settings');
    expect(screen.getByTestId('pattern').textContent).toBe('/settings');
    expect(screen.getByRole('link', { name: 'Settings' }).getAttribute('href')).toBe('/en/settings');
  });

  it('switches language with a full load of the same page, remembering the choice', () => {
    render(
      <NextKitRouterProvider>
        <Probe />
      </NextKitRouterProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'AR' }));
    expect(document.cookie).toContain('rsk-lang=ar');
    expect(assign).toHaveBeenCalledWith('/ar/settings?tab=a');
    expect(push).not.toHaveBeenCalled();
  });
});
