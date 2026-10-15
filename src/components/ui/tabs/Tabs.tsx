import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const tabsListVariants = cva('group/tabs-list flex min-w-0 items-center overflow-x-auto', {
  variants: {
    variant: {
      underline: 'border-border-subtle gap-4 border-b',
      contained: 'bg-surface-sunken gap-1 rounded-md p-1',
    },
    fullWidth: {
      true: 'w-full',
      false: 'w-fit',
    },
  },
  defaultVariants: {
    variant: 'underline',
    fullWidth: false,
  },
});

// Triggers read the list's data attributes, so the list's variant needs no React context.
const triggerClassName = [
  'focus-ring text-fg-muted hover:text-fg inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors',
  'disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-fg [&_svg]:size-4',
  'group-data-[full-width=true]/tabs-list:flex-1',
  'group-data-[variant=underline]/tabs-list:relative group-data-[variant=underline]/tabs-list:h-9 group-data-[variant=underline]/tabs-list:px-1',
  'group-data-[variant=underline]/tabs-list:after:absolute group-data-[variant=underline]/tabs-list:after:inset-x-0 group-data-[variant=underline]/tabs-list:after:-bottom-px group-data-[variant=underline]/tabs-list:after:h-0.5',
  'group-data-[variant=underline]/tabs-list:data-[state=active]:after:bg-accent',
  'group-data-[variant=contained]/tabs-list:h-7 group-data-[variant=contained]/tabs-list:rounded-sm group-data-[variant=contained]/tabs-list:px-3',
  'group-data-[variant=contained]/tabs-list:data-[state=active]:bg-surface group-data-[variant=contained]/tabs-list:data-[state=active]:ring-border group-data-[variant=contained]/tabs-list:data-[state=active]:ring-1',
].join(' ');

type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;
type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>;
type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;
type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

type TabsComponent = FC<TabsProps> & {
  List: FC<TabsListProps>;
  Trigger: FC<TabsTriggerProps>;
  Content: FC<TabsContentProps>;
};

const List: FC<TabsListProps> = ({ className, variant, fullWidth, ...props }) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    data-variant={variant ?? 'underline'}
    data-full-width={String(fullWidth ?? false)}
    className={cn(tabsListVariants({ variant, fullWidth }), className)}
    {...props}
  />
);

const Trigger: FC<TabsTriggerProps> = ({ className, ...props }) => (
  <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn(triggerClassName, className)} {...props} />
);

const Content: FC<TabsContentProps> = ({ className, ...props }) => (
  <TabsPrimitive.Content data-slot="tabs-content" className={cn('focus-ring mt-4 rounded-sm', className)} {...props} />
);

const Tabs: TabsComponent = ({ className, ...props }) => (
  <TabsPrimitive.Root data-slot="tabs" className={cn('min-w-0', className)} {...props} />
);

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Content = Content;

export default Tabs;
