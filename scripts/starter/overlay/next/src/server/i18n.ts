// Translations on the server (metadata, titles, server pages): a fresh i18next instance per call, never shared
// between requests, over the same locale files the browser uses.
import 'server-only';

import { createInstance, type TFunction } from 'i18next';

import type { KitLanguage } from '@contexts';

import { DEFAULT_LANGUAGE } from '@constants';
import { LOCALES } from '@locales';

export async function getT(lang: KitLanguage, ns: string | string[]): Promise<TFunction> {
  const instance = createInstance();
  const namespaces = Array.isArray(ns) ? ns : [ns];
  await instance.init({
    lng: lang,
    fallbackLng: DEFAULT_LANGUAGE,
    resources: { en: LOCALES.EN, ar: LOCALES.AR },
    ns: namespaces,
    defaultNS: namespaces[0],
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return instance.getFixedT(lang, namespaces[0]);
}
