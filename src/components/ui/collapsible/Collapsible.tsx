'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC } from 'react';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '@utils';

type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.Trigger>;
type CollapsibleContentProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>;
type CollapsibleProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>;

type CollapsibleComponent = FC<CollapsibleProps> & {
  Trigger: FC<CollapsibleTriggerProps>;
  Content: FC<CollapsibleContentProps>;
};

const CollapsibleTrigger: FC<CollapsibleTriggerProps> = ({ ref, className, ...props }) => (
  <CollapsiblePrimitive.Trigger ref={ref} data-slot="collapsible-trigger" className={cn('cursor-pointer', className)} {...props} />
);

const CollapsibleContent: FC<CollapsibleContentProps> = ({ className, ...props }) => (
  <CollapsiblePrimitive.Content
    data-slot="collapsible-content"
    className={cn(
      'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down data-[state=open]:duration-base data-[state=closed]:duration-fast overflow-hidden transition-all motion-reduce:animate-none motion-reduce:transition-none',
      className,
    )}
    {...props}
  />
);

const Collapsible: CollapsibleComponent = (props) => <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;

Collapsible.Trigger = CollapsibleTrigger;
Collapsible.Content = CollapsibleContent;

Collapsible.Trigger.displayName = 'CollapsibleTrigger';
Collapsible.Content.displayName = 'CollapsibleContent';
Collapsible.displayName = 'Collapsible';

export default Collapsible;
