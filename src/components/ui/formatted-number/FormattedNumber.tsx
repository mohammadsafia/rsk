'use client';

import { type ComponentPropsWithoutRef, type FC, type FocusEvent, type KeyboardEvent, type Ref } from 'react';
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
  onBlur,
  onKeyDown,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const isIncrementDisabled = max !== undefined && (value ?? 0) >= max;
  const isDecrementDisabled = min !== undefined && (value ?? 0) <= min;

  const handleValueChange = ({ floatValue }: NumberFormatValues) => onChange?.(floatValue ?? null);

  const handleIncrement = () => onChange?.(clampValue((value ?? 0) + stepper, min, max));

  const handleDecrement = () => onChange?.(clampValue((value ?? 0) - stepper, min, max));

  // Values below min stay typeable (a 15 starts as 1); min is enforced when the field loses focus.
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (value !== null && value !== undefined && value < min) onChange?.(min);
    onBlur?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'ArrowUp' && !isIncrementDisabled) {
      event.preventDefault();
      handleIncrement();
    }

    if (event.key === 'ArrowDown' && !isDecrementDisabled) {
      event.preventDefault();
      handleDecrement();
    }
  };

  // Plaintext bidi keeps a signed or grouped number in LTR order (addendum §11) while the control itself follows the
  // page direction, so padding, step buttons and a form's error icon all sit on the same side.
  return (
    <div data-slot="formatted-number" className="relative w-full">
      <NumericFormat
        data-slot="formatted-number-input"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={cn(
          fieldVariants({ size }),
          'text-end font-mono tabular-nums [unicode-bidi:plaintext]',
          showStepButtons && 'pe-16',
          className,
        )}
        getInputRef={ref}
        // react-number-format treats null/undefined as uncontrolled and keeps its old text; '' clears it.
        value={value ?? ''}
        thousandSeparator={thousandSeparator}
        decimalScale={isDecimal ? decimalScale : 0}
        prefix={prefix ? `${prefix} ` : undefined}
        suffix={suffix ? ` ${suffix}` : undefined}
        allowNegative={min < 0}
        onValueChange={handleValueChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        isAllowed={({ floatValue }) => {
          if (floatValue === undefined) return true;

          return (floatValue >= 0 || floatValue >= min) && (max === undefined || floatValue <= max);
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

export default FormattedNumber;
