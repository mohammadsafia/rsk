import { type ComponentPropsWithoutRef, type FC, type HTMLAttributes } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { cn } from '@utils';

import { Check, ChevronRight, Circle } from 'lucide-react';

type DropdownMenuProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>;
type DropdownMenuTriggerProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>;
type DropdownMenuPortalProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Portal>;
type DropdownMenuGroupProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>;
type DropdownMenuSubProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>;
type DropdownMenuRadioGroupProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioGroup>;
type DropdownMenuContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;
type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean };
type DropdownMenuCheckboxItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>;
type DropdownMenuRadioItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>;
type DropdownMenuLabelProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>;
type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>;
type DropdownMenuShortcutProps = HTMLAttributes<HTMLSpanElement>;
type DropdownMenuSubTriggerProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean };
type DropdownMenuSubContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>;

type DropdownMenuComponent = FC<DropdownMenuProps> & {
  Trigger: FC<DropdownMenuTriggerProps>;
  Group: FC<DropdownMenuGroupProps>;
  Portal: FC<DropdownMenuPortalProps>;
  Sub: FC<DropdownMenuSubProps>;
  RadioGroup: FC<DropdownMenuRadioGroupProps>;
  SubTrigger: FC<DropdownMenuSubTriggerProps>;
  SubContent: FC<DropdownMenuSubContentProps>;
  Content: FC<DropdownMenuContentProps>;
  Item: FC<DropdownMenuItemProps>;
  CheckboxItem: FC<DropdownMenuCheckboxItemProps>;
  RadioItem: FC<DropdownMenuRadioItemProps>;
  Label: FC<DropdownMenuLabelProps>;
  Separator: FC<DropdownMenuSeparatorProps>;
  Shortcut: FC<DropdownMenuShortcutProps>;
};

const DropdownMenuTrigger: FC<DropdownMenuTriggerProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Trigger
    data-slot="dropdown-trigger"
    className={cn('flex items-center justify-center text-sm font-medium outline-none', className)}
    {...props}
  />
);

const DropdownMenuPortal: FC<DropdownMenuPortalProps> = (...props) => (
  <DropdownMenuPrimitive.Portal data-slot="dropdown-portal" {...props} />
);

const DropdownMenuGroup: FC<DropdownMenuGroupProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Group data-slot="dropdown-group" className={cn(className)} {...props} />
);

const DropdownMenuSub: FC<DropdownMenuSubProps> = (props) => <DropdownMenuPrimitive.Sub data-slot="dropdown-sub" {...props} />;

const DropdownMenuRadioGroup: FC<DropdownMenuRadioGroupProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-radio-group" className={cn(className)} {...props} />
);

const SubTrigger: FC<DropdownMenuSubTriggerProps> = ({ className, inset, children, ...props }) => (
  <DropdownMenuPrimitive.SubTrigger
    data-slot="dropdown-subtrigger"
    className={cn(
      'focus:bg-accent data-[state=open]:bg-accent flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none',
      inset && 'ps-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ms-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
);

const SubContent: FC<DropdownMenuSubContentProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.SubContent
    data-slot="dropdown-subcontent"
    className={cn(
      'border-primary bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
      'data-[side=top]:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-lg',
      className,
    )}
    {...props}
  />
);

const Content: FC<DropdownMenuContentProps> = ({ className, sideOffset = 4, ...props }) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      data-slot="dropdown-content"
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground shadow-boundary-ghost z-50 min-w-32 overflow-hidden rounded-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

const Item: FC<DropdownMenuItemProps> = ({ className, inset, ...props }) => (
  <DropdownMenuPrimitive.Item
    data-slot="dropdown-item"
    className={cn(
      'hover:bg-primary hover:text-primary-foreground text-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors',
      'outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
      inset && 'ps-8',
      className,
    )}
    {...props}
  />
);

const CheckboxItem: FC<DropdownMenuCheckboxItemProps> = ({ className, children, checked, ...props }) => (
  <DropdownMenuPrimitive.CheckboxItem
    data-slot="dropdown-checkbox-item"
    className={cn(
      'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center rounded-sm py-1.5',
      'ps-8 pe-2 text-sm transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute inset-s-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator data-slot="dropdown-item-indicator">
        <Check size={16} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    {children}
  </DropdownMenuPrimitive.CheckboxItem>
);

const RadioItem: FC<DropdownMenuRadioItemProps> = ({ className, children, ...props }) => (
  <DropdownMenuPrimitive.RadioItem
    data-slot="dropdown-radio-item"
    className={cn(
      'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center rounded-sm py-1.5',
      'ps-8 pe-2 text-sm transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute inset-s-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator data-slot="dropdown-item-indicator">
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    {children}
  </DropdownMenuPrimitive.RadioItem>
);

const Label: FC<DropdownMenuLabelProps & { inset?: boolean }> = ({ className, inset, ...props }) => (
  <DropdownMenuPrimitive.Label
    data-slot="dropdown-label"
    className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'ps-8', className)}
    {...props}
  />
);

const Separator: FC<DropdownMenuSeparatorProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Separator data-slot="dropdown-separator" className={cn('bg-muted-200 -mx-1 my-1 h-px', className)} {...props} />
);

const Shortcut: FC<DropdownMenuShortcutProps> = ({ className, ...props }) => (
  <span data-slot="dropdown-shortcut" className={cn('ms-auto text-xs tracking-widest opacity-60', className)} {...props} />
);

const DropdownMenu: DropdownMenuComponent = (props) => <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;

DropdownMenu.Trigger = DropdownMenuTrigger;
DropdownMenu.Group = DropdownMenuGroup;
DropdownMenu.Portal = DropdownMenuPortal;
DropdownMenu.Sub = DropdownMenuSub;
DropdownMenu.RadioGroup = DropdownMenuRadioGroup;
DropdownMenu.SubTrigger = SubTrigger;
DropdownMenu.SubContent = SubContent;
DropdownMenu.Content = Content;
DropdownMenu.Item = Item;
DropdownMenu.CheckboxItem = CheckboxItem;
DropdownMenu.RadioItem = RadioItem;
DropdownMenu.Label = Label;
DropdownMenu.Separator = Separator;
DropdownMenu.Shortcut = Shortcut;

SubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
SubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
Content.displayName = DropdownMenuPrimitive.Content.displayName;
Item.displayName = DropdownMenuPrimitive.Item.displayName;
CheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
RadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
Label.displayName = DropdownMenuPrimitive.Label.displayName;
Separator.displayName = DropdownMenuPrimitive.Separator.displayName;
Shortcut.displayName = 'DropdownMenuShortcut';

export default DropdownMenu;
