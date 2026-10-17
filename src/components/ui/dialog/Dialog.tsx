import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { floatingMotionClassName, IconButton, SectionMarker, type SectionMarkerValue, SectionsReset } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { XIcon } from 'lucide-react';

const dialogContentVariants = cva(
  [
    'bg-surface-raised text-fg shadow-overlay rule-top rule-top-section fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[85dvh] -translate-y-1/2 flex-col gap-4',
    'overflow-y-auto rounded-lg p-5 outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type DialogProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
type DialogFooterProps = ComponentPropsWithoutRef<'footer'>;

export type DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> &
  VariantProps<typeof dialogContentVariants> & {
    title: ReactNode;
    /** Keeps the title for assistive tech but hides it visually. */
    hideTitle?: boolean;
    description?: ReactNode;
    /** When false: no close button, Escape and outside interaction are ignored. */
    dismissible?: boolean;
    /** Ledger mark before the title: § by default; false removes it. */
    marker?: SectionMarkerValue;
  };

type DialogComponent = FC<DialogProps> & {
  Trigger: FC<DialogTriggerProps>;
  Content: FC<DialogContentProps>;
  Footer: FC<DialogFooterProps>;
  Close: FC<DialogCloseProps>;
};

type EscapeKeyDownEvent = Parameters<NonNullable<DialogContentProps['onEscapeKeyDown']>>[0];
type InteractOutsideEvent = Parameters<NonNullable<DialogContentProps['onInteractOutside']>>[0];

const DialogTrigger: FC<DialogTriggerProps> = ({ ref, ...props }) => (
  <DialogPrimitive.Trigger ref={ref} data-slot="dialog-trigger" {...props} />
);

const DialogClose: FC<DialogCloseProps> = ({ ref, ...props }) => <DialogPrimitive.Close ref={ref} data-slot="dialog-close" {...props} />;

const DialogContent: FC<DialogContentProps> = ({
  ref,
  className,
  size,
  title,
  hideTitle = false,
  description,
  dismissible = true,
  marker = 'auto',
  onEscapeKeyDown,
  onInteractOutside,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const handleEscapeKeyDown = (event: EscapeKeyDownEvent) => {
    if (!dismissible) event.preventDefault();
    onEscapeKeyDown?.(event);
  };

  const handleInteractOutside = (event: InteractOutsideEvent) => {
    if (!dismissible) event.preventDefault();
    onInteractOutside?.(event);
  };

  // Radix warns unless a dialog without a Description opts out explicitly.
  const describedBy = description ? {} : { 'aria-describedby': undefined };

  return (
    <DialogPrimitive.Portal>
      <SectionsReset>
        <DialogPrimitive.Overlay
          data-slot="dialog-overlay"
          className={cn(
            'bg-overlay fixed inset-0 z-50 duration-slow',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />

        <DialogPrimitive.Content
          ref={ref}
          data-slot="dialog-content"
          data-size={size ?? 'md'}
          className={cn(dialogContentVariants({ size }), floatingMotionClassName, 'duration-slow', className)}
          onEscapeKeyDown={handleEscapeKeyDown}
          onInteractOutside={handleInteractOutside}
          {...describedBy}
          {...props}
        >
          <header data-slot="dialog-header" className={cn('flex flex-col gap-1 pe-8', hideTitle && !description && 'sr-only')}>
            <DialogPrimitive.Title data-slot="dialog-title" className={cn('text-fg text-md font-semibold', hideTitle && 'sr-only')}>
              <SectionMarker marker={marker} />
              {title}
            </DialogPrimitive.Title>

            <Conditional.If condition={!!description}>
              <DialogPrimitive.Description data-slot="dialog-description" className="text-fg-muted text-sm">
                {description}
              </DialogPrimitive.Description>
            </Conditional.If>
          </header>

          {children}

          <Conditional.If condition={dismissible}>
            <DialogPrimitive.Close asChild>
              <IconButton size="sm" tooltip={false} aria-label={t('close')} className="absolute end-3 top-3">
                <XIcon />
              </IconButton>
            </DialogPrimitive.Close>
          </Conditional.If>
        </DialogPrimitive.Content>
      </SectionsReset>
    </DialogPrimitive.Portal>
  );
};

const DialogFooter: FC<DialogFooterProps> = ({ className, ...props }) => (
  <footer data-slot="dialog-footer" className={cn('flex justify-end gap-2 pt-2', className)} {...props} />
);

const Dialog = DialogPrimitive.Root as unknown as DialogComponent;

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Trigger = forwardRef<HTMLButtonElement, DialogTriggerProps>((props, ref) => DialogTrigger({ ...props, ref }));
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Content = forwardRef<HTMLDivElement, DialogContentProps>((props, ref) => DialogContent({ ...props, ref }));
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Close = forwardRef<HTMLButtonElement, DialogCloseProps>((props, ref) => DialogClose({ ...props, ref }));
Dialog.Footer = DialogFooter;

Dialog.Trigger.displayName = 'DialogTrigger';
Dialog.Content.displayName = 'DialogContent';
Dialog.Close.displayName = 'DialogClose';
DialogFooter.displayName = 'DialogFooter';

export default Dialog;
