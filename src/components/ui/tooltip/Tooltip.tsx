import { type ComponentPropsWithoutRef, type ComponentPropsWithRef, type FC } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@utils';

type ProviderProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;
type TriggerProps = ComponentPropsWithRef<typeof TooltipPrimitive.Trigger>;
type ContentProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;

type TooltipComponent = typeof TooltipPrimitive.Root & {
  Provider: typeof Provider;
  Trigger: typeof Trigger;
  Content: typeof Content;
};

const Provider: FC<ProviderProps> = (props) => <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;

const Trigger: FC<TriggerProps> = (props) => <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;

const Content: FC<ContentProps> = ({ className, sideOffset = 4, ...props }) => (
  <TooltipPrimitive.Content
    data-slot="tooltip-content"
    sideOffset={sideOffset}
    className={cn(
      'bg-background text-foreground border-muted-100 z-50 overflow-hidden rounded-md border px-3 py-1.5 text-xs shadow',
      'animate-in fade-in-0 zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
      className,
    )}
    {...props}
  />
);

const Tooltip = TooltipPrimitive.Root as TooltipComponent;

Tooltip.Provider = Provider;
Tooltip.Trigger = Trigger;
Tooltip.Content = Content;

Content.displayName = TooltipPrimitive.Content.displayName;

export default Tooltip;
