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
  const valid = typeof value === 'number' && Number.isFinite(value);

  return (
    <span
      data-slot="money"
      dir="ltr"
      className={cn('font-mono tabular-nums', tone === 'auto' && valid && value < 0 && 'text-danger', className)}
      {...props}
    >
      {valid ? format(value, { currency, compact, negative, minimumFractionDigits, maximumFractionDigits }) : '—'}
    </span>
  );
};

export default Money;
