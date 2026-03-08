import {
  Children,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type FC,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button, Popover, ScrollSelector } from '@components/ui';
import { Conditional } from '@components/utils';
import { TooltipButton } from '@components/shared';

import { useDebounce, useTime } from '@hooks/shared';

import { cn } from '@utils';

import { Check, Clock4Icon, XIcon } from 'lucide-react';

export type TimePickerClearProps = {
  onClear?: () => void;
  disabled?: boolean;
  hasValue?: boolean;
};

export type TimePickerTriggerProps = Omit<ComponentPropsWithRef<'button'>, 'value'> & {
  error?: boolean;
  placeholder?: string;
  value?: string | null;
  displayValue?: string | null;
};

export type TimePickerContentProps = ComponentPropsWithoutRef<typeof Popover.Content> & {
  value?: string | null;
  tempValue: string;
  onTempValueChange: (value: string) => void;
  onConfirm: () => void;
  use24hFormat?: boolean;
  min?: string;
  max?: string;
  step?: number;
};

export type TimePickerRootProps = ComponentPropsWithoutRef<typeof Popover>;

export type TimePickerProps = {
  name: string;
  value?: string | null;
  onChange?: (value?: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  clearButton?: boolean;
  use24hFormat?: boolean;
  min?: string;
  max?: string;
  step?: number;
  startAt?: string;
  error?: boolean;
};

const TimePickerClear: FC<TimePickerClearProps> = ({ onClear, disabled, hasValue }) => {
  if (!hasValue || !onClear || disabled) return null;

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClear();
  };

  return (
    <TooltipButton title="Clear" variant="ghost-muted-destructive" size="unstyled" onClick={handleClear}>
      <XIcon size={16} />
    </TooltipButton>
  );
};

const TimePickerTrigger = forwardRef<HTMLButtonElement, TimePickerTriggerProps>(
  ({ className, error, placeholder = 'Select time', value, displayValue, disabled, children, ...props }, ref) => {
    // Separate TimePicker.Clear from other children
    const childrenArray = Children.toArray(children);
    const clearComponent = childrenArray.find((child) => isValidElement(child) && child.type === TimePickerClear);
    const otherChildren = childrenArray.filter((child) => !(isValidElement(child) && child.type === TimePickerClear));

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        data-slot="time-picker-trigger"
        className={cn(
          'group bg-background relative flex h-12 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-3 text-xs shadow-xs',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors focus-visible:outline-none',
          {
            'border-muted-200 hover:border-muted-300 focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1': !error,
            'border-destructive focus-visible:border-destructive focus-visible:ring-destructive focus-visible:ring-1': !!error,
          },
          className,
        )}
        aria-invalid={error}
        {...props}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Clock4Icon
            size={20}
            className={cn('h-5 w-5 shrink-0 transition-colors', {
              'text-destructive': !!error,
              'text-muted-300 opacity-50': disabled,
              'text-muted-400': !error && !disabled,
              'group-data-[state=open]:text-primary': !error && !disabled,
            })}
          />
          <Conditional>
            <Conditional.If condition={!!displayValue}>
              <span className="text-primary-900 line-clamp-1 min-w-[100px] text-left">{displayValue}</span>
            </Conditional.If>
            <Conditional.Else>
              <span className="text-muted-400 line-clamp-1 min-w-[100px] text-left">{placeholder}</span>
            </Conditional.Else>
          </Conditional>
          {otherChildren}
        </div>
        <div className="flex shrink-0 items-center gap-2">{clearComponent}</div>
      </button>
    );
  },
);

const TimePickerContent: FC<TimePickerContentProps> = ({
  className,
  value,
  tempValue,
  onTempValueChange,
  onConfirm,
  use24hFormat = false,
  min = '00:00',
  max = '23:59',
  step = 1,
  ...props
}) => {
  const { getTimeOptions, parseTimeString } = useTime();

  const [minHour] = useMemo(() => parseTimeString(min), [min, parseTimeString]);
  const [maxHour] = useMemo(() => parseTimeString(max), [max, parseTimeString]);

  const timeOptions = useMemo(() => getTimeOptions(min, max, step, !use24hFormat), [min, max, step, use24hFormat, getTimeOptions]);

  const [valHour, valMinute, valAmPm] = useMemo(() => parseTimeString(tempValue), [tempValue, parseTimeString]);

  const hourOptions = useMemo(
    () =>
      timeOptions
        .filter((option) => option.toLowerCase().includes((valAmPm ?? 'am').toLowerCase()))
        .reduce(
          (prev, time) => {
            const hour = time.split(':')[0];
            if (prev.find((option) => option.value === parseInt(hour))) return prev;
            return [
              ...prev,
              {
                label: hour,
                value: parseInt(hour),
                hide: false,
              },
            ];
          },
          [] as { label: string; value: number }[],
        ),
    [timeOptions, valAmPm],
  );

  const minuteOptions = useMemo(
    () =>
      timeOptions
        .filter(
          (option) =>
            option.toLowerCase().includes((valAmPm ?? 'am').toLowerCase()) &&
            option.includes(`${(valHour - (valAmPm === 'PM' && valHour > 12 ? 12 : 0)).toString().padStart(2, '0')}:`),
        )
        .reduce(
          (prev, time) =>
            prev.find((option) => option.value === parseInt(time.split(':')[1]))
              ? prev
              : [
                  ...prev,
                  {
                    label: time.split(':')[1].split(' ')[0],
                    value: parseInt(time.split(':')[1].split(' ')[0]),
                    hide: false,
                  },
                ],
          [] as { label: string; value: number }[],
        ),
    [timeOptions, valHour, valAmPm],
  );

  const ampmOptions = useMemo(
    () => [
      { label: 'AM', value: 'AM', hide: minHour >= 12 },
      { label: 'PM', value: 'PM', hide: maxHour < 12 },
    ],
    [minHour, maxHour],
  );

  return (
    <Popover.Content
      data-slot="time-picker-content"
      className={cn(
        'bg-popover text-popover-foreground border-muted-200 relative z-50 w-fit overflow-hidden rounded-md border px-2 shadow-xs',
        'data-[side=bottom]:slide-in-from-top-2 data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      side="bottom"
      align="start"
      {...props}
    >
      <div className="flex gap-2 py-3">
        <ScrollSelector
          options={hourOptions}
          value={parseInt(tempValue.split(':')[0])}
          onSelect={(val) =>
            onTempValueChange(
              `${val.toString().padStart(2, '0')}:${valMinute.toString().padStart(2, '0')}${use24hFormat ? '' : ' ' + (valAmPm ?? 'AM')}`,
            )
          }
        />
        <ScrollSelector
          options={minuteOptions}
          value={valMinute}
          onSelect={(val) =>
            onTempValueChange(`${tempValue.split(':')[0]}:${val.toString().padStart(2, '0')}${use24hFormat ? '' : ' ' + (valAmPm ?? 'AM')}`)
          }
        />
        <Conditional.If condition={!use24hFormat}>
          <ScrollSelector
            options={ampmOptions}
            value={valAmPm}
            onSelect={(val) => onTempValueChange(`${tempValue.split(':')[0]}:${valMinute.toString().padStart(2, '0')} ${val}`)}
          />
        </Conditional.If>
      </div>
      <div className="mt-4 flex justify-end pb-2">
        <Button size="sm" variant="ghost" className="h-auto px-2 py-1" onClick={onConfirm}>
          <Check size={20} className="text-primary" />
        </Button>
      </div>
    </Popover.Content>
  );
};

const TimePickerRoot: FC<TimePickerRootProps> = ({ children, ...props }) => {
  return (
    <Popover data-slot="time-picker" modal {...props}>
      {children}
    </Popover>
  );
};

const TimePicker = ({
  name,
  className,
  disabled,
  placeholder = 'Select time',
  clearButton = true,
  min = '00:00',
  startAt = '08:00 AM',
  max = '23:59',
  step = 1,
  use24hFormat = false,
  value,
  onChange,
  error = false,
}: TimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const display = useDebounce(tempValue || value, 200);

  useEffect(() => {
    if (!isOpen) {
      setTempValue('');
    } else {
      setTempValue(value || startAt || min);
    }
  }, [isOpen, value, startAt, min]);

  const handleConfirm = () => {
    onChange?.(tempValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.(undefined);
  };

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen} modal>
      <Popover.Trigger id={name as string} asChild>
        <TimePicker.Trigger
          className={className}
          disabled={disabled}
          error={error}
          placeholder={placeholder}
          value={value}
          displayValue={display}
        >
          {clearButton && <TimePicker.Clear onClear={handleClear} disabled={disabled} hasValue={!!value} />}
        </TimePicker.Trigger>
      </Popover.Trigger>
      <TimePicker.Content
        value={value}
        tempValue={tempValue}
        onTempValueChange={setTempValue}
        onConfirm={handleConfirm}
        use24hFormat={use24hFormat}
        min={min}
        max={max}
        step={step}
      />
    </Popover>
  );
};

TimePickerContent.displayName = 'TimePickerContent';
TimePickerTrigger.displayName = 'TimePickerTrigger';
TimePickerClear.displayName = 'TimePickerClear';
TimePickerRoot.displayName = 'TimePickerRoot';
TimePicker.displayName = 'TimePicker';

TimePicker.Root = TimePickerRoot;
TimePicker.Trigger = TimePickerTrigger;
TimePicker.Clear = TimePickerClear;
TimePicker.Content = TimePickerContent;

export default TimePicker;
