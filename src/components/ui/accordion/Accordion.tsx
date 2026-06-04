import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';

import { cn } from '@utils';

import { ChevronDown } from 'lucide-react';

type AccordionComponent = typeof AccordionPrimitive.Root & {
  Trigger: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>>;
  Item: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>>;
  Content: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>>;
};

const Trigger: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>> = ({ className, children, ...props }) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}

      <ChevronDown className="bg-primary-400 text-background h-6 w-6 shrink-0 rounded-sm transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

const Item: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>> = ({ className, ...props }) => (
  <AccordionPrimitive.Item
    data-slot="accordion-item"
    className={cn(
      'bg-background border-b-muted border-b px-4 first:rounded-ss-md first:rounded-se-md last:rounded-ee-md last:rounded-es-md last:border-b-0',
      className,
    )}
    {...props}
  />
);

const Content: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>> = ({ className, children, ...props }) => (
  <AccordionPrimitive.Content
    data-slot="accordion-content"
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm transition-all"
    {...props}
  >
    <div className={cn('pt-0 pb-4', className)}>{children}</div>
  </AccordionPrimitive.Content>
);

const Accordion = AccordionPrimitive.Root as AccordionComponent;

Accordion.Trigger = Trigger;
Accordion.Item = Item;
Accordion.Content = Content;

Item.displayName = 'AccordionItem';
Trigger.displayName = AccordionPrimitive.Trigger.displayName;
Content.displayName = AccordionPrimitive.Content.displayName;

export default Accordion;
