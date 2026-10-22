'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type CalendarEventTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

/** Soft tint + status dot (addendum §10). Text stays `fg` on every tone; tone is never a side stripe. */
const calendarEventVariants = cva(
  'text-fg flex size-full min-w-0 items-start gap-1.5 overflow-hidden rounded-md px-1.5 py-1 text-start text-xs leading-tight',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-sunken',
        accent: 'bg-accent-subtle',
        info: 'bg-info-subtle',
        success: 'bg-success-subtle',
        warning: 'bg-warning-subtle',
        danger: 'bg-danger-subtle',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

const DOT: Record<CalendarEventTone, string> = {
  neutral: 'bg-fg-muted',
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export type CalendarEventProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof calendarEventVariants> & {
    /** Mutes an event that has already ended. */
    past?: boolean;
  };

const CalendarEvent: FC<CalendarEventProps> = ({ className, tone, past = false, children, ...props }) => {
  const resolvedTone = tone ?? 'neutral';

  return (
    <div
      data-slot="calendar-event"
      data-tone={resolvedTone}
      data-past={past || undefined}
      className={cn(calendarEventVariants({ tone: resolvedTone }), className)}
      {...props}
    >
      <span aria-hidden="true" className={cn('mt-1 size-1.5 shrink-0 rounded-full', DOT[resolvedTone])} />

      <span className={cn('min-w-0 truncate', past && 'decoration-fg-muted line-through')}>{children}</span>
    </div>
  );
};

export default CalendarEvent;
