import i18n from 'i18next';
import type { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { DEFAULT_LANGUAGE, LANGUAGES } from '@constants';
import { LOCALES } from '@locales';

const setDocumentDirection = (language: string) => {
  document.documentElement.lang = language;
  document.documentElement.dir = language === LANGUAGES.AR ? 'rtl' : 'ltr';
};

const options: InitOptions = {
  fallbackLng: DEFAULT_LANGUAGE,
  debug: false,
  interpolation: { escapeValue: false },
  resources: {
    [LANGUAGES.EN]: LOCALES.EN,
    [LANGUAGES.AR]: LOCALES.AR,
  },
  defaultNS: 'common',
  ns: Object.keys(LOCALES.EN),
  supportedLngs: [LANGUAGES.EN, LANGUAGES.AR],
  nonExplicitSupportedLngs: true,
  detection: {
    order: ['localStorage'],
    caches: ['localStorage'],
    lookupLocalStorage: 'i18nextLng',
  },
};

i18n.use(LanguageDetector).use(initReactI18next).init(options);

setDocumentDirection(i18n.language ?? DEFAULT_LANGUAGE);
i18n.on('languageChanged', setDocumentDirection);

export default i18n;
