import { Children, Fragment, isValidElement, type ReactElement, type ReactNode, useEffect, useRef } from 'react';
import { type FieldValues, FormProvider, type Path, type UseFormReturn } from 'react-hook-form';

import { Alert, Badge, Button, Divider } from '@components/ui';
import { DescriptionList, Stepper } from '@components/shared';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { FormWizardReview, type FormWizardReviewProps, FormWizardStep, type FormWizardStepProps, type ReviewRows } from './parts';
import { useWizardDraft } from './useWizardDraft';
import { useWizardSteps } from './useWizardSteps';

export type FormWizardProps<TValues extends FieldValues> = {
  form: UseFormReturn<TValues>;
  onSubmit: (values: TValues) => void | Promise<void>;
  /** Saves a session draft under rsk:wizard:<draftKey>. */
  draftKey?: string;
  /** Keeps ?step=<id> in the URL. */
  urlSync?: boolean;
  onCancel?: () => void;
  className?: string;
  children: ReactNode;
};

type WizardStep = (FormWizardStepProps & { kind: 'step' }) | (FormWizardReviewProps & { kind: 'review'; id: string; title: string });

const readSteps = (children: ReactNode, reviewTitle: string): WizardStep[] =>
  Children.toArray(children).flatMap((child): WizardStep[] => {
    if (!isValidElement(child)) return [];
    if (child.type === FormWizardStep) {
      const props = (child as ReactElement<FormWizardStepProps>).props;
      return props.condition === false ? [] : [{ ...props, kind: 'step' }];
    }
    if (child.type === FormWizardReview) {
      const props = (child as ReactElement<FormWizardReviewProps>).props;
      return [{ ...props, kind: 'review', id: 'review', title: props.title ?? reviewTitle }];
    }
    return [];
  });

/** Field paths a step owns, for validation and error routing. */
export const stepFields = (step: WizardStep): string[] => {
  if (step.kind !== 'step') return [];
  const shape = (step.schema as { shape?: Record<string, unknown> } | undefined)?.shape;
  return shape ? Object.keys(shape) : (step.fields ?? []);
};

/** Read-only summary of the earlier steps, each with an Edit link back to it. */
function ReviewPanel({ steps, values, onEdit }: { steps: WizardStep[]; values: Record<string, unknown>; onEdit: (index: number) => void }) {
  const { t } = useAppTranslation('common');

  return (
    <div data-slot="form-wizard-review" className="flex flex-col gap-4">
      {steps.map((step, index) => {
        if (step.kind !== 'step') return null;
        const rows: ReviewRows | null =
          typeof step.review === 'function' ? null : (step.review ?? stepFields(step).map((name) => ({ name, label: name })));

        return (
          <section key={step.id} className="border-border flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-fg text-sm font-semibold">{step.title}</h3>
              <Button type="button" variant="link" size="sm" aria-label={`${t('wizard.edit')} ${step.title}`} onClick={() => onEdit(index)}>
                {t('wizard.edit')}
              </Button>
            </div>
            {typeof step.review === 'function' ? (
              step.review(values)
            ) : (
              <DescriptionList
                layout="inline"
                items={(rows ?? []).map((row) => {
                  const value = values[row.name];
                  return {
                    term: row.label,
                    value: row.format ? row.format(value) : value === undefined || value === null || value === '' ? null : String(value),
                  };
                })}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

function FormWizard<TValues extends FieldValues>({ form, onSubmit, draftKey, className, children }: FormWizardProps<TValues>) {
  const { t } = useAppTranslation('common');
  const steps = readSteps(children, t('wizard.review'));
  const ids = steps.map((step) => step.id);
  const wizard = useWizardSteps(ids);
  const current = steps[wizard.index];
  const draft = useWizardDraft(draftKey, form, wizard.index, wizard.goTo);
  const isLast = wizard.index === steps.length - 1;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
    moved.current = true;
  }, [wizard.index]);

  const validateCurrent = async (): Promise<boolean> => {
    if (!current || current.kind !== 'step') return true;
    if (current.schema) {
      const result = current.schema.safeParse(form.getValues());
      if (result.success) return true;
      for (const issue of result.error.issues)
        form.setError(issue.path.join('.') as Path<TValues>, { type: 'wizard', message: issue.message });
      const first = result.error.issues[0]?.path.join('.');
      if (first) form.setFocus(first as Path<TValues>);
      return false;
    }
    if (current.fields?.length) return form.trigger(current.fields as Path<TValues>[], { shouldFocus: true });
    return true;
  };

  const goNext = async () => {
    if (!(await validateCurrent())) return;
    wizard.markCompleted(current.id);
    wizard.goTo(wizard.index + 1);
  };

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    draft.clear();
  });

  return (
    <FormProvider {...form}>
      <form
        data-slot="form-wizard"
        noValidate
        autoComplete="off"
        className={cn('flex flex-col gap-6', className)}
        onSubmit={(event) => {
          event.preventDefault();
          if (isLast) void submit(event);
          else void goNext();
        }}
      >
        <nav aria-label={t('wizard.steps')}>
          <p className="text-fg-muted text-xs sm:hidden">
            {t('wizard.stepOf', { current: wizard.index + 1, total: steps.length })} · {current?.title}
          </p>
          {/* An <ol> of steps (Stepper's root is a div, so its parts are composed into list items here). */}
          <ol aria-label={t('wizard.steps')} className="hidden w-full items-start gap-3 sm:flex">
            {steps.map((step, index) => {
              const status =
                index === wizard.index
                  ? 'current'
                  : wizard.errored.has(step.id)
                    ? 'error'
                    : wizard.completed.has(step.id)
                      ? 'done'
                      : 'next';
              return (
                <li key={step.id} className="flex flex-1 items-start gap-3 last:flex-none">
                  <Stepper.Step>
                    <button
                      type="button"
                      disabled={!wizard.canJumpTo(index)}
                      aria-current={index === wizard.index ? 'step' : undefined}
                      onClick={() => wizard.goTo(index)}
                      className="focus-ring flex flex-col items-center gap-1 rounded-sm disabled:cursor-not-allowed"
                    >
                      <Stepper.Icon status={status} />
                      <Stepper.Label className={cn(index === wizard.index ? 'text-fg' : 'text-fg-muted')}>{step.title}</Stepper.Label>
                    </button>
                  </Stepper.Step>
                  <Conditional.If condition={index < steps.length - 1}>
                    <div aria-hidden="true" className="flex flex-1 items-center pt-3">
                      <Divider />
                    </div>
                  </Conditional.If>
                </li>
              );
            })}
          </ol>
          <p className="text-fg-muted hidden text-xs sm:block">{t('wizard.stepOf', { current: wizard.index + 1, total: steps.length })}</p>
        </nav>

        <Conditional.If condition={draft.restored}>
          <Alert tone="info">
            <Alert.Description className="flex flex-wrap items-center gap-2">
              {t('wizard.draftRestored')}
              <Button type="button" variant="link" size="sm" onClick={draft.discard}>
                {t('wizard.discardDraft')}
              </Button>
            </Alert.Description>
          </Alert>
        </Conditional.If>

        <span aria-live="polite" className="sr-only">
          {moved.current && current
            ? t('wizard.stepAnnounce', { current: wizard.index + 1, total: steps.length, title: current.title })
            : ''}
        </span>

        <section data-slot="form-wizard-step" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 ref={headingRef} tabIndex={-1} className="text-fg text-lg font-semibold focus:outline-none">
                {current?.title}
              </h2>
              <Conditional.If condition={current?.kind === 'step' && !!current.optional}>
                <Badge variant="soft">{t('wizard.optional')}</Badge>
              </Conditional.If>
            </div>
            <Conditional.If condition={current?.kind === 'step' && !!current.description}>
              <p className="text-fg-muted text-sm">{current?.kind === 'step' ? current.description : ''}</p>
            </Conditional.If>
          </div>
          {/* Keyed by step: without it React reuses one step's field instances for the next step's fields,
              renaming them in place, which confuses react-hook-form's registrations. */}
          <Fragment key={current?.id}>
            {current?.kind === 'step' ? (
              current.children
            ) : (
              <ReviewPanel steps={steps.slice(0, wizard.index)} values={form.getValues() as Record<string, unknown>} onEdit={wizard.goTo} />
            )}
          </Fragment>
        </section>

        <div data-slot="form-wizard-actions" className="border-border-subtle flex items-center gap-2 border-t pt-4">
          <Conditional.If condition={wizard.index > 0}>
            <Button type="button" variant="outline" onClick={() => wizard.goTo(wizard.index - 1)}>
              <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              {t('wizard.back')}
            </Button>
          </Conditional.If>

          <div className="ms-auto flex items-center gap-2">
            <Conditional.If condition={current?.kind === 'step' && !!current.optional && !isLast}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  wizard.markCompleted(current.id);
                  wizard.goTo(wizard.index + 1);
                }}
              >
                {t('wizard.skip')}
              </Button>
            </Conditional.If>
            <Button type="submit" loading={isLast && form.formState.isSubmitting}>
              {isLast ? t('wizard.submit') : t('wizard.next')}
              <Conditional.If condition={!isLast}>
                <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </Conditional.If>
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

FormWizard.Step = FormWizardStep;
FormWizard.Review = FormWizardReview;

export default FormWizard;
