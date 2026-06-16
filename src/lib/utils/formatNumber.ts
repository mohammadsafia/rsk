import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@constants';

export type NumberFormatStyle = 'decimal' | 'currency' | 'percent';

export type FormatNumberOptions = {
  style?: NumberFormatStyle;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/**
 * Locale-aware number formatting that always renders Western (0-9) digits.
 *
 * The `-u-nu-latn` Unicode extension pins the numbering system to Latin regardless of
 * language, so Arabic gets localized grouping/symbols but keeps 0-9 digits (per spec).
 */
export const formatNumber = (value: number, language: string, options: FormatNumberOptions = {}): string => {
  const { style = 'decimal', currency = 'USD', ...rest } = options;
  const base = language === LANGUAGES.AR ? 'ar' : 'en';

  return new Intl.NumberFormat(`${base}-u-nu-latn`, {
    style,
    ...(style === 'currency' ? { currency } : {}),
    ...rest,
  }).format(value);
};

/** Hook variant bound to the active language. */
export const useNumberFormat = () => {
  const { i18n } = useTranslation();
  const language = i18n.language;

  return (value: number, options?: FormatNumberOptions) => formatNumber(value, language, options);
};
