import { describe, expect, it } from 'vite-plus/test';

import { decideRoute } from './route-decision';

const at = (pathname: string, extra: Partial<Parameters<typeof decideRoute>[0]> = {}) =>
  decideRoute({ pathname, search: '', hasSession: false, ...extra });

describe('where a request goes', () => {
  it('adds the language, keeping the path and query: the chosen one, else the browser’s best, else English', () => {
    expect(at('/dashboard', { search: '?tab=x', acceptLanguage: 'en;q=0.2, ar;q=0.9' }).redirect).toBe('/ar/dashboard?tab=x');
    expect(at('/dashboard', { acceptLanguage: 'ar-JO,ar;q=0.9' }).redirect).toBe('/ar/dashboard');
    expect(at('/', { langCookie: 'en', acceptLanguage: 'ar' }).redirect).toBe('/en');
    expect(at('/', { langCookie: 'evil', acceptLanguage: 'ar' }).redirect).toBe('/ar');
    expect(at('/', { acceptLanguage: 'fr-FR, de' }).redirect).toBe('/en');
    expect(at('/fr/dashboard').redirect).toBe('/en/fr/dashboard');
  });

  it('sends a signed-out visitor from a protected page to sign in, remembering where they were going', () => {
    expect(at('/ar/dashboard', { search: '?tab=x' }).redirect).toBe('/ar/login?next=%2Far%2Fdashboard%3Ftab%3Dx');
    expect(at('/en/settings/report.pdf').redirect).toBe('/en/login?next=%2Fen%2Fsettings%2Freport.pdf');
    expect(at('/en/settingsx').redirect).toBeUndefined();
    expect(at('/en/dashboard', { hasSession: true }).redirect).toBeUndefined();
  });

  it('sends a signed-in visitor from sign-in to the app, and leaves a signed-out one there', () => {
    expect(at('/en/login', { hasSession: true }).redirect).toBe('/en/dashboard');
    expect(at('/en/login').redirect).toBeUndefined();
  });

  it('leaves the API, Next’s own files and static files alone', () => {
    for (const pathname of ['/api/auth/login', '/_next/static/x.js', '/favicon.svg', '/site.webmanifest'])
      expect(at(pathname).redirect, pathname).toBeUndefined();
  });
});
