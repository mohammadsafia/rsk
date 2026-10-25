// @vitest-environment happy-dom
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { LOCALES } from '@locales';

import { useBlockTranslation } from './useBlockTranslation';

import i18n from '../../../i18n';

const RESOURCES = { en: { hello: 'Hello' }, ar: { hello: 'مرحبا' } };

function Greeting() {
  const { t } = useBlockTranslation('block-greeting', RESOURCES);

  return <p>{t('hello')}</p>;
}

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('useBlockTranslation', () => {
  it('serves a block’s own copy, in the current language', async () => {
    render(<Greeting />);
    expect(screen.getByText('Hello')).toBeTruthy();
    await act(() => i18n.changeLanguage('ar'));
    expect(screen.getByText('مرحبا')).toBeTruthy();
  });

  it('adds the full copy even when the menu already registered the block’s nav labels', () => {
    i18n.addResourceBundle('en', 'block-menu', { nav: { home: 'Home' } }, true);
    function Page() {
      const { t } = useBlockTranslation('block-menu', {
        en: { nav: { home: 'Home' }, title: 'Welcome' },
        ar: { nav: { home: 'الرئيسية' }, title: 'أهلًا' },
      });
      return <p>{t('title')}</p>;
    }
    render(<Page />);
    expect(screen.getByText('Welcome')).toBeTruthy();
  });

  it('registers the copy with each i18n instance it renders under (a server makes one per request)', () => {
    const instance = () => {
      const created = createInstance();
      void created.use(initReactI18next).init({ lng: 'ar', resources: { ar: {} }, initAsync: false });
      return created;
    };
    for (const i18nInstance of [instance(), instance()]) {
      render(
        <I18nextProvider i18n={i18nInstance}>
          <Greeting />
        </I18nextProvider>,
      );
      expect(screen.getByText('مرحبا')).toBeTruthy();
      cleanup();
    }
  });

  it('keeps blocks’ copy out of the app’s eagerly loaded locales: it travels with the block', () => {
    // The namespaces of the block locale files on disk (i18next shares LOCALES, so a registered bundle shows up there).
    const blockFiles = Object.keys(import.meta.glob('../../../locales/en/block-*.json')).map((file) =>
      file.replace(/^.*\/(block-[\w-]+)\.json$/, '$1'),
    );
    for (const namespace of blockFiles) {
      expect(LOCALES.EN).not.toHaveProperty([namespace]);
      expect(LOCALES.AR).not.toHaveProperty([namespace]);
    }
  });
});
