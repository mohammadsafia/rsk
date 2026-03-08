import { type ComponentPropsWithoutRef, type ComponentPropsWithRef, type FC } from 'react';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '@utils';

type CollapsibleTriggerProps = ComponentPropsWithRef<typeof CollapsiblePrimitive.Trigger>;
type CollapsibleContentProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>;
type CollapsibleProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>;

type CollapsibleComponent = FC<CollapsibleProps> & {
  Trigger: FC<CollapsibleTriggerProps>;
  Content: FC<CollapsibleContentProps>;
};

const CollapsibleTrigger: FC<CollapsibleTriggerProps> = ({ className, ...props }) => {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" className={cn('cursor-pointer', className)} {...props} />;
};

const CollapsibleContent: FC<CollapsibleContentProps> = ({ className, ...props }) => {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className={cn(
        'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden transition-all',
        className,
      )}
      {...props}
    />
  );
};

const Collapsible: CollapsibleComponent = (props) => {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
};

Collapsible.Trigger = CollapsibleTrigger;
Collapsible.Content = CollapsibleContent;

export default Collapsible;
