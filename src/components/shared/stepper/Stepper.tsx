import { Children, type ComponentPropsWithoutRef, type FC, Fragment } from 'react';

import { Divider } from '@components/ui';
import { Conditional } from '@components/utils';

import { cva } from 'class-variance-authority';
import { cn } from '@utils';

import { StepCircleCheckedIcon, StepCircleEmptyIcon, StepCircleFilledIcon, StepCircleRejectIcon } from '@assets/icons';

type StepStatus = 'done' | 'current' | 'error' | 'next';

type StepProps = ComponentPropsWithoutRef<'div'>;
type StepIconProps = { status: StepStatus; className?: string };
type StepLabelProps = ComponentPropsWithoutRef<'span'>;
type StepperProps = ComponentPropsWithoutRef<'div'>;

type StepperComponent = FC<StepperProps> & {
  Step: FC<StepProps>;
  Icon: FC<StepIconProps>;
  Label: FC<StepLabelProps>;
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
      done: 'text-primary-400',
      current: 'text-primary-400',
      error: 'text-destructive-400',
      next: 'text-primary-50',
    },
  },
  defaultVariants: {
    status: 'current',
  },
});

const Step: FC<StepProps> = ({ className, ...props }) => (
  <div data-slot="stepper-step" className={cn('flex shrink-0 flex-col items-center gap-1', className)} {...props} />
);

const Icon: FC<StepIconProps> = ({ status, className }) => {
  const IconComponent = STEP_ICONS[status];

  return <IconComponent className={cn(stepIconVariants({ status }), className)} />;
};

const Label: FC<StepLabelProps> = ({ className, ...props }) => (
  <span data-slot="stepper-label" className={cn('truncate text-xs', className)} {...props} />
);

const Stepper: StepperComponent = ({ className, children, ...props }) => {
  const steps = Children.toArray(children);

  return (
    <div data-slot="stepper" className={cn('flex w-full items-start gap-3', className)} {...props}>
      {steps.map((step, index) => (
        <Fragment key={index}>
          {step}

          <Conditional.If condition={index < steps.length - 1}>
            <div className="flex flex-1 items-center self-start pt-3">
              <Divider />
            </div>
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

export default Stepper;
