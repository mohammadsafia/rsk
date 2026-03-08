import { type ComponentPropsWithoutRef, createContext, type FC, useContext } from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastPosition = VariantProps<typeof viewportVariants>['position'];

type ToastContextValue = VariantProps<typeof toastVariants>;

type ToastViewportProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & VariantProps<typeof viewportVariants>;
type ToastTitleProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Title>;
type ToastDescriptionProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Description>;
type ToastCloseProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Close>;
type ToastIconProps = Partial<VariantProps<typeof toastVariants>>;
type ToastActionProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Action>;
export type ToastProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>;

type ToastComponent = FC<ToastProps> & {
  Provider: typeof ToastPrimitives.Provider;
  Viewport: FC<ToastViewportProps>;
  Title: FC<ToastTitleProps>;
  Description: FC<ToastDescriptionProps>;
  Close: FC<ToastCloseProps>;
  Icon: FC<ToastIconProps>;
  Action: FC<ToastActionProps>;
};

const viewportVariants = cva('fixed z-100 w-full md:max-w-max', {
  variants: {
    position: {
      'top-start': 'top-20 start-3',
      'top-center': 'top-20 start-1/2 -translate-x-1/2',
      'top-end': 'top-20 end-3',
      'bottom-start': 'bottom-2 start-3',
      'bottom-center': 'bottom-2 start-1/2 -translate-x-1/2',
      'bottom-end': 'bottom-2 end-3',
    },
  },
  defaultVariants: {
    position: 'top-end',
  },
});

const toastVariants = cva(
  `
    group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden
    rounded-md p-4 pe-10 shadow-boundary-ghost transition-all
    data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
    data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out
    data-[state=closed]:fade-out-80
  `,
  {
    variants: {
      variant: {
        default: 'bg-primary-400 text-primary-foreground',
        success: 'bg-success-200 text-foreground',
        destructive: 'bg-destructive-200 text-foreground',
        warning: 'bg-warning-200 text-foreground',
        info: 'bg-background text-foreground',
      },
      position: {
        'top-start': 'data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-start-full',
        'top-center': 'data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full',
        'top-end': 'data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-end-full',
        'bottom-start': 'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-start-full',
        'bottom-center': 'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
        'bottom-end': 'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-end-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'top-end',
    },
  },
);

const ToastContext = createContext<ToastContextValue>({ variant: 'default', position: 'top-end' });

const ToastViewport = ({ className, position, ...props }: ToastViewportProps) => (
  <ToastPrimitives.Viewport data-slot="toast-viewport" className={cn(viewportVariants({ position }), className)} {...props} />
);

const ToastTitle = ({ className, ...props }: ToastTitleProps) => (
  <ToastPrimitives.Title data-slot="toast-title" className={cn('text-sm font-semibold', className)} {...props} />
);

const ToastDescription = ({ className, ...props }: ToastDescriptionProps) => (
  <ToastPrimitives.Description data-slot="toast-description" className={cn('text-sm opacity-90', className)} {...props} />
);

const ToastClose = ({ className, ...props }: ToastCloseProps) => (
  <ToastPrimitives.Close
    aria-label="Close"
    data-slot="toast-close"
    className={cn(
      'absolute end-2 top-2 cursor-pointer rounded-md p-1 text-inherit opacity-0',
      'transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X size={16} />
  </ToastPrimitives.Close>
);

const ToastIcon: FC<ToastIconProps> = ({ variant }) => {
  const context = useContext(ToastContext);

  const resolvedVariant = variant ?? context.variant;
  const iconClass = 'shrink-0 size-5';

  switch (resolvedVariant) {
    case 'success':
      return <CheckCircle2 className={cn(iconClass, 'text-success')} />;
    case 'destructive':
      return <XCircle className={cn(iconClass, 'text-destructive')} />;
    case 'warning':
      return <AlertCircle className={cn(iconClass, 'text-warning')} />;
    case 'info':
      return <Info className={cn(iconClass, 'text-primary')} />;
    default:
      return <Info className={cn(iconClass, 'text-inherit')} />;
  }
};

const ToastAction = ({ className, ...props }: ToastActionProps) => (
  <ToastPrimitives.Action data-slot="toast-action" className={cn('ms-4', className)} {...props} />
);

const Toast: ToastComponent = ({ className, variant, position, children, ...props }: ToastProps) => {
  return (
    <ToastContext.Provider value={{ variant, position }}>
      <ToastPrimitives.Root data-slot="toast" className={cn(toastVariants({ variant, position }), className)} {...props}>
        {children}
      </ToastPrimitives.Root>
    </ToastContext.Provider>
  );
};

Toast.Provider = ToastPrimitives.Provider;
Toast.Viewport = ToastViewport;
Toast.Title = ToastTitle;
Toast.Description = ToastDescription;
Toast.Close = ToastClose;
Toast.Icon = ToastIcon;
Toast.Action = ToastAction;

Toast.displayName = ToastPrimitives.Root.displayName;
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
ToastTitle.displayName = ToastPrimitives.Title.displayName;
ToastDescription.displayName = ToastPrimitives.Description.displayName;
ToastClose.displayName = ToastPrimitives.Close.displayName;
ToastIcon.displayName = 'ToastIcon';
ToastAction.displayName = ToastPrimitives.Action.displayName;

export default Toast;
