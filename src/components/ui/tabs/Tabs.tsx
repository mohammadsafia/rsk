import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>;
type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>;
type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

type TabsComponent = typeof TabsPrimitive.Root & {
  List: FC<TabsListProps>;
  Trigger: FC<TabsTriggerProps>;
  Content: FC<TabsContentProps>;
};

const tabsListVariants = cva('inline-flex items-center justify-center rounded-2xl p-1 gap-1', {
  variants: {
    variant: {
      default: 'bg-transparent text-foreground w-full border border-muted-200',
      compact: 'w-auto',
      plain: 'text-foreground bg-transparent',
      compactPlain: 'w-auto text-foreground bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const tabsTriggerVariants = cva(
  `
  inline-flex cursor-pointer items-center justify-center rounded-[inherit] px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors
  focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50
  data-[state=active]:bg-primary data-[state=active]:font-bold data-[state=active]:text-surface hover:bg-primary-15 hover:text-foreground
  `,
  {
    variants: {
      variant: {
        default: 'grow',
        fitContent: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const List: FC<TabsListProps> = ({ className, variant, ...props }) => (
  <TabsPrimitive.List data-slot="tabs-list" className={cn(tabsListVariants({ variant }), className)} {...props} />
);

const Trigger: FC<TabsTriggerProps> = ({ className, variant, ...props }) => (
  <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn(tabsTriggerVariants({ variant }), className)} {...props} />
);

const Content: FC<TabsContentProps> = ({ className, ...props }) => (
  <TabsPrimitive.Content data-slot="tabs-content" className={cn('mt-2 focus-visible:outline-none', className)} {...props} />
);

const Tabs: TabsComponent = TabsPrimitive.Root as unknown as TabsComponent;

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Content = Content;

export default Tabs;
