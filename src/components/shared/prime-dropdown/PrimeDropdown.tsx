import { Children, type ComponentPropsWithoutRef, type FC, isValidElement, type ReactNode } from 'react';

import { DropdownMenu } from '@components/ui';
import { Conditional } from '@components/utils';
import { withAuth, withConditional } from '@hoc';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type PrimeDropdownTriggerProps = ComponentPropsWithoutRef<typeof DropdownMenu.Trigger>;

type PrimeDropdownListProps = ComponentPropsWithoutRef<typeof DropdownMenu.Content>;

type PrimeDropdownLabelProps = ComponentPropsWithoutRef<typeof DropdownMenu.Label>;

type PrimeDropdownItemProps = ComponentPropsWithoutRef<typeof DropdownMenu.Item> &
  VariantProps<typeof primeDropdownItemVariants> & {
    icon?: ReactNode;
  };

type PrimeDropdownSeparatorProps = ComponentPropsWithoutRef<typeof DropdownMenu.Separator>;

type PrimeDropdownProps = ComponentPropsWithoutRef<typeof DropdownMenu> &
  Pick<PrimeDropdownListProps, 'align' | 'side' | 'sideOffset'> & {
    className?: string;
  };

const primeDropdownItemVariants = cva('', {
  variants: {
    variant: {
      primary: '',
      destructive: 'text-destructive hover:bg-destructive hover:not-disabled:text-destructive-foreground',
    },
  },
  defaultVariants: { variant: 'primary' },
});

type PrimeDropdownComponent = FC<PrimeDropdownProps> & {
  Trigger: FC<PrimeDropdownTriggerProps>;
  List: FC<PrimeDropdownListProps>;
  Label: FC<PrimeDropdownLabelProps>;
  Item: typeof ComposedPrimeDropdownItem;
  Separator: FC<PrimeDropdownSeparatorProps>;
};

const Trigger: FC<PrimeDropdownTriggerProps> = ({ className, ...props }) => <DropdownMenu.Trigger className={cn(className)} {...props} />;

const List: FC<PrimeDropdownListProps> = ({ className, ...props }) => <DropdownMenu.Content className={cn(className)} {...props} />;

const Label: FC<PrimeDropdownLabelProps> = ({ className, ...props }) => <DropdownMenu.Label className={cn(className)} {...props} />;

const BaseItem: FC<PrimeDropdownItemProps> = ({ className, icon, variant, children, ...props }) => (
  <DropdownMenu.Item className={cn(primeDropdownItemVariants({ variant }), className)} {...props}>
    {icon && <span className="flex shrink-0 items-center">{icon}</span>}

    {children}
  </DropdownMenu.Item>
);

const Separator: FC<PrimeDropdownSeparatorProps> = ({ className, ...props }) => (
  <DropdownMenu.Separator className={cn(className)} {...props} />
);

const PrimeDropdown: PrimeDropdownComponent = ({ align, side, sideOffset, className, children, ...rootProps }) => {
  const childArray = Children.toArray(children);

  const triggerChild = childArray.find((child) => isValidElement(child) && child.type === PrimeDropdown.Trigger);
  const listChild = childArray.find((child) => isValidElement(child) && child.type === PrimeDropdown.List);

  const menuItems = childArray.filter(
    (child) => !(isValidElement(child) && (child.type === PrimeDropdown.Trigger || child.type === PrimeDropdown.List)),
  );

  return (
    <DropdownMenu {...rootProps}>
      <Conditional>
        <Conditional.If condition={!!triggerChild}>{triggerChild}</Conditional.If>

        <Conditional.Else>
          <DropdownMenu.Trigger asChild>{childArray[0]}</DropdownMenu.Trigger>
        </Conditional.Else>
      </Conditional>

      <Conditional>
        <Conditional.If condition={!!listChild}>{listChild}</Conditional.If>

        <Conditional.Else>
          <DropdownMenu.Content align={align} side={side} sideOffset={sideOffset} className={cn(className)}>
            {triggerChild ? menuItems : childArray.slice(1)}
          </DropdownMenu.Content>
        </Conditional.Else>
      </Conditional>
    </DropdownMenu>
  );
};

const ComposedPrimeDropdownItem = withConditional(withAuth(BaseItem));

PrimeDropdown.Trigger = Trigger;
PrimeDropdown.List = List;
PrimeDropdown.Label = Label;
PrimeDropdown.Item = ComposedPrimeDropdownItem;
PrimeDropdown.Separator = Separator;

Trigger.displayName = 'PrimeDropdownTrigger';
List.displayName = 'PrimeDropdownList';
Label.displayName = 'PrimeDropdownLabel';
BaseItem.displayName = 'PrimeDropdownItem';
Separator.displayName = 'PrimeDropdownSeparator';

export default PrimeDropdown;
