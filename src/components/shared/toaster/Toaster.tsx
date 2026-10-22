'use client';

import { Toast } from '@components/ui';

import { useAppTranslation, useToast } from '@hooks/shared';

function Toaster() {
  const { toasts } = useToast();
  const { t, direction } = useAppTranslation('common');

  return (
    <Toast.Provider duration={5000} label={t('toast.label')} swipeDirection={direction === 'rtl' ? 'left' : 'right'}>
      {toasts.map(({ id, title, description, action, autoClose = true, duration, ...props }) => (
        <Toast key={id} duration={duration} data-auto-close={String(autoClose)} {...props}>
          <Toast.Icon />

          <div className="grid min-w-0 flex-1 gap-0.5">
            {title && <Toast.Title>{title}</Toast.Title>}

            {description && <Toast.Description>{description}</Toast.Description>}
          </div>

          {action && (
            <Toast.Action asChild altText={typeof title === 'string' ? title : t('toast.action')}>
              {action}
            </Toast.Action>
          )}

          <Toast.Close />
        </Toast>
      ))}

      <Toast.Viewport label={t('toast.region')} position={toasts[0]?.position} />
    </Toast.Provider>
  );
}

export default Toaster;
