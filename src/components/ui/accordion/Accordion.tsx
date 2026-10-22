'use client';

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
        'focus-ring text-fg flex min-h-11 flex-1 cursor-pointer items-center justify-between gap-2 rounded-sm py-2 text-start text-sm font-medium [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}

      <ChevronDown
        aria-hidden="true"
        className="text-fg-muted duration-base size-4 shrink-0 transition-transform motion-reduce:transition-none"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

const Item: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>> = ({ className, ...props }) => (
  <AccordionPrimitive.Item data-slot="accordion-item" className={cn('border-border-subtle border-b', className)} {...props} />
);

const Content: FC<ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>> = ({ className, children, ...props }) => (
  <AccordionPrimitive.Content
    data-slot="accordion-content"
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:duration-base data-[state=closed]:duration-fast overflow-hidden text-sm transition-all motion-reduce:animate-none motion-reduce:transition-none"
    {...props}
  >
    <div className={cn('text-fg-muted pb-4 text-sm', className)}>{children}</div>
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
