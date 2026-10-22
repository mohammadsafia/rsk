'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Loader2Icon } from 'lucide-react';

const spinnerVariants = cva('text-fg-muted animate-spin motion-reduce:animate-none', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type SpinnerProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  VariantProps<typeof spinnerVariants> & {
    /** Screen-reader text. @default t('loading') */
    label?: string;
    /** Cover the nearest positioned ancestor with a scrim. */
    overlay?: boolean;
    /** With `overlay`: cover the viewport instead. */
    fixed?: boolean;
  };

const Spinner: FC<SpinnerProps> = ({ className, size, label, overlay = false, fixed = false, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <div
      role="status"
      data-slot="spinner"
      data-overlay={overlay || undefined}
      className={cn(
        'inline-flex items-center justify-center',
        overlay && 'bg-canvas/70 inset-0 z-50 flex',
        overlay && (fixed ? 'fixed' : 'absolute'),
        className,
      )}
      {...props}
    >
      <Loader2Icon aria-hidden="true" className={spinnerVariants({ size })} />

      <span className="sr-only">{label ?? t('loading')}</span>
    </div>
  );
};

Spinner.displayName = 'Spinner';

export default Spinner;
