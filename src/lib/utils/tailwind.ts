import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...classList: ClassValue[]): string => twMerge(clsx(classList));

export const FOCUS_RING =
  'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none';

export const DISABLED_STYLES =
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

export const TRANSITION_DEFAULT = 'transition-colors duration-200 ease-out';
