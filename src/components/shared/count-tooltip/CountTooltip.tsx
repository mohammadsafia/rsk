import {
  Children,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  createContext,
  type FC,
  forwardRef,
  isValidElement,
  useContext,
} from 'react';

import PrimeTooltip, { type PrimeTooltipProps } from '@components/shared/prime-tooltip/PrimeTooltip';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

type CountTooltipContextType = {
  count: number;
};

type CountTooltipTriggerProps = ComponentProps<'span'>;

type CountTooltipItemProps = ComponentPropsWithoutRef<typeof PrimeTooltip.Item>;

type CountTooltipProps = PrimeTooltipProps & {
  count: number;
  condition?: boolean;
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
    <span
      ref={ref}
      data-slot="count-tooltip-trigger"
      className={cn('bg-muted-100 inline-flex items-center justify-center rounded-full px-1.5 text-xs', className)}
      {...props}
    >
      {children ?? `+${count}`}
    </span>
  );
};

const Item: FC<CountTooltipItemProps> = (props) => <PrimeTooltip.Item {...props} />;

const CountTooltip: CountTooltipComponent = ({ count, condition = true, children, ...props }) => {
  const childArray = Children.toArray(children);

  const triggerChild = childArray.find((child) => isValidElement(child) && child.type === CountTooltip.Trigger);

  const otherChildren = childArray.filter((child) => !(isValidElement(child) && child.type === CountTooltip.Trigger));

  if (!condition) return null;

  return (
    <CountTooltipContext.Provider value={{ count }}>
      <Conditional>
        <Conditional.If condition={!!triggerChild}>
          <PrimeTooltip {...props}>
            <PrimeTooltip.Trigger>{triggerChild}</PrimeTooltip.Trigger>
            {otherChildren}
          </PrimeTooltip>
        </Conditional.If>

        <Conditional.Else>
          <PrimeTooltip content={childArray.length > 1 ? childArray.slice(1) : undefined} {...props}>
            {childArray[0]}
          </PrimeTooltip>
        </Conditional.Else>
      </Conditional>
    </CountTooltipContext.Provider>
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
CountTooltip.Trigger = forwardRef<HTMLSpanElement, CountTooltipTriggerProps>((props, ref) => Trigger({ ...props, ref }));
CountTooltip.Item = Item;

CountTooltip.Trigger.displayName = 'CountTooltipTrigger';
Item.displayName = 'CountTooltipItem';

export default CountTooltip;
