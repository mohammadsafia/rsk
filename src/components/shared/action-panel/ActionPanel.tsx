import type { ComponentPropsWithoutRef, FC, MouseEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@components/ui';
import { ComposedTooltipButton } from '@components/shared';

import { cn } from '@utils';

import { ChevronLeft } from 'lucide-react';

type BackButtonProps = ComponentPropsWithoutRef<'button'>;

type HeaderProps = ComponentPropsWithoutRef<'p'>;

type TitleProps = ComponentPropsWithoutRef<'h2'>;

type ActionsProps = ComponentPropsWithoutRef<'div'>;

type ActionProps = ComponentPropsWithoutRef<typeof ComposedTooltipButton> & {
  icon?: ReactNode;
};

type ActionPanelProps = ComponentPropsWithoutRef<'div'>;

type ActionPanelComponent = FC<ActionPanelProps> & {
  Back: FC<BackButtonProps>;
  Header: FC<HeaderProps>;
  Title: FC<TitleProps>;
  Actions: FC<ActionsProps>;
  Action: FC<ActionProps>;
};

const ActionPanelBack: FC<BackButtonProps> = ({ className, onClick, ...props }) => {
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
    if (onClick) {
      onClick(e);
      return;
    }

    navigate(-1);
  };

  return (
    <Button size="icon-sm" variant="ghost-muted" className={cn('', className)} aria-label="Go back" onClick={handleClick} {...props}>
      <ChevronLeft size={20} />
    </Button>
  );
};

const ActionPanelHeader: FC<HeaderProps> = ({ className, children, ...props }) => {
  return (
    <div data-slot="action-panel-header" className={cn('flex gap-2', className)} {...props}>
      {children}
    </div>
  );
};

const ActionPanelTitle: FC<TitleProps> = ({ className, children, ...props }) => (
  <h2 data-slot="action-panel-title" className={cn('text-primary text-xl font-bold', className)} {...props}>
    {children}
  </h2>
);

const ActionPanelActions: FC<ActionsProps> = ({ className, children, ...props }) => (
  <div data-slot="action-panel-actions" className={cn('ms-auto flex items-center gap-3', className)} {...props}>
    {children}
  </div>
);

const ActionPanelAction: FC<ActionProps> = ({ className, icon, children, ...props }) => {
  return (
    <ComposedTooltipButton className={cn('flex items-center gap-2', className)} {...props}>
      {icon} {children}
    </ComposedTooltipButton>
  );
};

const ActionPanel: ActionPanelComponent = ({ className, children, ...props }) => (
  <div data-slot="action-panel" className={cn('flex items-center gap-3', className)} {...props}>
    {children}
  </div>
);

ActionPanel.Back = ActionPanelBack;
ActionPanel.Header = ActionPanelHeader;
ActionPanel.Title = ActionPanelTitle;
ActionPanel.Actions = ActionPanelActions;
ActionPanel.Action = ActionPanelAction;

export default ActionPanel;
