import { type ComponentPropsWithoutRef, type FC, type HTMLAttributes } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@utils';

type DialogPortalProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>;
type DialogOverlayProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;
type DialogPanelProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;
type DialogTriggerProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;
type DialogCloseProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;
type DialogContentProps = HTMLAttributes<HTMLElement>;
type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;
type DialogFooterProps = HTMLAttributes<HTMLDivElement>;
type DialogTitleProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;
type DialogDescriptionProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

type DialogProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;

type DialogComponent = FC<DialogProps> & {
  Portal: FC<DialogPortalProps>;
  Overlay: FC<DialogOverlayProps>;
  Trigger: FC<DialogTriggerProps>;
  Close: FC<DialogCloseProps>;
  Panel: FC<DialogPanelProps>;
  Header: FC<DialogHeaderProps>;
  Title: FC<DialogTitleProps>;
  Description: FC<DialogDescriptionProps>;
  Content: FC<DialogContentProps>;
  Footer: FC<DialogFooterProps>;
};

const Overlay: FC<DialogOverlayProps> = ({ className, ...props }) => (
  <DialogPrimitive.Overlay
    data-slot="dialog-overlay"
    className={cn(
      'bg-foreground/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50',
      className,
    )}
    {...props}
  />
);

const Panel: FC<DialogPanelProps> = ({ className, children, ...props }) => (
  <DialogPrimitive.Portal>
    <Overlay />

    <DialogPrimitive.Content
      data-slot="dialog-panel"
      className={cn(
        'bg-background grid w-full max-w-lg gap-6 rounded-2xl py-6 shadow-lg',
        'fixed start-1/2 top-1/2 z-50 translate-x-[-50%] translate-y-[-50%] duration-200',
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

const DialogTrigger: FC<DialogTriggerProps> = ({ className, ...props }) => {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" className={cn(className)} {...props} />;
};

const DialogClose: FC<DialogCloseProps> = ({ className, ...props }) => {
  return <DialogPrimitive.Close data-slot="dialog-close" className={cn(className)} {...props} />;
};

const Header: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <header data-slot="dialog-header" className={cn('px-6', className)} {...props} />
);

const Title: FC<ComponentPropsWithoutRef<typeof DialogPrimitive.Title>> = ({ className, ...props }) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn('text-foreground text-xl leading-none font-semibold', className)}
    {...props}
  />
);

const Description: FC<ComponentPropsWithoutRef<typeof DialogPrimitive.Description>> = ({ className, ...props }) => (
  <DialogPrimitive.Description data-slot="dialog-description" className={cn('text-muted text-sm', className)} {...props} />
);

const Content: FC<DialogContentProps> = ({ className, ...props }) => (
  <section data-slot="dialog-content" className={cn('px-6', className)} {...props} />
);

const Footer: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <footer data-slot="dialog-footer" className={cn('px-6', className)} {...props} />
);

const Dialog = DialogPrimitive.Root as unknown as DialogComponent;

Dialog.Portal = DialogPrimitive.Portal;
Dialog.Overlay = Overlay;
Dialog.Panel = Panel;
Dialog.Trigger = DialogTrigger;
Dialog.Close = DialogClose;
Dialog.Header = Header;
Dialog.Title = Title;
Dialog.Description = Description;
Dialog.Content = Content;
Dialog.Footer = Footer;

Overlay.displayName = DialogPrimitive.Overlay.displayName;
Panel.displayName = 'DialogPanel';
Header.displayName = 'DialogHeader';
Title.displayName = DialogPrimitive.Title.displayName;
Description.displayName = DialogPrimitive.Description.displayName;
Content.displayName = 'DialogContent';
Footer.displayName = 'DialogFooter';

export default Dialog;
