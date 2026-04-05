import { type ComponentPropsWithoutRef, type FC, forwardRef, type KeyboardEvent, type Ref } from 'react';
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
  ref?: Ref<HTMLInputElement>;
  value?: number | null;
  min?: number;
  max?: number;
  decimalScale?: number;
  stepper?: number;
  prefix?: string;
  suffix?: string;
  thousandSeparator?: string;
  showStepButtons?: boolean;
  isDecimal?: boolean;
  onChange?: (value: number | null) => void;
};

const FormattedNumber: FC<FormattedNumberProps> = ({
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
              'border-muted-200 bg-muted-50 flex w-full rounded-md border p-3 text-sm shadow-xs transition-[color,box-shadow] outline-none',
              'placeholder:text-muted',
              'hover:not-disabled:border-primary hover:not-disabled:ring-primary hover:not-disabled:ring',
              'focus-visible:ring-primary focus-visible:border-primary focus-visible:ring',
              'disabled:bg-muted-50 disabled:text-muted-300 disabled:placeholder:text-muted-300 disabled:pointer-events-none',
              className,
            )}
            getInputRef={ref}
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
            <div className="absolute inset-e-2 inset-bs-1/2 z-10 flex h-fit -translate-y-1/2 flex-col justify-center">
              <Button
                type="button"
                variant="ghost-muted"
                className="bg-background h-fit rounded-none rounded-t-md p-0"
                onClick={onIncrement}
                disabled={props.disabled || isIncrementDisabled}
              >
                <ChevronUp size={16} />
              </Button>

              <Button
                type="button"
                variant="ghost-muted"
                className="bg-background h-fit rounded-none rounded-b-md p-0"
                onClick={onDecrement}
                disabled={props.disabled || isDecrementDisabled}
              >
                <ChevronDown size={16} />
              </Button>
            </div>
          </Conditional.If>
        </div>
      </div>
    </div>
  );
};

FormattedNumber.displayName = 'FormattedNumber';

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLInputElement, FormattedNumberProps>((props, ref) => FormattedNumber({ ...props, ref }));
