'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { IconButton, SectionsReset } from '@components/ui';
import { Conditional } from '@components/utils';

import { useFlight } from '@hooks/motion';
import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn, mergeRefs } from '@utils';

import { XIcon } from 'lucide-react';

const dialogContentVariants = cva(
  [
    'bg-surface-raised text-fg shadow-overlay rule-top rule-top-section fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[85dvh] -translate-y-1/2 flex-col gap-4',
    'overflow-hidden rounded-lg p-5 outline-none',
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

/**
 * Dialog motion (spec §4). Calm, and whenever there is no trigger to fly from: rise 8px into place at base. Expressive:
 * useFlight flies it out of its trigger and marks data-flight, which steps the CSS rise aside. Either way it leaves at
 * fast (Radix waits only for CSS exit animations), and its title, body and close button cascade in.
 */
const dialogMotionClassName = [
  'cascade data-[flight]:data-[state=open]:animate-none',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:duration-base data-[state=closed]:duration-fast data-[state=closed]:ease-in',
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
  'data-[state=open]:zoom-in-98 data-[state=closed]:zoom-out-98 data-[state=open]:slide-in-from-bottom-2',
  'motion-reduce:data-[state=open]:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100',
].join(' ');

const DialogContent: FC<DialogContentProps> = ({
  ref,
  className,
  size,
  title,
  hideTitle = false,
  description,
  dismissible = true,
  onEscapeKeyDown,
  onInteractOutside,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  const flightRef = useFlight<HTMLDivElement>();

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
    // Outside the portal: Portal wraps each direct child in Presence, which needs a DOM node to run exit animations.
    <SectionsReset>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="dialog-overlay"
          className={cn(
            'bg-overlay fixed inset-0 z-50 data-[state=open]:duration-base data-[state=closed]:duration-fast',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />

        <DialogPrimitive.Content
          ref={mergeRefs(ref, flightRef)}
          data-slot="dialog-content"
          data-size={size ?? 'md'}
          className={cn(dialogContentVariants({ size }), dialogMotionClassName, className)}
          onEscapeKeyDown={handleEscapeKeyDown}
          onInteractOutside={handleInteractOutside}
          {...describedBy}
          {...props}
        >
          <header data-slot="dialog-header" className={cn('flex flex-col gap-1 pe-8', hideTitle && !description && 'sr-only')}>
            <DialogPrimitive.Title data-slot="dialog-title" className={cn('text-fg text-md font-semibold', hideTitle && 'sr-only')}>
              {title}
            </DialogPrimitive.Title>

            <Conditional.If condition={!!description}>
              <DialogPrimitive.Description data-slot="dialog-description" className="text-fg-muted text-sm">
                {description}
              </DialogPrimitive.Description>
            </Conditional.If>
          </header>

          {/* The body scrolls, not the panel, so the heavy rule and the title stay in place in long dialogs. */}
          <div data-slot="dialog-body" className="-m-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-1">
            {children}
          </div>

          <Conditional.If condition={dismissible}>
            <DialogPrimitive.Close asChild>
              <IconButton size="sm" tooltip={false} aria-label={t('close')} className="absolute end-3 top-3">
                <XIcon />
              </IconButton>
            </DialogPrimitive.Close>
          </Conditional.If>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </SectionsReset>
  );
};

const DialogFooter: FC<DialogFooterProps> = ({ className, ...props }) => (
  <footer data-slot="dialog-footer" className={cn('flex justify-end gap-2 pt-2', className)} {...props} />
);

const Dialog = DialogPrimitive.Root as unknown as DialogComponent;

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Close = DialogClose;
Dialog.Footer = DialogFooter;

Dialog.Trigger.displayName = 'DialogTrigger';
Dialog.Content.displayName = 'DialogContent';
Dialog.Close.displayName = 'DialogClose';
DialogFooter.displayName = 'DialogFooter';

export default Dialog;
