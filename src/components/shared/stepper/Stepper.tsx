'use client';

import { Children, type ComponentPropsWithoutRef, type FC, Fragment, isValidElement, type ReactNode } from 'react';

import { Divider } from '@components/ui';
import { Conditional } from '@components/utils';

import { cva } from 'class-variance-authority';
import { cn } from '@utils';

import { StepCircleCheckedIcon, StepCircleEmptyIcon, StepCircleFilledIcon, StepCircleRejectIcon } from '@assets/icons';

type StepStatus = 'done' | 'current' | 'error' | 'next';

type StepProps = ComponentPropsWithoutRef<'div'> & {
  /** Lets the Stepper thicken the rule after a done step. */
  status?: StepStatus;
};
type ConnectorProps = { done?: boolean; className?: string };
type StepIconProps = { status: StepStatus; className?: string };
type StepLabelProps = ComponentPropsWithoutRef<'span'>;
type StepperProps = ComponentPropsWithoutRef<'div'>;

type StepperComponent = FC<StepperProps> & {
  Step: FC<StepProps>;
  Icon: FC<StepIconProps>;
  Label: FC<StepLabelProps>;
  Connector: FC<ConnectorProps>;
};

const STEP_ICONS: Record<StepStatus, FC<ComponentPropsWithoutRef<'svg'>>> = {
  done: StepCircleCheckedIcon,
  current: StepCircleFilledIcon,
  error: StepCircleRejectIcon,
  next: StepCircleEmptyIcon,
};

const stepIconVariants = cva('size-6 shrink-0', {
  variants: {
    status: {
      done: 'text-accent',
      current: 'text-accent',
      error: 'text-danger',
      next: 'text-border-strong',
    },
  },
  defaultVariants: {
    status: 'current',
  },
});

const Step: FC<StepProps> = ({ className, status, ...props }) => (
  <div data-slot="stepper-step" data-status={status} className={cn('flex shrink-0 flex-col items-center gap-1', className)} {...props} />
);

/** The rule between two steps; after a done step it thickens into the strong section rule. */
const Connector: FC<ConnectorProps> = ({ done = false, className }) => (
  <div aria-hidden="true" data-slot="stepper-connector" className={cn('flex flex-1 items-center self-start pt-3', className)}>
    <Divider
      className={cn('duration-base ease-out transition-[height,background-color]', done && 'bg-rule-strong h-(--rule-width-section)')}
    />
  </div>
);

const Icon: FC<StepIconProps> = ({ status, className }) => {
  const IconComponent = STEP_ICONS[status];

  return <IconComponent className={cn(stepIconVariants({ status }), className)} />;
};

const Label: FC<StepLabelProps> = ({ className, ...props }) => (
  <span data-slot="stepper-label" className={cn('truncate text-xs', className)} {...props} />
);

/** A step's status: its own, else the status of a <Stepper.Icon> inside it (searched a few levels down). */
const statusOf = (node: ReactNode, depth = 0): StepStatus | undefined => {
  if (!isValidElement<{ status?: StepStatus; children?: ReactNode }>(node) || depth > 3) return undefined;
  if (node.props.status) return node.props.status;
  for (const child of Children.toArray(node.props.children)) {
    const found = statusOf(child, depth + 1);
    if (found) return found;
  }
  return undefined;
};

const Stepper: StepperComponent = ({ className, children, ...props }) => {
  const steps = Children.toArray(children);

  return (
    <div data-slot="stepper" className={cn('flex w-full items-start gap-3', className)} {...props}>
      {steps.map((step, index) => (
        <Fragment key={index}>
          {step}

          <Conditional.If condition={index < steps.length - 1}>
            <Connector done={statusOf(step) === 'done'} />
          </Conditional.If>
        </Fragment>
      ))}
    </div>
  );
};

Step.displayName = 'StepperStep';

Stepper.Step = Step;
Stepper.Icon = Icon;
Stepper.Label = Label;
Stepper.Connector = Connector;

export default Stepper;
