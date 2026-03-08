import { type ComponentProps, createContext, type FC, useContext, useEffect, useState } from 'react';

import { Dialog } from '@components/ui';
import { Conditional } from '@components/utils';
import { LoadingButton, type LoadingButtonProps } from '@components/shared';

import { cn } from '@utils';

import { X } from 'lucide-react';

type DialogBaseProps = {
  open?: boolean;
  isLoading?: boolean;
  dialogMode?: 'Create' | 'Update' | 'View' | boolean;
};

type TriggerProps = ComponentProps<typeof Dialog.Trigger>;

type PanelProps = ComponentProps<typeof Dialog.Panel> & { dismissible?: boolean };

type HeaderProps = ComponentProps<typeof Dialog.Header>;

type TitleProps = ComponentProps<typeof Dialog.Title> & DialogBaseProps;

type DescriptionProps = ComponentProps<typeof Dialog.Description>;

type ContentProps = ComponentProps<typeof Dialog.Content>;

type ActionsProps = ComponentProps<typeof Dialog.Footer> &
  DialogBaseProps & {
    primaryButtonProps?: Omit<LoadingButtonProps, 'loading'>;
    secondaryButtonProps?: Omit<LoadingButtonProps, 'loading'>;
  };

type PrimeDialogProps = Omit<ComponentProps<typeof Dialog>, 'onOpenChange'> &
  DialogBaseProps & {
    closeOnSuccess?: boolean;
    onOpenChange?(open: boolean): void;
  };

type PrimeDialogComponent = FC<PrimeDialogProps> & {
  Trigger: FC<TriggerProps>;
  Panel: FC<PanelProps>;
  Header: FC<HeaderProps>;
  Title: FC<TitleProps>;
  Description: FC<DescriptionProps>;
  Content: FC<ContentProps>;
  Actions: FC<ActionsProps>;
};

const getDialogModeText = (dialogMode?: PrimeDialogProps['dialogMode']): string => {
  if (dialogMode === undefined) return '';

  if (typeof dialogMode === 'boolean') return dialogMode ? 'Edit' : 'Add';

  return dialogMode ?? 'Add';
};

const PrimeDialogContext = createContext<PrimeDialogProps>({});

const Trigger: FC<TriggerProps> = ({ children, ...props }) => (
  <Dialog.Trigger asChild {...props}>
    {children}
  </Dialog.Trigger>
);

const Panel: FC<PanelProps> = ({ dismissible = false, className, children, ...props }) => (
  <Dialog.Panel
    className={cn('py-0 md:max-w-[800px]', className)}
    onInteractOutside={(e) => !dismissible && e.preventDefault()}
    onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
    {...props}
  >
    <Dialog.Close
      aria-label="Close"
      className="absolute end-4 top-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
    >
      <X size={18} />
    </Dialog.Close>

    {children}
  </Dialog.Panel>
);

const Header: FC<HeaderProps> = ({ className, children, ...props }) => (
  <Dialog.Header className={cn('bg-primary/5 border-primary/20 border-b py-6', className)} {...props}>
    {children}
  </Dialog.Header>
);

const Title: FC<TitleProps> = ({ className, children, dialogMode, ...props }) => {
  const context = useContext(PrimeDialogContext);

  return (
    <Dialog.Title className={cn('', className)} {...props}>
      {dialogMode ?? getDialogModeText(context.dialogMode)} {children}
    </Dialog.Title>
  );
};

const Description: FC<DescriptionProps> = ({ className, children, ...props }) => (
  <Dialog.Description className={cn('', className)} {...props}>
    {children}
  </Dialog.Description>
);

const Content: FC<ContentProps> = ({ className, children, ...props }) => (
  <Dialog.Content className={cn('last:pb-6', className)} {...props}>
    {children}
  </Dialog.Content>
);

const Actions: FC<ActionsProps> = ({ className, isLoading, dialogMode, primaryButtonProps, secondaryButtonProps, children, ...props }) => {
  const context = useContext(PrimeDialogContext);

  return (
    <Dialog.Footer className={cn('flex justify-end gap-x-1.5 pb-6', className)} {...props}>
      <Conditional>
        <Conditional.If condition={!!children}>{children}</Conditional.If>

        <Conditional.Else>
          <Dialog.Close asChild>
            <LoadingButton
              type="reset"
              variant="outline"
              className={cn(context.dialogMode !== 'View' && 'grow', secondaryButtonProps?.className)}
              {...secondaryButtonProps}
            >
              {secondaryButtonProps?.children || 'Cancel'}
            </LoadingButton>
          </Dialog.Close>

          <LoadingButton
            type="submit"
            loading={isLoading ?? context.isLoading}
            className={cn('grow', context.dialogMode === 'View' && 'hidden', primaryButtonProps?.className)}
            {...primaryButtonProps}
          >
            {primaryButtonProps?.children || (dialogMode ?? (getDialogModeText(context.dialogMode) || 'Create'))}
          </LoadingButton>
        </Conditional.Else>
      </Conditional>
    </Dialog.Footer>
  );
};

const PrimeDialog: PrimeDialogComponent = ({ open, closeOnSuccess, dialogMode, onOpenChange, children, ...props }) => {
  const [internalOpen, setInternalOpen] = useState(open ?? false);

  const onInternalOpenChange = (open: boolean) => {
    setInternalOpen((prevState) => !prevState);

    onOpenChange?.(!open);
  };

  useEffect(() => {
    if (closeOnSuccess) setInternalOpen(false);
  }, [closeOnSuccess]);

  return (
    <PrimeDialogContext.Provider value={{ open: internalOpen, onOpenChange: onInternalOpenChange, dialogMode, ...props }}>
      <Dialog open={internalOpen} onOpenChange={onInternalOpenChange} {...props}>
        {children}
      </Dialog>
    </PrimeDialogContext.Provider>
  );
};

PrimeDialog.Trigger = Trigger;
PrimeDialog.Panel = Panel;
PrimeDialog.Header = Header;
PrimeDialog.Title = Title;
PrimeDialog.Description = Description;
PrimeDialog.Content = Content;
PrimeDialog.Actions = Actions;

export default PrimeDialog;
