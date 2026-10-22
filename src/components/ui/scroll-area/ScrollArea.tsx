'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@utils';

type ScrollBarProps = ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>;

type ScrollAreaProps = ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
  orientation?: 'vertical' | 'horizontal';
  viewportClassName?: string;
};

type ScrollAreaComponent = FC<ScrollAreaProps> & {
  Bar: FC<ScrollBarProps>;
};

const Bar: FC<ScrollBarProps> = ({ className, orientation = 'vertical', ...props }) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    data-slot="scroll-area-bar"
    orientation={orientation}
    className={cn(
      'flex touch-none transition-colors select-none',
      'data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in duration-fast',
      orientation === 'vertical' && 'h-full w-1.5 border-s border-s-transparent p-px',
      orientation === 'horizontal' && 'h-1.5 flex-col border-t border-t-transparent p-px',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb data-slot="scroll-area-thumb" className="bg-border-strong relative flex-1 rounded-full" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
);

const ScrollArea: ScrollAreaComponent = ({ orientation = 'vertical', className, viewportClassName, children, ...props }) => (
  <ScrollAreaPrimitive.Root
    data-slot="scroll-area"
    className={cn('relative overflow-hidden', orientation === 'vertical' && '[&>[data-slot=scroll-area-viewport]>div]:block!', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      data-slot="scroll-area-viewport"
      // Focusable so keyboard users can reach and scroll it (WCAG 2.1.1).
      tabIndex={0}
      className={cn('focus-ring h-full w-full rounded-[inherit]', viewportClassName)}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>

    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
);

ScrollArea.Bar = Bar;

ScrollArea.displayName = 'ScrollArea';
Bar.displayName = 'ScrollArea.Bar';

export default ScrollArea;
