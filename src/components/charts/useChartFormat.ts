'use client';

import { useTranslation } from 'react-i18next';

import { formatMoney, formatNumber } from '@utils';

import type { ValueFormat } from './types';

export const useChartFormat = ({
  valueFormat = 'number',
  currency,
  xFormat,
}: {
  valueFormat?: ValueFormat;
  currency?: string;
  xFormat?: (value: unknown) => string;
}) => {
  const { i18n } = useTranslation();
  const language = i18n.language;

  const formatValue = (value: number): string => {
    if (typeof valueFormat === 'function') return valueFormat(value);
    if (valueFormat === 'money') return formatMoney(value, language, { currency });
    if (valueFormat === 'percent') return formatNumber(value, language, { style: 'percent', maximumFractionDigits: 1 });
    return formatNumber(value, language, { maximumFractionDigits: 2 });
  };

  /** Axis ticks: compact and consistent (money always as "$12K"); the tooltip and table keep full values. */
  const formatTick = (value: number): string => {
    if (valueFormat === 'money') return formatMoney(value, language, { currency, compact: true });
    return formatValue(value);
  };

  const formatX = (value: unknown): string => (xFormat ? xFormat(value) : String(value ?? ''));

  return { formatValue, formatTick, formatX };
};
