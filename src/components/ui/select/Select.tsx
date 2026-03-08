import { type ComponentPropsWithoutRef, type FC, type Ref } from 'react';

import * as SelectPrimitive from '@radix-ui/react-select';

import { cn } from '@utils';

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

type SelectTriggerProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
  ref?: Ref<HTMLButtonElement>;
  error?: boolean;
};
type SelectContentProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;
type SelectValueProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Value>;
type SelectGroupProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Group>;
type SelectLabelProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;
type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;
type SelectSeparatorProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>;
type SelectScrollUpButtonProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>;
type SelectScrollDownButtonProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>;
type SelectProps = typeof SelectPrimitive.Root;

type SelectComponent = SelectProps & {
  Trigger: FC<SelectTriggerProps>;
  Value: FC<SelectValueProps>;
  Group: FC<SelectGroupProps>;
  Content: FC<SelectContentProps>;
  Label: FC<SelectLabelProps>;
  Item: FC<SelectItemProps>;
  Separator: FC<SelectSeparatorProps>;
  ScrollUpButton: FC<SelectScrollUpButtonProps>;
  ScrollDownButton: FC<SelectScrollDownButtonProps>;
};

const SelectTrigger: FC<SelectTriggerProps> = ({ className, children, error, disabled, ...props }) => {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      disabled={disabled}
      className={cn(
        'group bg-background relative flex h-12 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-3 text-xs shadow-xs',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        'transition-colors focus-visible:outline-none',
        !error && 'border-muted-200 hover:border-muted-300 focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1',
        !!error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive focus-visible:ring-1',
        className,
      )}
      {...props}
    >
      <div className={cn('flex min-w-0 flex-1 items-center justify-between', error && 'ps-6')}>{children}</div>

      <SelectPrimitive.Icon data-slot="select-icon" asChild>
        <ChevronDownIcon
          className={cn('h-4 w-4 shrink-0 transition-colors', {
            'text-destructive': !!error,
            'text-muted-300 opacity-50': disabled,
            'text-muted-400': !error && !disabled,
            'group-data-[state=open]:text-primary': !error && !disabled,
          })}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
};

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
        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 px-2',
        {
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1':
            position === 'popper',
          'w-(--radix-select-trigger-width)': position === 'popper',
        },
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        data-slot="select-viewport"
        className={cn('flex flex-col gap-2 py-3', position === 'popper' && 'h-(--radix-select-trigger-height) w-full')}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

const SelectLabel: FC<SelectLabelProps> = ({ className, ...props }) => (
  <SelectPrimitive.Label data-slot="select-label" className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
);

const SelectItem: FC<SelectItemProps> = ({ className, children, disabled, ...props }) => (
  <SelectPrimitive.Item
    data-slot="select-item"
    className={cn(
      'bg-background focus:bg-muted-100 focus:text-foreground relative flex w-full cursor-pointer items-center px-3 py-2 text-xs outline-none select-none',
      'hover:bg-muted-50 border-muted-200 border-b transition-colors last:border-b-0',
      'data-highlighted:bg-muted-100',
      'data-[state=checked]:bg-muted-100 data-[state=checked]:text-foreground',
      disabled && 'data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText data-slot="select-item-text" className="flex-1">
      {children}
    </SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

const SelectSeparator: FC<SelectSeparatorProps> = ({ className, ...props }) => (
  <SelectPrimitive.Separator data-slot="select-separator" className={cn('bg-muted-200 h-px w-full', className)} {...props} />
);

const SelectValue: FC<SelectValueProps> = ({ className, ...props }) => (
  <SelectPrimitive.Value
    data-slot="select-value"
    className={cn('text-primary-900 data-placeholder:text-muted-400', className)}
    {...props}
  />
);

const SelectGroup: FC<SelectGroupProps> = (props) => <SelectPrimitive.Group data-slot="select-group" {...props} />;

const Select = SelectPrimitive.Root as SelectComponent;

Select.Trigger = SelectTrigger;
Select.Group = SelectGroup;
Select.Item = SelectItem;
Select.Label = SelectLabel;
Select.Content = SelectContent;
Select.Value = SelectValue;
Select.Separator = SelectSeparator;
Select.ScrollUpButton = SelectScrollUpButton;
Select.ScrollDownButton = SelectScrollDownButton;

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
SelectItem.displayName = SelectPrimitive.Item.displayName;
SelectLabel.displayName = SelectPrimitive.Label.displayName;
SelectContent.displayName = SelectPrimitive.Content.displayName;
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

export default Select;
