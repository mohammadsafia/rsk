// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { LOCALES } from '@locales';

import { getT } from './i18n';

describe('getT', () => {
  it('translates on the server in the requested language, with independent instances', async () => {
    const ar = await getT('ar', 'auth');
    const en = await getT('en', 'auth');
    const login = (LOCALES.AR.auth as { login: { title: string } }).login.title;
    expect(ar('login.title')).toBe(login);
    expect(en('login.title')).toBe((LOCALES.EN.auth as { login: { title: string } }).login.title);
    expect(ar('login.title')).toBe(login);
  });
});
