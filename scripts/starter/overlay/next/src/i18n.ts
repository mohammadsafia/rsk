// The kit's tests import this i18n instance (it is the one react-i18next falls back to without a provider). The app
// itself never does: each request gets its own instance in app/[lang]/providers.tsx.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, LANGUAGES } from '@constants';
import { LOCALES } from '@locales';

void i18n.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  resources: { [LANGUAGES.EN]: LOCALES.EN, [LANGUAGES.AR]: LOCALES.AR },
  defaultNS: 'common',
  ns: Object.keys(LOCALES.EN),
  supportedLngs: [LANGUAGES.EN, LANGUAGES.AR],
  interpolation: { escapeValue: false },
  initAsync: false,
});

// In a test's DOM the page follows the language, as the browser's does.
if (typeof document !== 'undefined') {
  i18n.on('languageChanged', (language) => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === LANGUAGES.AR ? 'rtl' : 'ltr';
  });
}

export default i18n;
