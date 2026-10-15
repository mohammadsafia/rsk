import { type ComponentPropsWithoutRef, type FC, type ReactElement, type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type RootProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>;
type ContentProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;
type ProviderProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;

export type TooltipProps = Pick<RootProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'delayDuration' | 'disableHoverableContent'> &
  Pick<ContentProps, 'side' | 'align' | 'sideOffset' | 'className'> & {
    content: ReactNode;
    /** Renders only the trigger, with no tooltip behaviour. */
    disabled?: boolean;
    /** The trigger. Must accept a ref and spread props (Radix `asChild`). */
    children: ReactElement;
  };

type TooltipComponent = FC<TooltipProps> & {
  Provider: FC<ProviderProps>;
};

const Provider: FC<ProviderProps> = (props) => <TooltipPrimitive.Provider {...props} />;

const Tooltip: TooltipComponent = ({ content, disabled = false, side, align, sideOffset = 4, className, children, ...rootProps }) => {
  const hasContent = content !== null && content !== undefined && content !== false && content !== '';

  return (
    <Conditional>
      <Conditional.If condition={disabled || !hasContent}>{children}</Conditional.If>

      <Conditional.Else>
        <TooltipPrimitive.Root {...rootProps}>
          <TooltipPrimitive.Trigger asChild data-slot="tooltip-trigger">
            {children}
          </TooltipPrimitive.Trigger>

          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              data-slot="tooltip-content"
              side={side}
              align={align}
              sideOffset={sideOffset}
              className={cn(
                'bg-fg text-fg-inverse z-50 max-w-xs rounded-md px-2 py-1 text-xs',
                'animate-in fade-in-0 zoom-in-98 duration-fast motion-reduce:zoom-in-100',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                className,
              )}
            >
              {content}
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </Conditional.Else>
    </Conditional>
  );
};

Tooltip.Provider = Provider;

Provider.displayName = 'TooltipProvider';
Tooltip.displayName = 'Tooltip';

export default Tooltip;
