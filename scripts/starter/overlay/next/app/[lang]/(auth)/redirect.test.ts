import { describe, expect, it } from 'vite-plus/test';

import { stripLang } from '@routes/paths';

import { acceptNext } from './redirect';

describe('where sign-in sends someone', () => {
  it('to ?next= when it is a page of this app in this language, else to the dashboard', () => {
    expect(acceptNext('/en/settings?tab=a', 'en')).toBe('/en/settings?tab=a');
    expect(acceptNext('/en/..//evil.com', 'en')).toBe('/en/dashboard');
    expect(acceptNext('//evil.com', 'en')).toBe('/en/dashboard');
    expect(acceptNext('/ar/x', 'en')).toBe('/en/dashboard');
    expect(acceptNext(null, 'ar')).toBe('/ar/dashboard');
  });

  it('gives the kit a language-free path (the router puts the language back)', () => {
    expect(stripLang(acceptNext('/en/settings?tab=a', 'en'))).toBe('/settings?tab=a');
  });
});
