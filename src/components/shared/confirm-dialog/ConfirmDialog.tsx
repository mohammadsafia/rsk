import { Children, type ReactNode, useCallback, useState } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { type ButtonVariants, Dialog } from '@components/ui';
import { Conditional } from '@components/utils';
import { LoadingButton } from '@components/shared';

import { cn } from '@utils';

import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export type ConfirmDialogVariants = VariantProps<typeof confirmDialogVariants>;

type ConfirmDialogVariant = NonNullable<ConfirmDialogVariants['variant']>;

export type ConfirmDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** @default 'destructive' */
  variant?: ConfirmDialogVariant;
  /** Overrides the auto-mapped button variant. @see {@link confirmDialogVariantToButtonVariantMapping} */
  primaryVariant?: ButtonVariants['variant'];
  title?: ReactNode;
  description?: ReactNode;
  /** @default 'Confirm' */
  confirmLabel?: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  children?: ReactNode | [ReactNode] | [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode];
  className?: string;
  /** When provided, the consumer manages spinner and close. When omitted, the component auto-manages both. @default undefined */
  loading?: boolean;
  /**
   * Controls overlay click and escape key dismissal.
   * @default false
   * */
  dismissible?: boolean;
  /** Supports async — return a `Promise` for auto-spinner and auto-close on resolve. */
  onConfirm?: () => void | Promise<void>;
};

const confirmDialogVariantToIconsMapping: Record<ConfirmDialogVariant, typeof AlertTriangle> = {
  warning: AlertTriangle,
  success: CheckCircle,
  destructive: XCircle,
  info: Info,
};

const confirmDialogVariantToButtonVariantMapping: Record<ConfirmDialogVariant, ButtonVariants['variant']> = {
  destructive: 'destructive',
  success: 'success',
  warning: 'default',
  info: 'default',
};

export const confirmDialogIconVariants = cva('mb-4', {
  variants: {
    variant: {
      warning: 'text-warning',
      success: 'text-success',
      destructive: 'text-destructive',
      info: 'text-primary',
    },
  },
  defaultVariants: {
    variant: 'destructive',
  },
});

export const confirmDialogVariants = cva('border-t-4', {
  variants: {
    variant: {
      warning: 'border-t-warning',
      success: 'border-t-success',
      destructive: 'border-t-destructive',
      info: 'border-t-primary',
    },
  },
  defaultVariants: {
    variant: 'destructive',
  },
});

/**
 * # ConfirmDialog
 *
 * Confirmation dialog with variant styling, async-aware confirm, and dismissible control.
 * Built on `Dialog.Panel` (Radix).
 *
 * ## Children (Dual Mode)
 *
 * - **Uncontrolled** (no `open` prop): `[trigger, ?content, ?actions]`
 * - **Controlled** (`open` provided): `[?content, ?actions]`
 *
 * ## Close Behavior (`loading` prop)
 *
 * - `loading` **not provided** → Auto-managed: sync closes immediately, async (`Promise`) shows spinner and closes on resolve, stays open on reject.
 * - `loading` **provided** → Consumer-managed: consumer controls the spinner display and close timing via `onOpenChange`.
 *
 * ## Variant → Button Mapping
 *
 * The confirm button variant is auto-mapped from the dialog variant:
 * `destructive → destructive`, `success → success`, `warning → default`, `info → default`.
 * Override with `primaryVariant`.
 *
 * @see {@link ConfirmDialogProps} for prop details and defaults.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  variant = 'destructive',
  primaryVariant,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  children,
  className,
  loading,
  dismissible = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const isLoading = loading ?? internalLoading;
  const Icon = confirmDialogVariantToIconsMapping[variant];

  const childrenArray = Children.toArray(children);

  // In controlled mode: 1st child = content, 2nd child = actions (no trigger needed)
  // In uncontrolled mode: 1st child = trigger, 2nd child = content, 3rd child = actions
  const trigger = isControlled ? null : childrenArray[0];
  const content = isControlled ? childrenArray[0] : childrenArray[1];
  const actions = isControlled ? childrenArray[1] : childrenArray[2];

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) {
      setOpen(false);
      return;
    }

    const result = onConfirm();

    // External loading prop = consumer manages close
    if (loading !== undefined) return;

    if (result && typeof (result as Promise<void>).then === 'function') {
      setInternalLoading(true);
      try {
        await result;
        setOpen(false);
      } finally {
        setInternalLoading(false);
      }
    } else {
      setOpen(false);
    }
  }, [onConfirm, loading, setOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <Conditional.If condition={!isControlled && !!trigger}>
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      </Conditional.If>

      <Dialog.Panel
        className={cn(confirmDialogVariants({ variant }), className)}
        onInteractOutside={(e) => !dismissible && e.preventDefault()}
        onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
      >
        <Dialog.Close
          aria-label="Close"
          className="absolute end-4 top-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
        >
          <X size={18} />
        </Dialog.Close>

        <Conditional.If condition={!!title}>
          <Dialog.Header className="flex flex-col items-center gap-y-1.5">
            <Icon className={confirmDialogIconVariants({ variant })} size={48} />

            <Dialog.Title>{title}</Dialog.Title>

            <Conditional.If condition={!!description}>
              <Dialog.Description>{description}</Dialog.Description>
            </Conditional.If>
          </Dialog.Header>
        </Conditional.If>

        <Conditional.If condition={!!content}>
          <Dialog.Content className="flex flex-col items-center">{content}</Dialog.Content>
        </Conditional.If>

        <Dialog.Footer className="space-x-2 text-center">
          <Conditional>
            <Conditional.If condition={!!actions}>{actions}</Conditional.If>

            <Conditional.Else>
              <Conditional.If condition={variant !== 'success' && variant !== 'info'}>
                <Dialog.Close asChild>
                  <LoadingButton variant="muted" size="lg">
                    {cancelLabel}
                  </LoadingButton>
                </Dialog.Close>
              </Conditional.If>

              <LoadingButton
                variant={primaryVariant ?? confirmDialogVariantToButtonVariantMapping[variant]}
                size="lg"
                loading={isLoading}
                onClick={handleConfirm}
              >
                {confirmLabel}
              </LoadingButton>
            </Conditional.Else>
          </Conditional>
        </Dialog.Footer>
      </Dialog.Panel>
    </Dialog>
  );
}

export default ConfirmDialog;
