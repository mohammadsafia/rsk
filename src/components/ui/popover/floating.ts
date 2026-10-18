// The floating-surface class names on their own, so Toast, DropdownMenu and Select read them without loading Radix Popover.

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
