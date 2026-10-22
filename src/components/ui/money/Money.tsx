'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cn, type FormatMoneyOptions, useMoneyFormat } from '@utils';

export type MoneyProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> &
  FormatMoneyOptions & {
    value: number | null | undefined;
    /** "auto" colours negative amounts danger. */
    tone?: 'auto' | 'none';
  };

const Money: FC<MoneyProps> = ({
  value,
  currency,
  compact,
  negative,
  minimumFractionDigits,
  maximumFractionDigits,
  tone = 'auto',
  className,
  ...props
}) => {
  const format = useMoneyFormat();
  let text: string | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    try {
      text = format(value, { currency, compact, negative, minimumFractionDigits, maximumFractionDigits });
    } catch {
      // An unknown currency code (e.g. from API data) shows the empty value instead of crashing the page.
      text = null;
    }
  }
  const valid = text !== null;

  return (
    <span
      data-slot="money"
      dir="ltr"
      className={cn('font-mono tabular-nums', tone === 'auto' && valid && (value as number) < 0 && 'text-danger', className)}
      {...props}
    >
      {text ?? '—'}
    </span>
  );
};

export default Money;
