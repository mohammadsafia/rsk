import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type ReactElement } from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@utils';

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
      className={cn(
        'border-muted-200 bg-popover text-popover-foreground z-50 rounded-md border p-4 shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

const Popover: PopoverComponent = (props) => <PopoverPrimitive.Root data-slot="popover" {...props} />;

Popover.Trigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>((props, ref) => PopoverTrigger({ ...props, ref }));
Popover.Content = PopoverContent;

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export default Popover;
