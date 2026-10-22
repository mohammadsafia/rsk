'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC } from 'react';

import * as SelectPrimitive from '@radix-ui/react-select';

import { fieldVariants, type FieldVariants, floatingMotionClassName, floatingSurfaceClassName } from '@components/ui';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> & FieldVariants & { invalid?: boolean };
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

const SelectTrigger: FC<SelectTriggerProps> = ({ ref, className, size, invalid, children, ...props }) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-slot="select-trigger"
    aria-invalid={invalid || undefined}
    className={cn(
      fieldVariants({ size }),
      'group/select-trigger relative cursor-pointer gap-2 text-start data-[placeholder]:text-fg-muted data-[state=open]:border-fg',
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
        className={cn(
          'text-fg-muted size-4 shrink-0 transition-transform group-data-[state=open]/select-trigger:rotate-180 group-disabled/select-trigger:text-fg-subtle',
          className,
        )}
      />
    )}
  </SelectPrimitive.Icon>
);

const SelectScrollUpButton: FC<SelectScrollUpButtonProps> = ({ className, ...props }) => (
  <SelectPrimitive.ScrollUpButton
    data-slot="select-scroll-up"
    className={cn('text-fg-muted flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUpIcon />
  </SelectPrimitive.ScrollUpButton>
);

const SelectScrollDownButton: FC<SelectScrollDownButtonProps> = ({ className, ...props }) => (
  <SelectPrimitive.ScrollDownButton
    data-slot="select-scroll-down"
    className={cn('text-fg-muted flex cursor-default items-center justify-center py-1', className)}
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
        floatingSurfaceClassName,
        floatingMotionClassName,
        'origin-(--radix-select-content-transform-origin) relative max-h-96 overflow-hidden p-1',
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
        // Options cascade in as the list unfolds, from above: Radix shows its scroll-down arrow whenever content overflows,
        // and a rise from below would count as overflow while it plays.
        className={cn('cascade [--cascade-rise:-4px]', position === 'popper' && 'h-(--radix-select-trigger-height) w-full')}
      >
        {children}
      </SelectPrimitive.Viewport>

      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

const SelectGroup: FC<SelectGroupProps> = (props) => <SelectPrimitive.Group data-slot="select-group" {...props} />;

const SelectLabel: FC<SelectLabelProps> = ({ className, ...props }) => (
  <SelectPrimitive.Label data-slot="select-label" className={cn('text-fg-muted px-2 py-1.5 text-xs font-medium', className)} {...props} />
);

const SelectItem: FC<SelectItemProps> = ({ className, children, ...props }) => (
  <SelectPrimitive.Item
    data-slot="select-item"
    className={cn(
      'relative flex h-control-sm w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none',
      'data-highlighted:bg-hover data-[state=checked]:text-fg data-[state=checked]:ink',
      'data-disabled:pointer-events-none data-disabled:text-fg-subtle',
      className,
    )}
    {...props}
  >
    <Conditional>
      {/* Plain text must sit in ItemText, or Radix cannot show it in the trigger's Select.Value. */}
      <Conditional.If condition={typeof children === 'string' || typeof children === 'number'}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>

        <SelectPrimitive.ItemIndicator className="ms-auto">
          <CheckIcon aria-hidden="true" className="text-fg-muted size-4" />
        </SelectPrimitive.ItemIndicator>
      </Conditional.If>

      <Conditional.Else>{children}</Conditional.Else>
    </Conditional>
  </SelectPrimitive.Item>
);

const SelectItemText: FC<SelectItemTextProps> = ({ className, ...props }) => (
  <SelectPrimitive.ItemText data-slot="select-item-text" className={cn(className)} {...props} />
);

const SelectIndicator: FC<SelectIndicatorProps> = ({ className, children, ...props }) => (
  <SelectPrimitive.ItemIndicator data-slot="select-item-indicator" {...props}>
    {children ?? <CheckIcon className={cn('text-fg-muted ms-auto size-4', className)} />}
  </SelectPrimitive.ItemIndicator>
);

const SelectSeparator: FC<SelectSeparatorProps> = ({ className, ...props }) => (
  <SelectPrimitive.Separator data-slot="select-item-separator" className={cn('bg-border-subtle -mx-1 my-1 h-px', className)} {...props} />
);

const Select = SelectPrimitive.Root as SelectComponent;

Select.Trigger = SelectTrigger;
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
