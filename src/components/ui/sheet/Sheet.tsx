'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { IconButton, SectionsReset } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { XIcon } from 'lucide-react';

// Below md the sheet is a bottom sheet; from md up it is a full-height side panel.
const sheetContentVariants = cva(
  [
    'bg-surface-raised text-fg shadow-overlay border-border rule-top rule-top-section fixed z-50 flex flex-col outline-none',
    'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg border-t',
    'md:inset-y-0 md:max-h-none md:w-full md:rounded-none md:border-t-0',
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-spring-long data-[state=open]:ease-spring data-[state=closed]:duration-exit data-[state=closed]:ease-in motion-reduce:animate-none',
    // The bottom slide belongs to the bottom sheet only: unscoped, it also sets vertical travel on the md side panel.
    'max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom',
  ],
  {
    variants: {
      side: {
        end: 'md:start-auto md:end-0 md:border-s md:data-[state=open]:slide-in-from-end md:data-[state=closed]:slide-out-to-end',
        start: 'md:start-0 md:end-auto md:border-e md:data-[state=open]:slide-in-from-start md:data-[state=closed]:slide-out-to-start',
      },
      size: {
        sm: 'md:max-w-sm',
        md: 'md:max-w-lg',
        lg: 'md:max-w-3xl',
      },
    },
    defaultVariants: { side: 'end', size: 'md' },
  },
);

type SheetProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
type SheetTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
type SheetCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
type SheetSectionProps = ComponentPropsWithoutRef<'div'>;

export type SheetContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> &
  VariantProps<typeof sheetContentVariants> & {
    title: ReactNode;
    hideTitle?: boolean;
    description?: ReactNode;
    /** When false: no close button, Escape and outside interaction are ignored. */
    dismissible?: boolean;
  };

type SheetComponent = FC<SheetProps> & {
  Trigger: FC<SheetTriggerProps>;
  Content: FC<SheetContentProps>;
  Body: FC<SheetSectionProps>;
  Footer: FC<SheetSectionProps>;
  Close: FC<SheetCloseProps>;
};

type EscapeKeyDownEvent = Parameters<NonNullable<SheetContentProps['onEscapeKeyDown']>>[0];
type InteractOutsideEvent = Parameters<NonNullable<SheetContentProps['onInteractOutside']>>[0];

const SheetContent: FC<SheetContentProps> = ({
  ref,
  className,
  side,
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
  const describedBy = description ? {} : { 'aria-describedby': undefined };

  return (
    // Outside the portal: Portal wraps each direct child in Presence, which needs a DOM node to run exit animations.
    <SectionsReset>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="sheet-overlay"
          className="bg-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-base data-[state=closed]:duration-fast fixed inset-0 z-50"
        />

        <DialogPrimitive.Content
          ref={ref}
          data-slot="sheet-content"
          data-side={side ?? 'end'}
          className={cn(sheetContentVariants({ side, size }), className)}
          onEscapeKeyDown={(event: EscapeKeyDownEvent) => {
            if (!dismissible) event.preventDefault();
            onEscapeKeyDown?.(event);
          }}
          onInteractOutside={(event: InteractOutsideEvent) => {
            if (!dismissible) event.preventDefault();
            onInteractOutside?.(event);
          }}
          {...describedBy}
          {...props}
        >
          <header
            data-slot="sheet-header"
            className={cn('border-border-subtle flex flex-col gap-1 border-b px-5 py-4 pe-12', hideTitle && !description && 'sr-only')}
          >
            <DialogPrimitive.Title data-slot="sheet-title" className={cn('text-fg text-md font-semibold', hideTitle && 'sr-only')}>
              {title}
            </DialogPrimitive.Title>

            <Conditional.If condition={!!description}>
              <DialogPrimitive.Description data-slot="sheet-description" className="text-fg-muted text-sm">
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
      </DialogPrimitive.Portal>
    </SectionsReset>
  );
};

const SheetBody: FC<SheetSectionProps> = ({ className, ...props }) => (
  // Its fields arrive one after another as the sheet springs in.
  <div data-slot="sheet-body" className={cn('cascade min-h-0 flex-1 content-start overflow-y-auto px-5 py-4', className)} {...props} />
);

const SheetFooter: FC<SheetSectionProps> = ({ className, ...props }) => (
  <div data-slot="sheet-footer" className={cn('border-border-subtle flex justify-end gap-2 border-t px-5 py-3', className)} {...props} />
);

// A component of its own: Dialog also hangs its parts on DialogPrimitive.Root, so assigning Sheet's parts to
// that shared object would replace Dialog.Content everywhere.
const Sheet = ((props: SheetProps) => <DialogPrimitive.Root {...props} />) as SheetComponent;

const SheetTrigger: FC<SheetTriggerProps> = (props) => <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
const SheetClose: FC<SheetCloseProps> = (props) => <DialogPrimitive.Close data-slot="sheet-close" {...props} />;

Sheet.Trigger = SheetTrigger;
Sheet.Content = SheetContent;
Sheet.Close = SheetClose;
Sheet.Body = SheetBody;
Sheet.Footer = SheetFooter;

Sheet.Trigger.displayName = 'SheetTrigger';
Sheet.Content.displayName = 'SheetContent';
Sheet.Close.displayName = 'SheetClose';

export default Sheet;
