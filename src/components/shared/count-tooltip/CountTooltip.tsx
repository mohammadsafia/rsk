'use client';

import {
  Children,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  createContext,
  type FC,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
} from 'react';

import { Tooltip, type TooltipProps } from '@components/ui';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

type CountTooltipContextType = {
  count: number;
};

type CountTooltipTriggerProps = ComponentProps<'button'>;

type CountTooltipItemProps = ComponentPropsWithoutRef<'div'> & { icon?: ReactNode };

type CountTooltipProps = Omit<TooltipProps, 'content' | 'children'> & {
  count: number;
  condition?: boolean;
  children: ReactNode;
};

type CountTooltipComponent = FC<CountTooltipProps> & {
  Trigger: FC<CountTooltipTriggerProps>;
  Item: FC<CountTooltipItemProps>;
};

const CountTooltipContext = createContext<CountTooltipContextType | null>(null);

const useCountTooltipContext = () => {
  const context = useContext(CountTooltipContext);

  if (!context) throw new Error('CountTooltip sub-components must be used within CountTooltip');

  return context;
};

const Trigger: FC<CountTooltipTriggerProps> = ({ ref, className, children, ...props }) => {
  const { count } = useCountTooltipContext();

  return (
    // A button, so the hidden names are reachable by keyboard (focus opens the tooltip).
    <button
      ref={ref}
      type="button"
      data-slot="count-tooltip-trigger"
      className={cn('bg-hover text-fg-muted focus-ring inline-flex items-center justify-center rounded-full px-1.5 text-xs', className)}
      {...props}
    >
      {children ?? `+${count}`}
    </button>
  );
};

const Item: FC<CountTooltipItemProps> = ({ className, icon, children, ...props }) => (
  <div data-slot="count-tooltip-item" className={cn('flex items-center gap-2', className)} {...props}>
    <Conditional.If condition={!!icon}>
      <span className="flex items-center">{icon}</span>
    </Conditional.If>

    <span className="flex-1">{children}</span>
  </div>
);

const CountTooltip: CountTooltipComponent = ({ count, condition = true, children, ...props }) => {
  const childArray = Children.toArray(children);

  const triggerChild = childArray.find((child) => isValidElement(child) && child.type === CountTooltip.Trigger);

  // Without an explicit Trigger, the first child is the trigger and the rest is content (unchanged behaviour).
  const trigger = (triggerChild ?? childArray[0]) as ReactElement;
  const items = triggerChild ? childArray.filter((child) => child !== triggerChild) : childArray.slice(1);

  if (!condition) return null;

  return (
    <CountTooltipContext.Provider value={{ count }}>
      <Tooltip content={items.length > 0 ? <div className="grid gap-1">{items}</div> : null} {...props}>
        {trigger}
      </Tooltip>
    </CountTooltipContext.Provider>
  );
};

CountTooltip.Trigger = Trigger;
CountTooltip.Item = Item;

CountTooltip.Trigger.displayName = 'CountTooltipTrigger';
Item.displayName = 'CountTooltipItem';

export default CountTooltip;
