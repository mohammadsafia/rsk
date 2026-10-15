import { type ComponentPropsWithoutRef, type FC, forwardRef, type KeyboardEvent, type Ref } from 'react';
import { type NumberFormatValues, NumericFormat } from 'react-number-format';

import { fieldVariants, type FieldVariants, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { MinusIcon, PlusIcon } from 'lucide-react';

const clampValue = (value: number, min?: number, max?: number) => {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;

  return value;
};

export type FormattedNumberProps = Omit<ComponentPropsWithoutRef<typeof NumericFormat>, 'value' | 'onChange' | 'onValueChange' | 'size'> &
  FieldVariants & {
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
    invalid?: boolean;
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
  size,
  invalid = false,
  disabled,
  value,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const isIncrementDisabled = max !== undefined && (value ?? 0) >= max;
  const isDecrementDisabled = min !== undefined && (value ?? 0) <= min;

  const handleValueChange = ({ floatValue }: NumberFormatValues) => onChange?.(floatValue ?? null);

  const handleIncrement = () => onChange?.(clampValue((value ?? 0) + stepper, min, max));

  const handleDecrement = () => onChange?.(clampValue((value ?? 0) - stepper, min, max));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' && !isIncrementDisabled) handleIncrement();

    if (event.key === 'ArrowDown' && !isDecrementDisabled) handleDecrement();
  };

  // The whole control is an LTR island: a signed or grouped number must not be reordered by the bidi algorithm (addendum §11).
  return (
    <div data-slot="formatted-number" dir="ltr" className="relative w-full">
      <NumericFormat
        data-slot="formatted-number-input"
        dir="ltr"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={cn(fieldVariants({ size }), 'text-end font-mono tabular-nums', showStepButtons && 'pe-16', className)}
        getInputRef={ref}
        value={value}
        thousandSeparator={thousandSeparator}
        decimalScale={isDecimal ? decimalScale : 0}
        prefix={prefix ? `${prefix} ` : undefined}
        suffix={suffix ? ` ${suffix}` : undefined}
        allowNegative={min < 0}
        onValueChange={handleValueChange}
        onKeyDown={handleKeyDown}
        isAllowed={({ floatValue }) => {
          if (floatValue === undefined) return true;

          return (min === undefined || floatValue >= min) && (max === undefined || floatValue <= max);
        }}
        {...props}
      />

      <Conditional.If condition={showStepButtons}>
        <div data-slot="formatted-number-steps" className="absolute inset-y-0 end-1 my-auto flex h-fit items-center gap-0.5">
          <IconButton
            type="button"
            size="sm"
            tooltip={false}
            aria-label={t('number.decrement')}
            disabled={disabled || isDecrementDisabled}
            onClick={handleDecrement}
          >
            <MinusIcon />
          </IconButton>

          <IconButton
            type="button"
            size="sm"
            tooltip={false}
            aria-label={t('number.increment')}
            disabled={disabled || isIncrementDisabled}
            onClick={handleIncrement}
          >
            <PlusIcon />
          </IconButton>
        </div>
      </Conditional.If>
    </div>
  );
};

FormattedNumber.displayName = 'FormattedNumber';

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLInputElement, FormattedNumberProps>((props, ref) => FormattedNumber({ ...props, ref }));
