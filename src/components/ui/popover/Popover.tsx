'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC, type ReactElement } from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@utils';

import { floatingMotionClassName, floatingSurfaceClassName } from './floating';

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

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export default Popover;
