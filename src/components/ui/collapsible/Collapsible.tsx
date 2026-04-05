import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';

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
      'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden transition-all',
      className,
    )}
    {...props}
  />
);

const Collapsible: CollapsibleComponent = (props) => <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Collapsible.Trigger = forwardRef<HTMLButtonElement, CollapsibleTriggerProps>((props, ref) => CollapsibleTrigger({ ...props, ref }));
Collapsible.Content = CollapsibleContent;

Collapsible.Trigger.displayName = 'CollapsibleTrigger';
Collapsible.Content.displayName = 'CollapsibleContent';
Collapsible.displayName = 'Collapsible';

export default Collapsible;
