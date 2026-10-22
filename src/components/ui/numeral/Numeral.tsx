'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { cn, type FormatNumberOptions, useNumberFormat } from '@utils';

export type NumeralProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  value: number | null | undefined;
  /** Set as a superscript after the value: `%`, `ms`, `/day`. */
  unit?: ReactNode;
  options?: FormatNumberOptions;
  /** "figure" is the Ledger figure (stats, progress); "inline" sits in running text. */
  size?: 'inline' | 'figure';
};

/** A Ledger figure: mono, tabular, LTR-isolated, Western digits, with an optional superscript unit. */
const Numeral: FC<NumeralProps> = ({ value, unit, options, size = 'inline', className, ...props }) => {
  const format = useNumberFormat();
  const valid = typeof value === 'number' && Number.isFinite(value);
  const text = valid ? format(value, options) : '—';

  return (
    <span data-slot="numeral" dir="ltr" className={cn('font-mono tabular-nums', size === 'figure' && 'figure', className)} {...props}>
      {text}
      <Conditional.If condition={valid && unit !== undefined}>
        <sup data-slot="numeral-unit" className="text-fg-muted ms-0.5 text-[0.45em] font-medium tracking-normal">
          {unit}
        </sup>
      </Conditional.If>
    </span>
  );
};

export default Numeral;
