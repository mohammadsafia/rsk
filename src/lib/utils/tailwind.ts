import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** tailwind-merge with the kit's motion scale (duration-instant…roll, ease-spring), so a later token replaces an earlier one. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { ease: ['spring'] },
    classGroups: { duration: [{ duration: ['instant', 'fast', 'base', 'exit', 'slow', 'spring', 'spring-long', 'roll'] }] },
  },
});

export const cn = (...classList: ClassValue[]): string => twMerge(clsx(classList));

export const FOCUS_RING =
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none';

export const DISABLED_STYLES =
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

export const TRANSITION_DEFAULT = 'transition-colors duration-base ease-out';
