import { Toast } from '@components/ui';

import { useToast } from '@hooks/shared';

function Toaster() {
  const { toasts } = useToast();

  return (
    <Toast.Provider duration={5000}>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <Toast.Icon />

          <div className="grid min-w-0 flex-1 gap-0.5">
            {title && <Toast.Title>{title}</Toast.Title>}

            {description && <Toast.Description>{description}</Toast.Description>}
          </div>

          {action && (
            <Toast.Action asChild altText={typeof title === 'string' ? title : 'Toast action'}>
              {action}
            </Toast.Action>
          )}

          <Toast.Close />
        </Toast>
      ))}

      <Toast.Viewport position={toasts[0]?.position} />
    </Toast.Provider>
  );
}

export default Toaster;
