import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn, FOCUS_RING, TRANSITION_DEFAULT } from '@utils';

type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>;
type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>;
type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;
type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

type TabsComponent = FC<TabsProps> & {
  List: FC<TabsListProps>;
  Trigger: FC<TabsTriggerProps>;
  Content: FC<TabsContentProps>;
};

const tabsListVariants = cva('flex items-center overflow-x-auto', {
  variants: {
    variant: {
      default: 'bg-background text-foreground w-full rounded-2xl border border-muted-200 p-1 gap-1',
      compact: 'w-fit bg-background rounded-2xl border border-muted-200 text-foreground p-1 gap-1',
      plain: 'text-foreground bg-transparent rounded-2xl p-1 gap-1',
      compactPlain: 'w-fit text-foreground bg-transparent rounded-2xl p-1 gap-1',
      underline: 'text-foreground bg-transparent border-b border-muted-200 rounded-none p-0 gap-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const tabsTriggerVariants = cva(
  `inline-flex cursor-pointer items-center justify-center text-sm font-medium whitespace-nowrap ${TRANSITION_DEFAULT} ${FOCUS_RING} disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: `grow flex gap-1 rounded-[inherit] px-3 py-2
          data-[state=active]:bg-primary data-[state=active]:font-bold data-[state=active]:text-primary-foreground hover:bg-primary-15 hover:text-foreground`,
        fitContent: `rounded-[inherit] px-3 py-2
          data-[state=active]:bg-primary data-[state=active]:font-bold data-[state=active]:text-primary-foreground hover:bg-primary-15 hover:text-foreground`,
        underline: `px-4 py-2.5 rounded-none border-b-2 border-transparent text-muted-400
          data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold
          hover:text-foreground`,
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
  <TabsPrimitive.Content data-slot="tabs-content" className={cn('mt-6 focus-visible:outline-none', className)} {...props} />
);

const Tabs: TabsComponent = (props) => <TabsPrimitive.Root data-slot="tabs" {...props} />;

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Content = Content;

export default Tabs;
