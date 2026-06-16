import { useTranslation as useI18nTranslation } from 'react-i18next';

import { LANGUAGE_OPTIONS, LANGUAGES, type LanguageOption } from '@constants';
import { LOCALES } from '@locales';

export type Namespace = string & keyof typeof LOCALES.EN;

export const useAppTranslation = <T extends Namespace = 'common'>(namespace?: T) => {
  const { t, i18n, ready } = useI18nTranslation(namespace ?? 'common');

  const currentLanguage = i18n.language as LANGUAGES;
  const isRTL = currentLanguage === LANGUAGES.AR;
  const direction: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr';

  const currentLanguageConfig: LanguageOption | undefined = LANGUAGE_OPTIONS.find((lang) => lang.code === currentLanguage);

  const changeLanguage = (lng: LANGUAGES) => {
    void i18n.changeLanguage(lng);
  };

  return {
    t,
    i18n,
    ready,
    currentLanguage,
    currentLanguageConfig,
    availableLanguages: LANGUAGE_OPTIONS,
    isRTL,
    direction,
    changeLanguage,
  };
};
