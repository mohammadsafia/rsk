'use client';

import { Children, type ReactNode, useCallback, useId, useState } from 'react';

import { Button, type ButtonVariants, Dialog, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { AlertTriangle, CheckCircle, Info, XCircle, XIcon } from 'lucide-react';

import { confirmDialogIconVariants } from './variants';

export type ConfirmDialogTone = 'danger' | 'warning' | 'success' | 'info';

export type ConfirmDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Meaning of the action; carried by the icon and the confirm button. @default 'danger' */
  tone?: ConfirmDialogTone;
  /** Overrides the auto-mapped button tone. */
  primaryTone?: ButtonVariants['tone'];
  title?: ReactNode;
  description?: ReactNode;
  /** @default 'Confirm' */
  confirmLabel?: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  children?: ReactNode | [ReactNode] | [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode];
  className?: string;
  /** When provided, the consumer manages spinner and close. When omitted, the component auto-manages both. */
  loading?: boolean;
  /** Escape and outside clicks close the dialog only when true; a ✕ is always shown. @default false */
  dismissible?: boolean;
  /** Supports async — return a `Promise` for auto-spinner and auto-close on resolve. */
  onConfirm?: () => void | Promise<unknown>;
};

const TONE_ICON: Record<ConfirmDialogTone, typeof AlertTriangle> = {
  warning: AlertTriangle,
  success: CheckCircle,
  danger: XCircle,
  info: Info,
};

const TONE_BUTTON: Record<ConfirmDialogTone, ButtonVariants['tone']> = {
  danger: 'danger',
  success: 'neutral',
  warning: 'neutral',
  info: 'neutral',
};

/**
 * # ConfirmDialog
 *
 * Confirmation dialog with tone styling, async-aware confirm, and dismissible control.
 * Built on `Dialog.Content` (Radix).
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
 * ## Tone → Button
 *
 * `danger → danger`; `success`, `warning`, `info` → `neutral`. Override with `primaryTone`.
 *
 * @see {@link ConfirmDialogProps} for prop details and defaults.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  tone = 'danger',
  primaryTone,
  title,
  description,
  confirmLabel,
  cancelLabel,
  children,
  className,
  loading,
  dismissible = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useAppTranslation('common');

  const resolvedConfirmLabel = confirmLabel ?? t('confirmDialog.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('confirmDialog.cancel');

  const [internalOpen, setInternalOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const isLoading = loading ?? internalLoading;
  const Icon = TONE_ICON[tone];
  const descriptionId = useId();

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

      <Dialog.Content
        title={title ?? resolvedConfirmLabel}
        hideTitle
        size="sm"
        dismissible={dismissible}
        {...(description ? { 'aria-describedby': descriptionId } : {})}
        className={className}
      >
        {/* Escape and outside clicks stay blocked when not dismissible, but a visible ✕ always offers a way out (e.g. after a failed async confirm). */}
        <Conditional.If condition={!dismissible}>
          <Dialog.Close asChild>
            <IconButton size="sm" tooltip={false} aria-label={t('close')} className="absolute end-3 top-3">
              <XIcon />
            </IconButton>
          </Dialog.Close>
        </Conditional.If>

        <Conditional.If condition={!!title}>
          <div className="flex flex-col items-center gap-y-1.5 text-center">
            <Icon className={confirmDialogIconVariants({ tone })} size={48} />

            <p aria-hidden="true" className="text-fg text-md font-semibold">
              {title}
            </p>

            <Conditional.If condition={!!description}>
              <p id={descriptionId} className="text-fg-muted text-sm">
                {description}
              </p>
            </Conditional.If>
          </div>
        </Conditional.If>

        <Conditional.If condition={!!content}>
          <div className="flex flex-col items-center">{content}</div>
        </Conditional.If>

        <Dialog.Footer className="justify-center">
          <Conditional>
            <Conditional.If condition={!!actions}>{actions}</Conditional.If>

            <Conditional.Else>
              <Conditional.If condition={tone !== 'success' && tone !== 'info'}>
                <Dialog.Close asChild>
                  <Button variant="outline" size="lg">
                    {resolvedCancelLabel}
                  </Button>
                </Dialog.Close>
              </Conditional.If>

              <Button tone={primaryTone ?? TONE_BUTTON[tone]} size="lg" loading={isLoading} onClick={handleConfirm}>
                {resolvedConfirmLabel}
              </Button>
            </Conditional.Else>
          </Conditional>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

export default ConfirmDialog;
