import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type HTMLAttributes } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { cn } from '@utils';

type DialogPortalProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>;
type DialogOverlayProps = ComponentProps<typeof DialogPrimitive.Overlay>;
type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
type DialogPanelProps = ComponentProps<typeof DialogPrimitive.Content>;
type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;
type DialogTitleProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;
type DialogDescriptionProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;
type DialogContentProps = HTMLAttributes<HTMLElement>;
type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

type DialogProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;

type DialogComponent = FC<DialogProps> & {
  Portal: FC<DialogPortalProps>;
  Overlay: FC<DialogOverlayProps>;
  Trigger: FC<DialogTriggerProps>;
  Panel: FC<DialogPanelProps>;
  Close: FC<DialogCloseProps>;
  Header: FC<DialogHeaderProps>;
  Title: FC<DialogTitleProps>;
  Description: FC<DialogDescriptionProps>;
  Content: FC<DialogContentProps>;
  Footer: FC<DialogFooterProps>;
};

const DialogOverlay: FC<DialogOverlayProps> = ({ ref, className, ...props }) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="dialog-overlay"
    className={cn(
      'bg-foreground/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50',
      className,
    )}
    {...props}
  />
);

const DialogTrigger: FC<DialogTriggerProps> = ({ ref, className, ...props }) => (
  <DialogPrimitive.Trigger ref={ref} data-slot="dialog-trigger" className={cn(className)} {...props} />
);

const DialogPanel: FC<DialogPanelProps> = ({ ref, className, children, ...props }) => (
  <DialogPrimitive.Portal>
    <Dialog.Overlay />

    <DialogPrimitive.Content
      ref={ref}
      onWheel={(e) => e.stopPropagation()}
      data-slot="dialog-panel"
      className={cn(
        'bg-background grid w-full max-w-lg gap-6 rounded-2xl py-6 shadow-lg',
        'fixed left-1/2 top-1/2 z-50 translate-x-[-50%] translate-y-[-50%] duration-200',
        'focus:outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-top',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

const DialogClose: FC<DialogCloseProps> = ({ ref, className, ...props }) => (
  <DialogPrimitive.Close ref={ref} data-slot="dialog-close" className={cn(className)} {...props} />
);

const DialogHeader: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <header data-slot="dialog-header" className={cn('px-6', className)} {...props} />
);

const DialogHeaderTitle: FC<ComponentPropsWithoutRef<typeof DialogPrimitive.Title>> = ({ className, ...props }) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn('text-foreground text-xl leading-none font-semibold', className)}
    {...props}
  />
);

const DialogHeaderDescription: FC<ComponentPropsWithoutRef<typeof DialogPrimitive.Description>> = ({ className, ...props }) => (
  <DialogPrimitive.Description data-slot="dialog-description" className={cn('text-muted-foreground text-sm', className)} {...props} />
);

const DialogContent: FC<DialogContentProps> = ({ className, ...props }) => (
  <section data-slot="dialog-content" className={cn('px-6', className)} {...props} />
);

const DialogFooter: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <footer data-slot="dialog-footer" className={cn('px-6', className)} {...props} />
);

const Dialog = DialogPrimitive.Root as unknown as DialogComponent;

Dialog.Portal = DialogPrimitive.Portal;
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Overlay = forwardRef<HTMLDivElement, DialogOverlayProps>((props, ref) => DialogOverlay({ ...props, ref }));
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Trigger = forwardRef<HTMLButtonElement, DialogTriggerProps>((props, ref) => DialogTrigger({ ...props, ref }));
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Panel = forwardRef<HTMLDivElement, DialogPanelProps>((props, ref) => DialogPanel({ ...props, ref }));
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Close = forwardRef<HTMLButtonElement, DialogCloseProps>((props, ref) => DialogClose({ ...props, ref }));
Dialog.Header = DialogHeader;
Dialog.Title = DialogHeaderTitle;
Dialog.Description = DialogHeaderDescription;
Dialog.Content = DialogContent;
Dialog.Footer = DialogFooter;

Dialog.Overlay.displayName = DialogPrimitive.Overlay.displayName;
Dialog.Trigger.displayName = 'DialogTrigger';
Dialog.Panel.displayName = 'DialogPanel';
Dialog.Close.displayName = 'DialogClose';
DialogHeader.displayName = 'DialogHeader';
DialogHeaderTitle.displayName = DialogPrimitive.Title.displayName;
DialogHeaderDescription.displayName = DialogPrimitive.Description.displayName;
DialogContent.displayName = 'DialogContent';
DialogFooter.displayName = 'DialogFooter';

export default Dialog;
