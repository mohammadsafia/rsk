'use client';

import { type FC } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

export type RollingTextProps = { text: string; className?: string };

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const STAGGER_MS = 40;

/**
 * A figure whose digits roll like an odometer when the value changes (spec §4: rolling figures). Digits are keyed
 * from the right so the units column stays put when the length changes; the first paint is already in place, so
 * nothing moves on mount. Screen readers get the plain text.
 */
const RollingText: FC<RollingTextProps> = ({ text, className }) => {
  // By code point, not code unit: a symbol outside the BMP (a surrogate pair) stays one cell.
  const chars = Array.from(text);
  let digitFromRight = 0;
  const cells = chars
    .map((char, index) => ({ char, fromRight: chars.length - 1 - index }))
    .reverse()
    .map(({ char, fromRight }) => {
      const isDigit = /\d/.test(char);
      const delay = isDigit ? digitFromRight++ * STAGGER_MS : 0;
      return { char, fromRight, isDigit, delay };
    })
    .reverse();

  return (
    <span data-slot="rolling-text" className={cn('relative inline-flex', className)}>
      <span className="sr-only">{text}</span>
      <span data-slot="rolling-visual" aria-hidden="true" className="inline-flex h-[1em] overflow-hidden leading-none">
        {cells.map(({ char, fromRight, isDigit, delay }) => (
          <Conditional key={`cell-${fromRight}`}>
            <Conditional.If condition={isDigit}>
              <span className="inline-block h-[1em] overflow-hidden">
                <span
                  data-slot="rolling-digit"
                  className="duration-roll ease-spring flex flex-col transition-transform motion-reduce:transition-none"
                  style={{ transform: `translateY(-${char}em)`, transitionDelay: `${delay}ms` }}
                >
                  {DIGITS.map((digit) => (
                    <span key={digit} className="h-[1em]">
                      {digit}
                    </span>
                  ))}
                </span>
              </span>
            </Conditional.If>

            <Conditional.Else>
              <span data-slot="rolling-static">{char}</span>
            </Conditional.Else>
          </Conditional>
        ))}
      </span>
    </span>
  );
};

export default RollingText;
