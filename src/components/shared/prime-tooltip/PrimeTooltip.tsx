import { Children, type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, isValidElement, type ReactNode } from 'react';

import { Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

type PrimeTooltipTriggerProps = ComponentProps<typeof Tooltip.Trigger>;

type PrimeTooltipItemProps = ComponentPropsWithoutRef<'div'> & {
  icon?: ReactNode;
};

export type PrimeTooltipProps = ComponentPropsWithoutRef<typeof Tooltip> &
  Omit<ComponentPropsWithoutRef<typeof Tooltip.Content>, 'content'> & {
    content?: ReactNode;
  };

type PrimeTooltipComponent = FC<PrimeTooltipProps> & {
  Trigger: FC<PrimeTooltipTriggerProps>;
  Item: FC<PrimeTooltipItemProps>;
};

const Trigger: FC<PrimeTooltipTriggerProps> = ({ ref, className, ...props }) => (
  <Tooltip.Trigger
    ref={ref}
    className={cn(className)}
    onClick={(event) => event.preventDefault()}
    onPointerDown={(event) => event.preventDefault()}
    {...props}
  />
);

const Item: FC<PrimeTooltipItemProps> = ({ className, icon, children, ...props }) => (
  <div
    data-slot="prime-tooltip-item"
    className={cn('border-primary-400 flex items-center gap-2 border-s-2 ps-2 font-medium', className)}
    {...props}
  >
    {icon && <span className="flex items-center">{icon}</span>}

    <span className="flex-1">{children}</span>
  </div>
);

const PrimeTooltip: PrimeTooltipComponent = ({
  content,
  children,
  className,
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  disableHoverableContent,
  ...contentProps
}) => {
  const childArray = Children.toArray(children);

  const triggerChild = childArray.find((child) => isValidElement(child) && child.type === PrimeTooltip.Trigger);

  const otherChildren = childArray.filter((child) => !(isValidElement(child) && child.type === PrimeTooltip.Trigger));

  const tooltipContent = triggerChild ? (otherChildren.length > 0 ? otherChildren : content) : content;

  return (
    <Tooltip.Provider>
      <Tooltip
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
        disableHoverableContent={disableHoverableContent}
      >
        <Conditional>
          <Conditional.If condition={!!triggerChild}>{triggerChild}</Conditional.If>

          <Conditional.Else>
            <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
          </Conditional.Else>
        </Conditional>

        <Tooltip.Content
          className={cn('grid gap-y-1 md:max-w-[30dvw]', className)}
          hidden={!tooltipContent}
          onPointerDownOutside={(event) => event.preventDefault()}
          {...contentProps}
        >
          {tooltipContent}
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
PrimeTooltip.Trigger = forwardRef<HTMLButtonElement, PrimeTooltipTriggerProps>((props, ref) => Trigger({ ...props, ref }));
PrimeTooltip.Item = Item;

PrimeTooltip.Trigger.displayName = 'PrimeTooltipTrigger';
Item.displayName = 'PrimeTooltipItem';

export default PrimeTooltip;
