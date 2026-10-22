'use client';

import { type ComponentProps, type FC, type MouseEvent, type PointerEvent } from 'react';

import { Slot, Slottable } from '@radix-ui/react-slot';

import { Conditional } from '@components/utils';

import { useInkBleed } from '@hooks/motion';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Loader2Icon } from 'lucide-react';

import { buttonVariants, type ButtonVariants } from './variants';

export type ButtonProps = ComponentProps<'button'> &
  ButtonVariants & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button: FC<ButtonProps> = ({
  ref,
  className,
  variant,
  tone,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  disabled,
  children,
  onClick,
  onPointerDown,
  tabIndex,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const Comp = asChild ? Slot : 'button';
  const isDisabled = Boolean(disabled) || loading;
  const bleed = useInkBleed<HTMLButtonElement>();

  // A slotted child (e.g. a link) cannot be natively disabled, so block activation and tab focus by hand.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (asChild && isDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant ?? 'solid'}
      data-tone={tone ?? 'neutral'}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      disabled={asChild ? undefined : isDisabled}
      tabIndex={asChild && isDisabled ? -1 : tabIndex}
      onClick={handleClick}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        if (!isDisabled) bleed(event);
        onPointerDown?.(event);
      }}
      className={cn(buttonVariants({ variant, tone, size, fullWidth }), className)}
      {...props}
    >
      <Conditional.If condition={loading}>
        {/* Fades in over the label, which holds its width (invisible) underneath; the icon inside keeps spinning. */}
        <span
          data-slot="button-spinner-fade"
          className="animate-in fade-in-0 duration-fast absolute inset-0 flex items-center justify-center"
        >
          <Loader2Icon data-slot="button-spinner" className="animate-spin" aria-label={t('loading')} />
        </span>
      </Conditional.If>

      {/* Slot only finds a Slottable that is its direct child, so this branch can't go through Conditional.
          `contents` keeps the label's children in the flex layout; `invisible` holds their width while loading. */}
      {asChild ? (
        <Slottable>{children}</Slottable>
      ) : (
        <span data-slot="button-label" className={cn('contents', loading && 'invisible')}>
          {children}
        </span>
      )}
    </Comp>
  );
};

export default Button;
