import { type ComponentPropsWithoutRef, type KeyboardEvent, type RefCallback } from 'react';
import { type NumberFormatValues, NumericFormat } from 'react-number-format';

import { Button } from '@components/ui';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { ChevronDown, ChevronUp } from 'lucide-react';

const clampValue = (value: number, min?: number, max?: number) => {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;

  return value;
};

export type FormattedNumberProps = Omit<ComponentPropsWithoutRef<typeof NumericFormat>, 'value' | 'onChange' | 'onValueChange'> & {
  ref?: RefCallback<HTMLDivElement>;
  value?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  stepper?: number;
  showStepButtons?: boolean;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  isDecimal?: boolean;
  thousandSeparator?: string;
};

export const FormattedNumber = ({
  ref,
  className,
  onChange,
  min = 0,
  max,
  stepper = 1,
  prefix,
  suffix,
  thousandSeparator = '',
  decimalScale,
  isDecimal = true,
  showStepButtons = false,
  value,
  ...props
}: FormattedNumberProps) => {
  const isIncrementDisabled = max !== undefined && (value ?? 0) >= max;
  const isDecrementDisabled = min !== undefined && (value ?? 0) <= min;

  const onValueChange = ({ floatValue }: NumberFormatValues) => onChange?.(floatValue ?? null);

  const onIncrement = () => onChange?.(clampValue((value ?? 0) + stepper, min, max));

  const onDecrement = () => onChange?.(clampValue((value ?? 0) - stepper, min, max));

  const onKeyboardChange = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' && !isIncrementDisabled) onIncrement();

    if (e.key === 'ArrowDown' && !isDecrementDisabled) onDecrement();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-0.5">
        <div className="relative w-full">
          <NumericFormat
            data-slot="formatted-number-input"
            className={cn(
              'text-primary-900 placeholder:text-muted selection:bg-primary selection:text-primary-foreground',
              'border-muted-200 h-12 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none',
              'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              'focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1',
              'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
              className,
            )}
            getInputRef={(el: HTMLInputElement) => ref?.(el)}
            value={value}
            thousandSeparator={thousandSeparator}
            decimalScale={isDecimal ? decimalScale : 0}
            prefix={prefix ? `${prefix} ` : undefined}
            suffix={suffix ? `   ${suffix}` : undefined}
            allowNegative={min < 0}
            onValueChange={onValueChange}
            onKeyDown={onKeyboardChange}
            isAllowed={({ floatValue }) => {
              if (floatValue === undefined) return true;

              return (min === undefined || floatValue >= min) && (max === undefined || floatValue <= max);
            }}
            {...props}
          />

          <Conditional.If condition={!showStepButtons}>
            <div className="absolute end-0.5 top-1/2 z-10 flex h-fit -translate-y-1/2 flex-col justify-center">
              <Button
                type="button"
                variant="ghost"
                className="bg-background h-fit rounded-none rounded-t-md p-0"
                onClick={onIncrement}
                disabled={props.disabled || isIncrementDisabled}
              >
                <ChevronUp size={20} />
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="bg-background h-fit rounded-none rounded-b-md p-0"
                onClick={onDecrement}
                disabled={props.disabled || isDecrementDisabled}
              >
                <ChevronDown size={20} />
              </Button>
            </div>
          </Conditional.If>
        </div>
      </div>
    </div>
  );
};

FormattedNumber.displayName = 'FormattedNumber';

export default FormattedNumber;
