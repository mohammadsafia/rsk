import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';

import * as SelectPrimitive from '@radix-ui/react-select';

import { cn, DISABLED_STYLES, FOCUS_RING, TRANSITION_DEFAULT } from '@utils';

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger>;
type SelectValueProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Value>;
type SelectIconProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Icon>;
type SelectScrollUpButtonProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>;
type SelectScrollDownButtonProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>;
type SelectContentProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;
type SelectGroupProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Group>;
type SelectLabelProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;
type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;
type SelectItemTextProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ItemText>;
type SelectIndicatorProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ItemIndicator>;
type SelectSeparatorProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>;
type SelectProps = typeof SelectPrimitive.Root;

type SelectComponent = SelectProps & {
  Trigger: FC<SelectTriggerProps>;
  Value: FC<SelectValueProps>;
  Icon: FC<SelectIconProps>;
  Content: FC<SelectContentProps>;
  Group: FC<SelectGroupProps>;
  Label: FC<SelectLabelProps>;
  Item: FC<SelectItemProps>;
  Text: FC<SelectItemTextProps>;
  Indicator: FC<SelectIndicatorProps>;
  Separator: FC<SelectSeparatorProps>;
  ScrollUpButton: FC<SelectScrollUpButtonProps>;
  ScrollDownButton: FC<SelectScrollDownButtonProps>;
};

const SelectTrigger: FC<SelectTriggerProps> = ({ ref, className, children, ...props }) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-slot="select-trigger"
    className={cn(
      `group/select-trigger bg-muted-50 relative flex w-full cursor-pointer items-center gap-2 rounded-md border p-3 text-sm shadow-xs`,
      `border-muted-200 ${TRANSITION_DEFAULT}`,
      'data-[state=open]:border-primary-200 data-[state=open]:ring-primary/40 data-[state=open]:ring',
      'hover:not-disabled:border-primary-200 hover:not-disabled:ring-primary/40 hover:not-disabled:ring',
      FOCUS_RING,
      `disabled:bg-muted-50 disabled:text-muted-300 ${DISABLED_STYLES}`,
      className,
    )}
    {...props}
  >
    {children}
  </SelectPrimitive.Trigger>
);

const SelectValue: FC<SelectValueProps> = ({ className, ...props }) => (
  <span data-slot="select-value" className={cn('flex-1 text-start', className)}>
    <SelectPrimitive.Value {...props} />
  </span>
);

const SelectIcon: FC<SelectIconProps> = ({ className, children, ...props }) => (
  <SelectPrimitive.Icon data-slot="select-icon" asChild {...props}>
    {children ?? (
      <ChevronDownIcon
        size={20}
        className={cn(
          'text-muted-400 shrink-0 transition-colors',
          'group-data-[state=open]/select-trigger:text-primary',
          'group-disabled/select-trigger:text-muted-300',
          className,
        )}
      />
    )}
  </SelectPrimitive.Icon>
);

const SelectScrollUpButton: FC<SelectScrollUpButtonProps> = ({ className, ...props }) => (
  <SelectPrimitive.ScrollUpButton
    data-slot="select-scroll-up"
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUpIcon />
  </SelectPrimitive.ScrollUpButton>
);

const SelectScrollDownButton: FC<SelectScrollDownButtonProps> = ({ className, ...props }) => (
  <SelectPrimitive.ScrollDownButton
    data-slot="select-scroll-down"
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDownIcon />
  </SelectPrimitive.ScrollDownButton>
);

const SelectContent: FC<SelectContentProps> = ({ className, children, position = 'popper', ...props }) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      data-slot="select-content"
      className={cn(
        'bg-popover text-popover-foreground border-muted-200 relative z-50 max-h-96 overflow-hidden rounded-md border shadow-xs',
        'data-[side=bottom]:slide-in-from-top-2 data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        position === 'popper' && 'w-(--radix-select-trigger-width)',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />

      <SelectPrimitive.Viewport
        data-slot="select-viewport"
        className={cn(position === 'popper' && 'h-(--radix-select-trigger-height) w-full')}
      >
        {children}
      </SelectPrimitive.Viewport>

      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

const SelectGroup: FC<SelectGroupProps> = (props) => <SelectPrimitive.Group data-slot="select-group" {...props} />;

const SelectLabel: FC<SelectLabelProps> = ({ className, ...props }) => (
  <SelectPrimitive.Label data-slot="select-label" className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
);

const SelectItem: FC<SelectItemProps> = ({ className, children, ...props }) => (
  <SelectPrimitive.Item
    data-slot="select-item"
    className={cn(
      `bg-background border-muted-200 relative flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm ${TRANSITION_DEFAULT} outline-none select-none not-last:border-b`,
      'data-[state=checked]:bg-primary-25 data-[state=checked]:text-primary-900 data-[state=checked]:border-b-muted-50',
      'data-highlighted:bg-primary-15',
      'focus:bg-muted-100 focus:text-foreground',
      'data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
  </SelectPrimitive.Item>
);

const SelectItemText: FC<SelectItemTextProps> = ({ className, ...props }) => (
  <SelectPrimitive.ItemText data-slot="select-item-text" className={cn(className)} {...props} />
);

const SelectIndicator: FC<SelectIndicatorProps> = ({ className, children, ...props }) => (
  <SelectPrimitive.ItemIndicator data-slot="select-item-indicator" {...props}>
    {children ?? <CheckIcon size={16} className={cn(className)} />}
  </SelectPrimitive.ItemIndicator>
);

const SelectSeparator: FC<SelectSeparatorProps> = ({ className, ...props }) => (
  <SelectPrimitive.Separator data-slot="select-item-separator" className={cn('bg-muted-200 h-px w-full', className)} {...props} />
);

const Select = SelectPrimitive.Root as SelectComponent;

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Select.Trigger = forwardRef<HTMLButtonElement, SelectTriggerProps>((props, ref) => SelectTrigger({ ...props, ref }));
Select.Value = SelectValue;
Select.Icon = SelectIcon;
Select.Content = SelectContent;
Select.Group = SelectGroup;
Select.Label = SelectLabel;
Select.Item = SelectItem;
Select.Text = SelectItemText;
Select.Indicator = SelectIndicator;
Select.Separator = SelectSeparator;
Select.ScrollUpButton = SelectScrollUpButton;
Select.ScrollDownButton = SelectScrollDownButton;

Select.Trigger.displayName = SelectPrimitive.Trigger.displayName;
SelectValue.displayName = SelectPrimitive.Value.displayName;
SelectIcon.displayName = 'SelectIcon';
SelectContent.displayName = SelectPrimitive.Content.displayName;
SelectGroup.displayName = SelectPrimitive.Group.displayName;
SelectLabel.displayName = SelectPrimitive.Label.displayName;
SelectItem.displayName = SelectPrimitive.Item.displayName;
SelectItemText.displayName = SelectPrimitive.ItemText.displayName;
SelectIndicator.displayName = 'SelectIndicator';
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

export default Select;
