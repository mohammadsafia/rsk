import { type ComponentProps, type FC, type MouseEvent, type PointerEvent } from 'react';

import { Slot, Slottable } from '@radix-ui/react-slot';

import { Conditional } from '@components/utils';

import { useInkBleed } from '@hooks/motion';
import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Loader2Icon } from 'lucide-react';

export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent font-medium whitespace-nowrap select-none',
    'focus-ring state-press [&_svg]:size-4 [&_svg]:shrink-0',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        solid: '',
        outline: 'bg-transparent',
        ghost: 'bg-transparent',
        link: 'h-auto! px-0! underline-offset-4 hover:underline',
      },
      tone: {
        neutral: '',
        accent: '',
        danger: '',
      },
      size: {
        sm: 'h-control-sm px-2.5 text-xs',
        md: 'h-control-md px-3 text-sm',
        lg: 'h-control-lg px-4 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'solid', tone: 'neutral', className: 'bg-fg text-fg-inverse hover:bg-fg-hover active:bg-fg-pressed' },
      { variant: 'solid', tone: 'accent', className: 'bg-accent text-accent-fg hover:bg-accent-hover' },
      { variant: 'solid', tone: 'danger', className: 'bg-danger text-danger-fg hover:bg-danger-hover' },
      { variant: 'outline', tone: 'neutral', className: 'border-border-strong text-fg hover:bg-hover' },
      { variant: 'outline', tone: 'accent', className: 'border-accent text-accent hover:bg-hover' },
      { variant: 'outline', tone: 'danger', className: 'border-danger text-danger hover:bg-hover' },
      {
        variant: 'ghost',
        tone: 'neutral',
        className: 'text-fg-muted hover:bg-hover hover:text-fg underline decoration-border-strong underline-offset-4',
      },
      { variant: 'ghost', tone: 'accent', className: 'text-accent hover:bg-hover' },
      { variant: 'ghost', tone: 'danger', className: 'text-danger hover:bg-hover' },
      { variant: 'link', tone: 'neutral', className: 'text-fg' },
      { variant: 'link', tone: 'accent', className: 'text-accent' },
      { variant: 'link', tone: 'danger', className: 'text-danger' },
    ],
    defaultVariants: {
      variant: 'solid',
      tone: 'neutral',
      size: 'md',
      fullWidth: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

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
