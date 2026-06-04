import { Children, type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, isValidElement, type ReactNode } from 'react';

import { ComposedTooltipButton } from '@components/shared/composed-components';
import { Conditional } from '@components/utils';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { FolderOpenIcon } from 'lucide-react';

type BlankSlateIconProps = ComponentPropsWithoutRef<'div'>;

type BlankSlateTitleProps = ComponentPropsWithoutRef<'h3'>;

type BlankSlateDescriptionProps = ComponentPropsWithoutRef<'p'>;

type BlankSlateActionsProps = ComponentPropsWithoutRef<'div'>;

type BlankSlateActionProps = ComponentProps<typeof ComposedTooltipButton>;

type BlankSlateProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof blankSlateVariants> & {
    icon?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    when: boolean;
  };

const blankSlateVariants = cva('flex h-full w-full flex-col items-center justify-center', {
  variants: {
    size: {
      xs: 'p-3 gap-1 **:data-[slot=blank-slate-container]:min-h-0 **:data-[slot=blank-slate-icon]:size-16 **:data-[slot=blank-slate-title]:text-xs **:data-[slot=blank-slate-description]:text-2xs',
      sm: 'p-6 gap-1 **:data-[slot=blank-slate-container]:min-h-24 **:data-[slot=blank-slate-icon]:size-20 **:data-[slot=blank-slate-title]:text-sm **:data-[slot=blank-slate-description]:text-2xs',
      md: 'p-6 gap-2 **:data-[slot=blank-slate-container]:min-h-36 **:data-[slot=blank-slate-icon]:size-30 **:data-[slot=blank-slate-title]:text-lg **:data-[slot=blank-slate-description]:text-sm',
      lg: 'p-6 gap-3 **:data-[slot=blank-slate-container]:min-h-48 **:data-[slot=blank-slate-icon]:size-40 **:data-[slot=blank-slate-title]:text-xl **:data-[slot=blank-slate-description]:text-base',
    },
  },
  defaultVariants: { size: 'md' },
});

type BlankSlateComponent = FC<BlankSlateProps> & {
  Icon: FC<BlankSlateIconProps>;
  Title: FC<BlankSlateTitleProps>;
  Description: FC<BlankSlateDescriptionProps>;
  Actions: FC<BlankSlateActionsProps>;
  Action: FC<BlankSlateActionProps>;
};

const Icon: FC<BlankSlateIconProps> = ({ className, children, ...props }) => (
  <div
    data-slot="blank-slate-icon"
    className={cn('text-muted-200 pointer-events-none absolute inset-0 m-auto [&>svg]:size-full', className)}
    {...props}
  >
    {children ?? <FolderOpenIcon strokeWidth={1} />}
  </div>
);

const Title: FC<BlankSlateTitleProps> = ({ className, ...props }) => (
  <h3 data-slot="blank-slate-title" className={cn('text-muted-400 font-medium', className)} {...props} />
);

const Description: FC<BlankSlateDescriptionProps> = ({ className, ...props }) => (
  <p data-slot="blank-slate-description" className={cn('text-muted-400 max-w-md text-center', className)} {...props} />
);

const Actions: FC<BlankSlateActionsProps> = ({ className, ...props }) => (
  <div data-slot="blank-slate-actions" className={cn('flex flex-wrap items-center gap-3', className)} {...props} />
);

const Action: FC<BlankSlateActionProps> = ({ ref, className, ...props }) => (
  <ComposedTooltipButton ref={ref} variant="outline" className={cn('flex items-center gap-2', className)} {...props} />
);

const BlankSlate: BlankSlateComponent = ({ icon, title, description, when, size, className, children, ...props }) => {
  if (!when) return null;

  const childArray = Children.toArray(children);

  const iconChild = childArray.find((child) => isValidElement(child) && child.type === BlankSlate.Icon);
  const titleChild = childArray.find((child) => isValidElement(child) && child.type === BlankSlate.Title);
  const descriptionChild = childArray.find((child) => isValidElement(child) && child.type === BlankSlate.Description);
  const actionsChild = childArray.find((child) => isValidElement(child) && child.type === BlankSlate.Actions);

  const renderedTitle = titleChild ?? (title ? <Title>{title}</Title> : null);
  const renderedDescription = descriptionChild ?? (description ? <Description>{description}</Description> : null);

  return (
    <div data-slot="blank-slate" className={cn(blankSlateVariants({ size }), className)} {...props}>
      <div data-slot="blank-slate-container" className="relative flex flex-col items-center justify-center">
        <Conditional>
          <Conditional.If condition={!!iconChild}>{iconChild}</Conditional.If>

          <Conditional.Else>
            <Icon>{icon}</Icon>
          </Conditional.Else>
        </Conditional>

        <Conditional.If condition={!!renderedTitle || !!renderedDescription}>
          <div className="isolate flex flex-col items-center gap-2">
            {renderedTitle}
            {renderedDescription}
          </div>
        </Conditional.If>
      </div>

      {actionsChild}
    </div>
  );
};

BlankSlate.Icon = Icon;
BlankSlate.Title = Title;
BlankSlate.Description = Description;
BlankSlate.Actions = Actions;
BlankSlate.Action = forwardRef<HTMLButtonElement, BlankSlateActionProps>((props, ref) => Action({ ...props, ref }));

Icon.displayName = 'BlankSlateIcon';
Title.displayName = 'BlankSlateTitle';
Description.displayName = 'BlankSlateDescription';
Actions.displayName = 'BlankSlateActions';
BlankSlate.Action.displayName = 'BlankSlateAction';

export default BlankSlate;
