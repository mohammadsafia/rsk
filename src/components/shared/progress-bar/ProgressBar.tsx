import { Children, type ComponentProps, type FC, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { Divider } from '@components/ui';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

import {
  StepCircleCheckedIcon,
  StepCircleEmptyIcon,
  StepCircleFilledIcon,
  StepCircleRejectIcon,
} from '@assets/icons';

type StepStatus = 'done' | 'current' | 'error' | 'next';

type ProgressBarProps = ComponentProps<'div'>;

type StepProps = ComponentProps<'div'> & {
  status: StepStatus;
  label: string;
  dateTime?: string;
};

type ProgressBarComponent = FC<ProgressBarProps> & {
  Step: FC<StepProps>;
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
    status: 'next',
  },
});

type StepIconProps = VariantProps<typeof stepIconVariants>;

const STEP_ICONS: Record<StepStatus, FC<ComponentProps<'svg'>>> = {
  done: StepCircleCheckedIcon,
  current: StepCircleFilledIcon,
  error: StepCircleRejectIcon,
  next: StepCircleEmptyIcon,
};

const StepIcon: FC<StepIconProps> = ({ status = 'next' }) => {
  const Icon = STEP_ICONS[status!];
  return <Icon className={stepIconVariants({ status })} />;
};

const StepSeparator: FC<{ hasDateTime: boolean }> = ({ hasDateTime }) => (
  <div className={cn('flex flex-1', !hasDateTime && 'pt-3')}>
    <Divider />
  </div>
);

const Step: FC<StepProps> = ({ status, label, dateTime, className, ...props }) => (
  <div data-slot="progress-bar-step" className={cn('flex shrink-0 flex-col items-center gap-1', className)} {...props}>
    <Conditional.If condition={!!dateTime}>
      <span className="text-2xs text-muted-400">{dateTime}</span>
    </Conditional.If>

    <StepIcon status={status} />

    <span className="text-primary-900 text-xs">{label}</span>
  </div>
);

const isStepElement = (child: ReactNode): child is ReactElement<StepProps> =>
  isValidElement(child) && (child.type as FC).displayName === 'ProgressBarStep';

const ProgressBar: ProgressBarComponent = ({ className, children, ...props }) => {
  const steps = Children.toArray(children).filter(isStepElement);
  const hasDateTime = steps.some((step) => !!step.props.dateTime);

  return (
    <div data-slot="progress-bar" className={cn('flex gap-3', hasDateTime ? 'items-center' : 'items-start', className)} {...props}>
      {steps.map((step, index) => (
        <Fragment key={index}>
          {step}

          <Conditional.If condition={index < steps.length - 1}>
            <StepSeparator hasDateTime={hasDateTime} />
          </Conditional.If>
        </Fragment>
      ))}
    </div>
  );
};

Step.displayName = 'ProgressBarStep';
ProgressBar.Step = Step;

export default ProgressBar;
