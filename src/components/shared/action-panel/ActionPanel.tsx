import type { ComponentProps, FC, MouseEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@components/ui';
import { TooltipButton, type TooltipButtonProps } from '@components/shared';

import { cn } from '@utils';

import { ChevronLeft } from 'lucide-react';

type HeaderProps = ComponentProps<'p'>;

type BackButtonProps = ComponentProps<'button'>;

type TitleProps = ComponentProps<'h2'>;

type ActionProps = TooltipButtonProps & {
  icon?: ReactNode;
};

type ActionsProps = ComponentProps<'div'>;

type ActionPanelProps = ComponentProps<'div'>;

type ActionPanelComponent = FC<ActionPanelProps> & {
  Header: FC<HeaderProps>;
  Back: FC<BackButtonProps>;
  Title: FC<TitleProps>;
  Actions: FC<ActionsProps>;
  Action: FC<ActionProps>;
};

const ActionPanelHeader: FC<HeaderProps> = ({ className, children, ...props }) => {
  return (
    <div data-slot="action-panel-header" className={cn('flex gap-2', className)} {...props}>
      {children}
    </div>
  );
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
    <Button size="icon-sm" variant="outline" className={cn('rounded-xl', className)} aria-label="Go back" onClick={handleClick} {...props}>
      <ChevronLeft size={20} />
    </Button>
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
    <TooltipButton className={cn('flex items-center gap-2', className)} {...props}>
      {icon} {children}
    </TooltipButton>
  );
};

const ActionPanel: ActionPanelComponent = ({ className, children, ...props }) => (
  <div data-slot="action-panel" className={cn('flex items-center gap-3', className)} {...props}>
    {children}
  </div>
);

ActionPanel.Header = ActionPanelHeader;
ActionPanel.Back = ActionPanelBack;
ActionPanel.Title = ActionPanelTitle;
ActionPanel.Actions = ActionPanelActions;
ActionPanel.Action = ActionPanelAction;

export default ActionPanel;
