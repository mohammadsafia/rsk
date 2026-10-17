import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@constants';

/** Number formatting with Western digits in every language (`-u-nu-latn`), like formatMoney. */
export const formatNumber = (value: number, language: string, options: Intl.NumberFormatOptions = {}): string => {
  const base = language === LANGUAGES.AR ? 'ar' : 'en';
  return new Intl.NumberFormat(`${base}-u-nu-latn`, options).format(value);
};

export const useNumberFormat = () => {
  const { i18n } = useTranslation();
  return (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, i18n.language, options);
};
