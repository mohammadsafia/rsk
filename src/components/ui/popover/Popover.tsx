import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type ReactElement } from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@utils';

/** The raised floating surface shared by Popover, DropdownMenu, Select and Toast (addendum §8). */
export const floatingSurfaceClassName = 'bg-surface-raised text-fg shadow-raised z-50 rounded-lg outline-none';

/**
 * Enter/exit motion for Radix floating layers: unfold from the trigger corner (scale 0.9 on the spring), leave fast.
 * Reduced motion keeps only the fade.
 */
export const floatingMotionClassName = [
  // transition-none: the duration utilities also set transition-duration, and transform-origin would otherwise
  // transition from the centre while Radix positions the layer.
  'transition-none data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:duration-spring data-[state=open]:ease-spring data-[state=closed]:duration-instant data-[state=closed]:ease-in',
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
  'data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-96',
  'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
  'motion-reduce:data-[state=open]:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100',
].join(' ');

type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;

type PopoverContentProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

type PopoverProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
  children: Array<ReactElement<PopoverTriggerProps, FC<PopoverTriggerProps>> | ReactElement<PopoverContentProps, FC<PopoverContentProps>>>;
};

type PopoverComponent = FC<PopoverProps> & {
  Trigger: FC<PopoverTriggerProps>;
  Content: FC<PopoverContentProps>;
};

const PopoverTrigger: FC<PopoverTriggerProps> = (props) => <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;

const PopoverContent: FC<PopoverContentProps> = ({ className, align = 'center', sideOffset = 4, ...props }) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(floatingSurfaceClassName, floatingMotionClassName, 'origin-(--radix-popover-content-transform-origin) p-3', className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

const Popover: PopoverComponent = (props) => <PopoverPrimitive.Root data-slot="popover" {...props} />;

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Popover.Trigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>((props, ref) => PopoverTrigger({ ...props, ref }));
Popover.Content = PopoverContent;

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export default Popover;
