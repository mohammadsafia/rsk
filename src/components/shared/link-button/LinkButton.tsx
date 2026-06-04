import { Link, type LinkProps } from 'react-router-dom';

import { Button, type ButtonProps } from '@components/ui';

import { cn } from '@utils';

type LinkButtonProps = ButtonProps & {
  to: LinkProps['to'];
  textContent: string;
  withContainer?: boolean;
  containerClassName?: string;
};

function LinkButton({ to, textContent, className, containerClassName, withContainer = true, ...props }: LinkButtonProps) {
  const child = (
    <Button asChild className={cn(className)} {...props}>
      <Link to={to}>{textContent}</Link>
    </Button>
  );

  return !withContainer ? (
    child
  ) : (
    <div className={cn('bg-primary mb-10 flex items-center rounded-xl px-5 py-3', containerClassName)}>{child}</div>
  );
}

export default LinkButton;
