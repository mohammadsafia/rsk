import { describe, expect, it } from 'vite-plus/test';

import { errorMessage, safeNext } from './auth';

describe('safeNext', () => {
  it('keeps a path inside the app, with its query', () => {
    expect(safeNext('/patients?page=2')).toBe('/patients?page=2');
  });

  it('refuses a next whose dot segments climb out of the path into another host', () => {
    // Each starts with "/" and stays same-origin while parsing, but normalises to "//evil.example", which a router
    // then reads as another site.
    for (const value of ['/en/..//evil.example', '/en/%2e%2e//evil.example', '/a/.%2e//evil.example/x', '/..//evil.example'])
      expect(safeNext(value, '/dashboard')).toBe('/dashboard');
    expect(safeNext('/en/settings?tab=a#x', '/dashboard')).toBe('/en/settings?tab=a#x');
    expect(safeNext('/en/../settings', '/dashboard')).toBe('/settings');
  });

  it('refuses anything that could leave the app, falling back', () => {
    for (const value of ['//evil.example', 'https://evil.example', '/\\evil.example', 'javascript:alert(1)', '', null, undefined])
      expect(safeNext(value, '/dashboard')).toBe('/dashboard');
  });
});

describe('errorMessage', () => {
  it('reads a message from an API error body, an Error, or a string; else the fallback', () => {
    expect(errorMessage({ message: 'Wrong password' }, 'x')).toBe('Wrong password');
    expect(errorMessage(new Error('Network Error'), 'x')).toBe('Network Error');
    expect(errorMessage('Timed out', 'x')).toBe('Timed out');
    expect(errorMessage({ code: 500 }, 'Something went wrong')).toBe('Something went wrong');
    expect(errorMessage(null, 'Something went wrong')).toBe('Something went wrong');
  });

  describe('safeNext with characters a URL parser drops', () => {
    it('refuses a next that only becomes external once tabs or newlines are stripped', () => {
      for (const value of ['/\t/evil.example', '/\n/evil.example', '/\r/evil.example', '\t//evil.example'])
        expect(safeNext(value, '/dashboard')).toBe('/dashboard');
      expect(safeNext('/patients#notes', '/dashboard')).toBe('/patients#notes');
    });
  });
});
