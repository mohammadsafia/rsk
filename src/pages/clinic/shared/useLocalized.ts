import { useTranslation } from 'react-i18next';

import type { Localized } from '@api/clinic';

import { LANGUAGES } from '@constants';

/** Picks the Arabic or English form of a seeded name for the active language. */
export const useLocalized = () => {
  const { i18n } = useTranslation();
  const key = i18n.language === LANGUAGES.AR ? 'ar' : 'en';
  return (value: Localized | null | undefined) => value?.[key] ?? '';
};
