import {
  Children,
  type ComponentProps,
  createContext,
  type FC,
  isValidElement,
  type PropsWithChildren,
  type ReactNode,
  useContext,
  useState,
} from 'react';

import { Calendar, type CalendarRange, Popover } from '@components/ui';
import { TooltipButton } from '@components/shared';
import { Conditional } from '@components/utils';

import { type DateInput, useDate } from '@hooks/shared';

import { cn } from '@utils';

import { Calendar as CalendarIcon } from 'lucide-react';

export type CalendarPickerMode = 'single' | 'range';

export type CalendarPickerCloseOn = 'select' | 'complete' | 'never';

export type CalendarPickerSingleSelected = DateInput | null;

export type CalendarPickerRangeSelected = { from: DateInput; to: DateInput } | null;

export type CalendarPickerSelected = CalendarPickerSingleSelected | CalendarPickerRangeSelected;

type PopoverContentProps = ComponentProps<typeof Popover.Content>;

export type CalendarPickerTriggerApi = {
  value: CalendarPickerSelected;
  label: string;
  isOpen: boolean;
};

export type CalendarPickerContentApi =
  | { mode: 'single'; selected: CalendarPickerSingleSelected; onSelect: (iso: string) => void; close: () => void }
  | { mode: 'range'; selected: CalendarPickerRangeSelected; onSelect: (range: { from: string; to: string }) => void; close: () => void };

type CalendarPickerContextValue = CalendarPickerTriggerApi & CalendarPickerContentApi;

type CalendarPickerTriggerProps = {
  children: ReactNode | ((api: CalendarPickerTriggerApi) => ReactNode);
};

type CalendarPickerContentSlotProps = Omit<PopoverContentProps, 'children'> & {
  children: ReactNode | ((api: CalendarPickerContentApi) => ReactNode);
};

type CalendarPickerSharedProps = PropsWithChildren<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOn?: CalendarPickerCloseOn;
  dismissable?: boolean;

  triggerIcon?: ReactNode;
  triggerTooltip?: string;
  popoverSide?: PopoverContentProps['side'];
  popoverAlign?: PopoverContentProps['align'];
  popoverSideOffset?: PopoverContentProps['sideOffset'];

  calendarProps?: Omit<ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect' | 'required' | 'modifiers'>;
}>;

type CalendarPickerSingleProps = {
  mode?: 'single';
  value: DateInput | null;
  selected?: CalendarPickerSelected;
  onChange: (iso: string) => void;
};

type CalendarPickerRangeProps = {
  mode: 'range';
  value: { from: DateInput; to: DateInput } | null;
  selected?: CalendarPickerRangeSelected;
  onChange: (range: { from: string; to: string }) => void;
};

export type CalendarPickerProps = (CalendarPickerSingleProps | CalendarPickerRangeProps) & CalendarPickerSharedProps;

type CalendarPickerComponent = FC<CalendarPickerProps> & {
  Trigger: FC<CalendarPickerTriggerProps>;
  Content: FC<CalendarPickerContentSlotProps>;
};

const isRangeShape = (value: unknown): value is { from: DateInput; to: DateInput } =>
  value != null && typeof value === 'object' && 'from' in value;

const CalendarPickerContext = createContext<CalendarPickerContextValue | null>(null);

const useCalendarPickerContext = (): CalendarPickerContextValue => {
  const context = useContext(CalendarPickerContext);

  if (!context) throw new Error('CalendarPicker.Trigger / CalendarPicker.Content must be used inside <CalendarPicker>');

  return context;
};

const CalendarPickerTrigger: FC<CalendarPickerTriggerProps> = ({ children }) => {
  const { value, label, isOpen } = useCalendarPickerContext();

  const resolved = typeof children === 'function' ? children({ value, label, isOpen }) : children;

  return <Popover.Trigger asChild>{resolved}</Popover.Trigger>;
};

const CalendarPickerContent: FC<CalendarPickerContentSlotProps> = ({ className, children, ...props }) => {
  const ctx = useCalendarPickerContext();

  const resolved = typeof children === 'function' ? children(ctx) : children;

  return (
    <Popover.Content className={cn('p-0', className)} {...props}>
      {resolved}
    </Popover.Content>
  );
};

const CalendarPicker: CalendarPickerComponent = (props) => {
  const {
    open: controlledOpen,
    onOpenChange,
    closeOn = 'select',
    dismissable = true,
    triggerIcon,
    triggerTooltip,
    popoverSide,
    popoverAlign,
    popoverSideOffset,
    calendarProps: consumerCalendarProps,
    children,
  } = props;

  const { formatNullableDate, toBoundaryDate, toDate, constants } = useDate();
  const [internalOpen, setInternalOpen] = useState(false);

  const childArray = Children.toArray(children);
  const triggerChild = childArray.find((child) => isValidElement(child) && child.type === CalendarPickerTrigger);
  const contentChild = childArray.find((child) => isValidElement(child) && child.type === CalendarPickerContent);

  const isOpen = controlledOpen ?? internalOpen;
  const selectedRaw = props.selected ?? props.value;
  const range = isRangeShape(selectedRaw) ? { from: toBoundaryDate(selectedRaw.from), to: toBoundaryDate(selectedRaw.to) } : undefined;
  const anchor = range?.from ?? (selectedRaw != null && !isRangeShape(selectedRaw) ? toBoundaryDate(selectedRaw) : undefined);

  const label = isRangeShape(props.value)
    ? `${formatNullableDate(props.value.from, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '')} – ${formatNullableDate(props.value.to, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '')}`
    : formatNullableDate(props.value, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '');

  const setIsOpen = (next: boolean) => {
    onOpenChange?.(next);

    if (controlledOpen === undefined) setInternalOpen(next);
  };

  const close = () => setIsOpen(false);

  const calendarProps =
    props.mode === 'range'
      ? {
          mode: 'range' as const,
          required: false as const,
          selected: range,
          onSelect: (next: CalendarRange | undefined) => {
            if (!next?.from || !next?.to) return;

            props.onChange({ from: toDate(next.from), to: toDate(next.to) });
            closeOn !== 'never' && close();
          },
        }
      : {
          mode: 'single' as const,
          selected: anchor,
          modifiers: range
            ? { range_start: range.from, range_end: range.to, range_middle: { after: range.from, before: range.to } }
            : undefined,
          onSelect: (date: Date | undefined) => {
            if (!date) return;

            props.onChange(toDate(date));
            closeOn !== 'never' && close();
          },
        };

  const sharedContextFields = { value: props.value, label, isOpen, close };
  const contextValue: CalendarPickerContextValue =
    props.mode === 'range'
      ? { ...sharedContextFields, mode: 'range', selected: props.selected ?? props.value, onSelect: props.onChange }
      : {
          ...sharedContextFields,
          mode: 'single',
          selected: isRangeShape(props.selected) ? props.value : (props.selected ?? props.value),
          onSelect: props.onChange,
        };

  return (
    <CalendarPickerContext.Provider value={contextValue}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Conditional>
          <Conditional.If condition={!!triggerChild}>{triggerChild}</Conditional.If>

          <Conditional.Else>
            <CalendarPickerTrigger>
              <TooltipButton title={triggerTooltip} type="button" variant="ghost" size="icon-sm">
                {triggerIcon ?? <CalendarIcon size={20} />}
              </TooltipButton>
            </CalendarPickerTrigger>
          </Conditional.Else>
        </Conditional>

        <Conditional>
          <Conditional.If condition={!!contentChild}>{contentChild}</Conditional.If>

          <Conditional.Else>
            <CalendarPickerContent
              side={popoverSide}
              align={popoverAlign}
              sideOffset={popoverSideOffset}
              onPointerDownOutside={dismissable ? undefined : (e) => e.preventDefault()}
              onEscapeKeyDown={dismissable ? undefined : (e) => e.preventDefault()}
            >
              <Calendar {...calendarProps} defaultMonth={anchor} {...consumerCalendarProps} />
            </CalendarPickerContent>
          </Conditional.Else>
        </Conditional>
      </Popover>
    </CalendarPickerContext.Provider>
  );
};

CalendarPicker.Trigger = CalendarPickerTrigger;
CalendarPicker.Content = CalendarPickerContent;

export default CalendarPicker;
