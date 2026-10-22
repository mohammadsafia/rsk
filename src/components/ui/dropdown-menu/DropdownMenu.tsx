'use client';

import { type ComponentPropsWithoutRef, type FC, type HTMLAttributes } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { floatingMotionClassName, floatingSurfaceClassName } from '@components/ui';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Check, ChevronRight, Circle } from 'lucide-react';

type DropdownMenuProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>;
type DropdownMenuTriggerProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>;
type DropdownMenuPortalProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Portal>;
type DropdownMenuGroupProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>;
type DropdownMenuSubProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>;
type DropdownMenuRadioGroupProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioGroup>;
type DropdownMenuContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;
type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> &
  VariantProps<typeof menuItemVariants> & { inset?: boolean };
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

const menuItemBase =
  'relative flex h-7 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none select-none transition-colors focus:bg-hover data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

const menuItemVariants = cva(menuItemBase, {
  variants: {
    tone: {
      neutral: 'text-fg',
      danger: 'text-danger',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

const DropdownMenuTrigger: FC<DropdownMenuTriggerProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Trigger
    data-slot="dropdown-trigger"
    className={cn('focus-ring flex items-center justify-center rounded-md text-sm font-medium', className)}
    {...props}
  />
);

const DropdownMenuPortal: FC<DropdownMenuPortalProps> = (props) => <DropdownMenuPrimitive.Portal {...props} />;

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
    className={cn(menuItemBase, 'text-fg data-[state=open]:bg-hover cursor-default', inset && 'ps-8', className)}
    {...props}
  >
    {children}
    <ChevronRight className="ms-auto rtl:rotate-180" />
  </DropdownMenuPrimitive.SubTrigger>
);

const SubContent: FC<DropdownMenuSubContentProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.SubContent
    data-slot="dropdown-subcontent"
    className={cn(
      floatingSurfaceClassName,
      floatingMotionClassName,
      'origin-(--radix-dropdown-menu-content-transform-origin) min-w-32 overflow-hidden p-1',
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
        floatingSurfaceClassName,
        floatingMotionClassName,
        // Items cascade in as the menu unfolds.
        'cascade origin-(--radix-dropdown-menu-content-transform-origin) min-w-32 overflow-hidden p-1',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

const Item: FC<DropdownMenuItemProps> = ({ className, inset, tone, ...props }) => (
  <DropdownMenuPrimitive.Item
    data-slot="dropdown-item"
    data-tone={tone ?? 'neutral'}
    className={cn(menuItemVariants({ tone }), inset && 'ps-8', className)}
    {...props}
  />
);

const CheckboxItem: FC<DropdownMenuCheckboxItemProps> = ({ className, children, checked, ...props }) => (
  <DropdownMenuPrimitive.CheckboxItem
    data-slot="dropdown-checkbox-item"
    className={cn(menuItemBase, 'text-fg cursor-default ps-8 pe-2 data-[state=checked]:ink', className)}
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
    className={cn(menuItemBase, 'text-fg cursor-default ps-8 pe-2 data-[state=checked]:ink', className)}
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
    className={cn('text-fg-muted px-2 py-1.5 text-xs font-medium', inset && 'ps-8', className)}
    {...props}
  />
);

const Separator: FC<DropdownMenuSeparatorProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Separator
    data-slot="dropdown-separator"
    className={cn('bg-border-subtle -mx-1 my-1 h-px', className)}
    {...props}
  />
);

const Shortcut: FC<DropdownMenuShortcutProps> = ({ className, ...props }) => (
  <span data-slot="dropdown-shortcut" className={cn('text-fg-muted ms-auto font-mono text-xs', className)} {...props} />
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
