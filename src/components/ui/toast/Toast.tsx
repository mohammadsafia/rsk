'use client';

import { type ComponentPropsWithoutRef, createContext, type CSSProperties, type FC, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import * as ToastPrimitives from '@radix-ui/react-toast';

// !Direct import: toastVariants reads this at module load, before the ui barrel reaches ./popover
import { floatingSurfaceClassName } from '@components/ui/popover/floating';

import { useAppTranslation, useIsHydrated } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const viewportVariants = cva('fixed z-100 flex w-full flex-col gap-2 p-3 md:max-w-max', {
  variants: {
    position: {
      'top-start': 'top-0 inset-s-0',
      'top-center': 'top-0 inset-x-0 mx-auto',
      'top-end': 'top-0 inset-e-0',
      'bottom-start': 'bottom-0 inset-s-0',
      'bottom-center': 'bottom-0 inset-x-0 mx-auto',
      'bottom-end': 'bottom-0 inset-e-0',
    },
  },
  defaultVariants: {
    position: 'top-end',
  },
});

const toastVariants = cva(
  [
    floatingSurfaceClassName,
    'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden p-3 pe-10 md:w-96',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)',
    'data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out',
    // Springs into place, leaves quicker (spec §4 toast).
    'data-[state=open]:duration-spring data-[state=open]:ease-spring data-[state=closed]:duration-exit data-[state=closed]:ease-in data-[state=closed]:fade-out-0 motion-reduce:data-[state=open]:slide-in-from-top-0 motion-reduce:data-[state=open]:slide-in-from-bottom-0',
  ],
  {
    variants: {
      position: {
        'top-start': 'data-[state=open]:slide-in-from-top-2',
        'top-center': 'data-[state=open]:slide-in-from-top-2',
        'top-end': 'data-[state=open]:slide-in-from-top-2',
        'bottom-start': 'data-[state=open]:slide-in-from-bottom-2',
        'bottom-center': 'data-[state=open]:slide-in-from-bottom-2',
        'bottom-end': 'data-[state=open]:slide-in-from-bottom-2',
      },
    },
    defaultVariants: {
      position: 'top-end',
    },
  },
);

export type ToastPosition = VariantProps<typeof viewportVariants>['position'];

export type ToastProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
  tone?: ToastTone;
  position?: ToastPosition;
};

type ToastViewportProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & VariantProps<typeof viewportVariants>;
type ToastTitleProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Title>;
type ToastDescriptionProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Description>;
type ToastCloseProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Close>;
type ToastIconProps = { tone?: ToastTone };
type ToastActionProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Action>;

type ToastComponent = FC<ToastProps> & {
  Provider: typeof ToastPrimitives.Provider;
  Viewport: FC<ToastViewportProps>;
  Title: FC<ToastTitleProps>;
  Description: FC<ToastDescriptionProps>;
  Close: FC<ToastCloseProps>;
  Icon: FC<ToastIconProps>;
  Action: FC<ToastActionProps>;
};

const ToastContext = createContext<{ tone: ToastTone }>({ tone: 'neutral' });

const TONE_ICON: Record<ToastTone, { Icon: typeof Info; className: string }> = {
  neutral: { Icon: Info, className: 'text-fg-muted' },
  info: { Icon: Info, className: 'text-info' },
  success: { Icon: CheckCircle2, className: 'text-success' },
  warning: { Icon: AlertTriangle, className: 'text-warning' },
  danger: { Icon: XCircle, className: 'text-danger' },
};

/**
 * Portalled to <body>: rendered inside the app shell, it would share the shell's stacking context, and while a dialog
 * recedes the page (motion page depth) its toasts would sit dimmed under the dialog's overlay. A server can't portal,
 * so on a server-rendered page the viewport arrives right after hydration (no toast can show before then anyway).
 */
const ToastViewport: FC<ToastViewportProps> = ({ className, position, ...props }) => {
  const hydrated = useIsHydrated();
  const viewport = (
    <ToastPrimitives.Viewport data-slot="toast-viewport" className={cn(viewportVariants({ position }), className)} {...props} />
  );
  return hydrated ? createPortal(viewport, document.body) : null;
};

const ToastTitle: FC<ToastTitleProps> = ({ className, ...props }) => (
  <ToastPrimitives.Title data-slot="toast-title" className={cn('text-fg text-sm font-semibold', className)} {...props} />
);

const ToastDescription: FC<ToastDescriptionProps> = ({ className, ...props }) => (
  <ToastPrimitives.Description
    data-slot="toast-description"
    className={cn('text-fg-muted text-sm whitespace-pre-line select-text', className)}
    {...props}
  />
);

const ToastClose: FC<ToastCloseProps> = ({ className, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <ToastPrimitives.Close
      aria-label={t('close')}
      data-slot="toast-close"
      className={cn(
        'focus-ring text-fg-muted hover:text-fg absolute end-2 top-2 cursor-pointer rounded-sm p-1',
        'transition-opacity',
        className,
      )}
      toast-close=""
      {...props}
    >
      <X size={16} aria-hidden="true" />
    </ToastPrimitives.Close>
  );
};

const ToastIcon: FC<ToastIconProps> = ({ tone }) => {
  const context = useContext(ToastContext);
  const { Icon, className } = TONE_ICON[tone ?? context.tone];

  return <Icon data-slot="toast-icon" aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', className)} />;
};

const ToastAction: FC<ToastActionProps> = ({ className, ...props }) => (
  <ToastPrimitives.Action data-slot="toast-action" className={cn('ms-auto shrink-0', className)} {...props} />
);

const Toast: ToastComponent = ({ className, tone = 'neutral', position, duration, style, onPause, onResume, children, ...props }) => {
  // Radix pauses its close timer on hover, on focus, on window blur and when F8 moves focus into the region; the
  // drain mirrors that through onPause/onResume instead of guessing from CSS states.
  const [paused, setPaused] = useState(false);
  // The drain needs a length to run over: a toast with no finite duration of its own keeps its rule whole.
  const timed = duration !== undefined && Number.isFinite(duration);

  return (
    <ToastContext.Provider value={{ tone }}>
      <ToastPrimitives.Root
        data-slot="toast"
        data-tone={tone}
        data-paused={paused ? '' : undefined}
        duration={duration}
        style={timed ? ({ '--toast-duration': `${duration}ms`, ...style } as CSSProperties) : style}
        onPause={() => {
          setPaused(true);
          onPause?.();
        }}
        onResume={() => {
          setPaused(false);
          onResume?.();
        }}
        className={cn(toastVariants({ position }), className)}
        {...props}
      >
        {/* The heavy top rule doubles as the auto-close timer: it drains over --toast-duration and pauses with Radix's own timer. */}
        <span
          data-slot="toast-timer"
          aria-hidden="true"
          className={cn(
            'bg-rule-strong pointer-events-none absolute inset-x-0 top-0 h-(--rule-width) origin-left rtl:origin-right',
            timed && '[animation:rsk-drain_var(--toast-duration)_linear_forwards] group-data-paused:[animation-play-state:paused]',
            'group-data-[auto-close=false]:animate-none motion-reduce:animate-none',
          )}
        />
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
