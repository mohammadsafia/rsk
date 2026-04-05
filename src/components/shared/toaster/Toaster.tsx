import { Toast } from '@components/ui';

import { useToast } from '@hooks/shared';

function Toaster() {
  const { toasts } = useToast();

  return (
    <Toast.Provider duration={5000}>
      {toasts.map(({ id, title, description, action, ...props }) => {
        return (
          <Toast key={id} {...props}>
            <div className="grid grid-cols-[35px_1fr] items-center gap-0.5">
              <Toast.Icon />

              {title && <Toast.Title>{title}</Toast.Title>}

              {description && <Toast.Description className="col-start-2">{description}</Toast.Description>}
            </div>

            {action && (
              <Toast.Action asChild altText={title ?? 'Toast Action'}>
                {action}
              </Toast.Action>
            )}

            <Toast.Close />
          </Toast>
        );
      })}

      <Toast.Viewport position={toasts[0]?.position} />
    </Toast.Provider>
  );
}

export default Toaster;
