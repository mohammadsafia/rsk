'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode, useState } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { Button } from '@components/ui';
import { ConfirmDialog } from '@components/shared';
import { Conditional } from '@components/utils';

import { useKitNavigate } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

export type FormContainerActionsProps = ComponentPropsWithoutRef<'div'> & {
  /** @default t('save') */
  submitLabel?: ReactNode;
  /** @default t('cancel') */
  cancelLabel?: ReactNode;
  /** @default navigate(-1) */
  onCancel?: () => void;
  hideCancel?: boolean;
  /** Ask before cancelling — only when the form has unsaved changes. */
  confirmOnCancel?: boolean;
  /** Pin the row to the bottom of a scrolling form. */
  sticky?: boolean;
};

/** Footer row for a FormContainer: extra actions (children), Cancel, then Submit (loading while submitting). */
const FormContainerActions: FC<FormContainerActionsProps> = ({
  className,
  submitLabel,
  cancelLabel,
  onCancel,
  hideCancel = false,
  confirmOnCancel = false,
  sticky = false,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  const navigate = useKitNavigate();
  // useFormState subscribes to these flags, so the actions re-render when they change (a compiled component reading
  // formState through the context proxy would keep its first values).
  const { control } = useFormContext();
  const { isSubmitting, isDirty } = useFormState({ control });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const cancel = onCancel ?? (() => navigate(-1));

  const handleCancelClick = () => {
    if (confirmOnCancel && isDirty) {
      setIsConfirmOpen(true);
      return;
    }
    cancel();
  };

  return (
    <div
      data-slot="form-actions"
      className={cn(
        'flex items-center justify-end gap-2 pt-2',
        sticky && 'bg-canvas border-border-subtle sticky bottom-0 z-10 border-t py-3',
        className,
      )}
      {...props}
    >
      {children}

      <Conditional.If condition={!hideCancel}>
        <Button type="button" variant="outline" onClick={handleCancelClick}>
          {cancelLabel ?? t('cancel')}
        </Button>
      </Conditional.If>

      <Button type="submit" loading={isSubmitting}>
        {submitLabel ?? t('save')}
      </Button>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        tone="warning"
        title={t('form.discardTitle')}
        description={t('form.discardDescription')}
        confirmLabel={t('form.discardConfirm')}
        cancelLabel={t('form.keepEditing')}
        onConfirm={cancel}
      >
        {null}
      </ConfirmDialog>
    </div>
  );
};

export default FormContainerActions;
