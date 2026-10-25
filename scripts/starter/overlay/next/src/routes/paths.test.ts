import { describe, expect, it } from 'vite-plus/test';

import { patternOf, stripLang, swapLang, withLang } from './paths';

describe('language in the path', () => {
  it('puts a language in front of an app path, once', () => {
    expect(withLang('ar', '/settings')).toBe('/ar/settings');
    expect(withLang('ar', '/')).toBe('/ar');
    expect(withLang('ar', '/en/settings')).toBe('/ar/settings');
    expect(withLang('en', '/en')).toBe('/en');
    expect(withLang('en', '/settings?tab=a#x')).toBe('/en/settings?tab=a#x');
  });

  it('leaves alone what is not an app path', () => {
    expect(withLang('ar', '#x')).toBe('#x');
    expect(withLang('ar', '?tab=a')).toBe('?tab=a');
    expect(withLang('ar', 'https://example.com/x')).toBe('https://example.com/x');
    expect(withLang('ar', '//evil.com')).toBe('//evil.com');
    expect(withLang('ar', 'mailto:a@b.c')).toBe('mailto:a@b.c');
  });

  it('takes the language off a path, and only a whole first segment', () => {
    expect(stripLang('/ar/patients/7')).toBe('/patients/7');
    expect(stripLang('/en')).toBe('/');
    expect(stripLang('/arabic')).toBe('/arabic');
    expect(stripLang('/')).toBe('/');
  });

  it('swaps the language, keeping the page and its query', () => {
    expect(swapLang('/en/settings', '?tab=a', 'ar')).toBe('/ar/settings?tab=a');
    expect(swapLang('/ar', '', 'en')).toBe('/en');
  });

  it('turns the matched segments back into a route pattern', () => {
    expect(patternOf(['(app)', 'patients', '7'], { lang: 'en', id: '7' })).toBe('/patients/:id');
    expect(patternOf(['docs', 'a/b'], { lang: 'en', slug: ['a', 'b'] })).toBe('/docs/:slug');
    expect(patternOf(['(app)', 'dashboard'], { lang: 'en' })).toBe('/dashboard');
    expect(patternOf([], { lang: 'en' })).toBe('/');
  });
});
