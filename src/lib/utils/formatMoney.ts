import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@constants';

import { APP_CONFIGURATIONS } from '../../app-config/appConfig';

export type FormatMoneyOptions = {
  currency?: string;
  /** "12.4K" style. */
  compact?: boolean;
  /** "parentheses" uses accounting style: ($80.00). */
  negative?: 'sign' | 'parentheses';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/** Currency formatting with Western digits in every language (`-u-nu-latn`). */
export const formatMoney = (value: number, language: string, options: FormatMoneyOptions = {}): string => {
  const { currency = APP_CONFIGURATIONS.CURRENCY, compact = false, negative = 'sign', ...digits } = options;
  const base = language === LANGUAGES.AR ? 'ar' : 'en';

  return new Intl.NumberFormat(`${base}-u-nu-latn`, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    currencySign: negative === 'parentheses' ? 'accounting' : 'standard',
    ...(compact ? { maximumFractionDigits: 1 } : {}),
    // Explicit `undefined` (e.g. from <Money> passing every prop through) must not override the compact default.
    ...Object.fromEntries(Object.entries(digits).filter(([, digit]) => digit !== undefined)),
  }).format(value);
};

export const useMoneyFormat = () => {
  const { i18n } = useTranslation();
  return (value: number, options?: FormatMoneyOptions) => formatMoney(value, i18n.language, options);
};
