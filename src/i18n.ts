import i18n from 'i18next';
import type { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, LANGUAGES } from '@constants';
import { LOCALES } from '@locales';

const setDocumentDirection = (language: string) => {
  document.documentElement.lang = language;
  document.documentElement.dir = language === LANGUAGES.AR ? 'rtl' : 'ltr';
};

/** Where the person's language choice is kept between visits. */
const STORAGE_KEY = 'i18nextLng';

const storedLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined; // Storage blocked (private mode): start in the default language.
  }
};

const options: InitOptions = {
  // The language chosen last time; an unsupported or missing one falls back to fallbackLng.
  lng: storedLanguage(),
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
};

const rememberLanguage = (language: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
};

i18n.use(initReactI18next).init(options);

setDocumentDirection(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
i18n.on('languageChanged', (language) => {
  setDocumentDirection(language);
  rememberLanguage(language);
});

export default i18n;
