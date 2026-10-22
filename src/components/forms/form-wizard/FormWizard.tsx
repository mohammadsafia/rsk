'use client';

import { Children, type FormEvent, Fragment, isValidElement, type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react';
import { type FieldErrors, type FieldValues, FormProvider, type Path, type UseFormReturn } from 'react-hook-form';

import { Alert, Badge, Button } from '@components/ui';
import { ConfirmDialog, DescriptionList, Stepper } from '@components/shared';
import { Conditional } from '@components/utils';

import { useTravel } from '@hooks/motion';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { parseAsString, useQueryState } from 'nuqs';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { FormWizardReview, type FormWizardReviewProps, FormWizardStep, type FormWizardStepProps, type ReviewRows } from './parts';
import { FormWizardError } from './FormWizardError';
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
  /** Label of the final button, e.g. "Register patient". @default "Submit" */
  submitLabel?: string;
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

type SchemaLike = { shape?: Record<string, unknown>; in?: SchemaLike; _zod?: { def?: { in?: SchemaLike; innerType?: SchemaLike } } };

/** The object shape of a step schema, looking through wrappers: `.refine()` keeps the object, `.transform()`/`.pipe()` put it at `.in`. */
export const schemaShape = (schema: unknown): Record<string, unknown> | undefined => {
  let current = schema as SchemaLike | undefined;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current.shape) return current.shape;
    current = current.in ?? current._zod?.def?.in ?? current._zod?.def?.innerType;
  }
  return undefined;
};

/** Field paths a step owns, for validation and error routing. */
export const stepFields = (step: WizardStep): string[] => {
  if (step.kind !== 'step') return [];
  const shape = schemaShape(step.schema);
  return shape ? Object.keys(shape) : (step.fields ?? []);
};

/** A step owns an error path when one is the other or contains it (`address` ↔ `address.city`). */
const ownsPath = (field: string, path: string) => field === path || path.startsWith(`${field}.`) || field.startsWith(`${path}.`);

const stepOwns = (step: WizardStep, path: string) => stepFields(step).some((field) => ownsPath(field, path));

/** react-hook-form errors as dotted paths with their messages (nested objects and arrays flattened). */
const flattenErrors = (errors: unknown, prefix = ''): Record<string, string> => {
  if (!errors || typeof errors !== 'object') return {};
  const entry = errors as { message?: unknown; type?: unknown };
  if (typeof entry.message === 'string' && entry.message && prefix) return { [prefix]: entry.message };
  return Object.entries(errors).reduce<Record<string, string>>((all, [key, value]) => {
    if (key === 'ref' || key === 'type' || key === 'message' || key === 'types') return all;
    return { ...all, ...flattenErrors(value, prefix ? `${prefix}.${key}` : key) };
  }, {});
};

/**
 * Keeps ?step=<id> in sync. A component of its own so wizards without urlSync never need a nuqs adapter.
 * On mount a URL step is honoured only if reachable; otherwise the wizard opens the first incomplete step.
 */
function WizardUrlSync({
  ids,
  index,
  canJumpTo,
  completed,
  goTo,
}: {
  ids: string[];
  index: number;
  canJumpTo: (i: number) => boolean;
  completed: ReadonlySet<string>;
  goTo: (i: number) => void;
}) {
  const [step, setStep] = useQueryState('step', parseAsString);
  const started = useRef(false);
  const wrote = useRef(false);
  /**
   * The URL can trail the wizard: while a write is on its way it may show an older step (an echo of an earlier write,
   * or the old URL re-read), and a write's echo can land in the same render as the next move. Following those would
   * move back, write again and chase its own tail. So the URL is followed only when it shows a step other than the
   * last one the two agreed on (`agreed`), and only while none of this component's writes is in flight.
   */
  const inFlight = useRef(0);
  const agreed = useRef<string | null>(null);
  const write = (id: string | null, history: 'push' | 'replace') => {
    agreed.current = id;
    inFlight.current += 1;
    void setStep(id, { history }).finally(() => {
      // Let the landed write's own echo render before following the URL again.
      setTimeout(() => {
        inFlight.current -= 1;
      }, 0);
    });
  };

  // Reads the URL: on mount, then whenever it changes (browser Back / Forward). Unreachable steps are refused.
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      const target = step ? ids.indexOf(step) : -1;
      if (target >= 0 && canJumpTo(target)) {
        agreed.current = step;
        goTo(target);
      } else
        goTo(
          Math.max(
            0,
            ids.findIndex((id) => !completed.has(id)),
          ),
        );
      return;
    }
    if (!step || step === agreed.current || inFlight.current > 0) return;
    const target = ids.indexOf(step);
    agreed.current = step;
    if (target === index) return;
    if (target >= 0 && canJumpTo(target)) goTo(target);
    else write(ids[index] ?? null, 'replace');
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- follow the URL only when it changes
  }, [step]);

  // Writes the URL when the wizard moves: the first write corrects the entry, later ones add history.
  useEffect(() => {
    if (ids[index] && ids[index] !== step) write(ids[index], wrote.current ? 'push' : 'replace');
    wrote.current = true;
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- write only when the wizard moves
  }, [index]);

  return null;
}

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

function FormWizard<TValues extends FieldValues>({
  form,
  onSubmit,
  draftKey,
  urlSync = false,
  onCancel,
  submitLabel,
  className,
  children,
}: FormWizardProps<TValues>) {
  const { t } = useAppTranslation('common');
  const steps = readSteps(children, t('wizard.review'));
  const ids = steps.map((step) => step.id);
  const wizard = useWizardSteps(ids);
  const current = steps[wizard.index];
  // A draft's step may exist only once its restored values apply (a `condition` step), so it's opened by id once
  // the steps re-render; if it never appears, the wizard opens the first step the draft hasn't completed.
  const [pendingRestore, setPendingRestore] = useState<{ stepId: string | undefined; completed: string[]; waited: boolean } | null>(null);
  const draft = useWizardDraft(draftKey, form, { stepId: wizard.currentId, completed: wizard.completed }, (stepId, completedIds) =>
    setPendingRestore({ stepId, completed: completedIds, waited: false }),
  );
  const idsKey = ids.join(',');
  useEffect(() => {
    if (!pendingRestore) return;
    const target = pendingRestore.stepId ? ids.indexOf(pendingRestore.stepId) : 0;
    if (target === -1 && !pendingRestore.waited) {
      // Give the restored values one render to add conditional steps.
      setPendingRestore({ ...pendingRestore, waited: true });
      return;
    }
    const fallback = Math.max(
      0,
      ids.findIndex((id) => !pendingRestore.completed.includes(id)),
    );
    wizard.restore(target === -1 ? fallback : target, pendingRestore.completed);
    setPendingRestore(null);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- re-run when the step list or the pending restore changes
  }, [pendingRestore, idsKey]);
  const [formError, setFormError] = useState<string[] | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  // Read during render so react-hook-form tracks dirtiness (formState is a subscription proxy).
  const isDirty = form.formState.isDirty;

  /**
   * Sends field errors to the first visible step that owns one. Messages no visible step owns show as a form-level
   * alert, and are never set on the form: an error on an unregistered name would block every later submit.
   */
  const routeErrors = (messages: Record<string, string>, { setOnFields }: { setOnFields: boolean }) => {
    const owned = Object.entries(messages).filter(([path]) => steps.some((step) => stepOwns(step, path)));
    const unowned = Object.entries(messages).filter(([path]) => !steps.some((step) => stepOwns(step, path)));
    if (setOnFields) for (const [path, message] of owned) form.setError(path as Path<TValues>, { type: 'server', message });
    setFormError(unowned.length ? unowned.map(([, message]) => message) : null);
    const owners = steps.map((step, index) => ({ step, index })).filter(({ step }) => owned.some(([path]) => stepOwns(step, path)));
    if (owners.length === 0) return;
    wizard.markErrored(owners.map(({ step }) => step.id));
    wizard.goTo(owners[0].index);
  };
  const isLast = wizard.index === steps.length - 1;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepRef = useRef<HTMLElement>(null);
  useTravel(stepRef, wizard.index);
  const shownIndex = useRef(wizard.index);
  const [announcement, setAnnouncement] = useState('');

  // Only a real move focuses the heading and announces it (not the mount, nor StrictMode's repeated mount effect).
  useEffect(() => {
    if (shownIndex.current === wizard.index) return;
    shownIndex.current = wizard.index;
    headingRef.current?.focus();
    if (current) setAnnouncement(t('wizard.stepAnnounce', { current: wizard.index + 1, total: steps.length, title: current.title }));
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- announce on moves only
  }, [wizard.index]);

  /** Validates one step. Messages without a field path (object-level refine) come back as `general`. */
  const validateStep = async (step: WizardStep | undefined, { focus }: { focus: boolean }) => {
    if (!step || step.kind !== 'step') return { ok: true, general: [] as string[] };
    const owned = stepFields(step);
    if (owned.length) form.clearErrors(owned as Path<TValues>[]);
    if (step.schema) {
      const result = step.schema.safeParse(form.getValues());
      if (result.success) return { ok: true, general: [] };
      const general: string[] = [];
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (path) form.setError(path as Path<TValues>, { type: 'wizard', message: issue.message });
        else general.push(issue.message);
      }
      const first = result.error.issues.find((issue) => issue.path.length)?.path.join('.');
      if (focus && first) form.setFocus(first as Path<TValues>);
      return { ok: false, general };
    }
    if (step.fields?.length) return { ok: await form.trigger(step.fields as Path<TValues>[], { shouldFocus: focus }), general: [] };
    return { ok: true, general: [] };
  };

  /**
   * Moves to another step. Forward moves (Next, the stepper) validate the current step first. Back never blocks, but a
   * passed step left invalid loses its "done" status, so the steps after it lock until it passes again.
   */
  /** Optional steps the user skipped: submit doesn't hold the form back on them until they're filled in through Next. */
  const skipped = useRef(new Set<string>());

  const moveTo = async (target: number) => {
    if (target === wizard.index || !current) return;
    if (target < wizard.index) {
      if (current.kind === 'step' && wizard.completed.has(current.id) && !(await validateStep(current, { focus: false })).ok)
        wizard.markInvalid([current.id]);
      wizard.goTo(target);
      return;
    }
    const result = await validateStep(current, { focus: true });
    setFormError(result.general.length ? result.general : null);
    if (!result.ok) return;
    skipped.current.delete(current.id);
    wizard.markCompleted(current.id);
    wizard.goTo(target);
  };

  const submit = form.handleSubmit(
    async (values) => {
      setFormError(null);
      try {
        await onSubmit(values);
        draft.clear();
      } catch (error) {
        if (!(error instanceof FormWizardError)) throw error;
        routeErrors(error.fieldErrors, { setOnFields: true });
      }
    },
    (errors: FieldErrors<TValues>) => routeErrors(flattenErrors(errors), { setOnFields: false }),
  );

  /** Re-checks every visible step (the last one included) before handing the values to react-hook-form's submit. */
  const submitAll = async (event: FormEvent<HTMLFormElement>) => {
    for (const [index, step] of steps.entries()) {
      if (step.kind !== 'step' || (index !== wizard.index && !step.schema) || skipped.current.has(step.id)) continue;
      const result = await validateStep(step, { focus: index === wizard.index });
      if (result.ok) continue;
      setFormError(result.general.length ? result.general : null);
      if (index !== wizard.index) {
        wizard.markInvalid([step.id]);
        wizard.goTo(index);
      }
      return;
    }
    // Every step passed: drop stale errors (e.g. from a rejected submit) so the resolver or rules decide afresh.
    form.clearErrors();
    await submit(event);
  };

  return (
    <FormProvider {...form}>
      <form
        data-slot="form-wizard"
        noValidate
        autoComplete="off"
        className={cn('flex flex-col gap-6', className)}
        onSubmit={(event) => {
          event.preventDefault();
          if (isLast) void submitAll(event);
          else void moveTo(wizard.index + 1);
        }}
      >
        <nav aria-label={t('wizard.steps')}>
          <p className="text-fg-muted text-xs sm:hidden">
            {t('wizard.stepOf', { current: wizard.index + 1, total: steps.length })} · {current?.title}
          </p>
          {/* An <ol> of steps (Stepper's root is a div, so its parts are composed into list items here). */}
          <ol aria-label={t('wizard.steps')} className="hidden w-full items-start gap-3 sm:flex">
            {steps.map((step, index) => {
              // An errored step keeps its error icon while current, until Next passes it again.
              const status = wizard.errored.has(step.id)
                ? 'error'
                : index === wizard.index
                  ? 'current'
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
                      onClick={() => void moveTo(index)}
                      className="focus-ring flex flex-col items-center gap-1 rounded-sm disabled:cursor-not-allowed"
                    >
                      <Stepper.Icon status={status} />
                      <Stepper.Label className={cn(index === wizard.index ? 'text-fg' : 'text-fg-muted')}>{step.title}</Stepper.Label>
                    </button>
                  </Stepper.Step>
                  <Conditional.If condition={index < steps.length - 1}>
                    <Stepper.Connector done={status === 'done'} />
                  </Conditional.If>
                </li>
              );
            })}
          </ol>
          {/* The stepper shows position visually; keep the count for screen readers. */}
          <p className="sr-only">{t('wizard.stepOf', { current: wizard.index + 1, total: steps.length })}</p>
        </nav>

        <Conditional.If condition={urlSync}>
          <WizardUrlSync ids={ids} index={wizard.index} canJumpTo={wizard.canJumpTo} completed={wizard.completed} goTo={wizard.goTo} />
        </Conditional.If>

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
          {announcement}
        </span>

        <section ref={stepRef} data-slot="form-wizard-step" className="flex flex-col gap-4">
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
              <ReviewPanel
                steps={steps.slice(0, wizard.index)}
                values={form.getValues() as Record<string, unknown>}
                onEdit={(index) => void moveTo(index)}
              />
            )}
          </Fragment>
        </section>

        <Conditional.If condition={!!formError}>
          <Alert tone="danger">
            <Alert.Title>{t('wizard.submitFailed')}</Alert.Title>
            <Alert.Description>{formError?.join(' ')}</Alert.Description>
          </Alert>
        </Conditional.If>

        <div data-slot="form-wizard-actions" className="border-border-subtle flex items-center gap-2 border-t pt-4">
          <Conditional.If condition={!!onCancel}>
            <Button type="button" variant="ghost" onClick={() => (isDirty ? setConfirmCancel(true) : onCancel?.())}>
              {t('cancel')}
            </Button>
          </Conditional.If>

          <Conditional.If condition={wizard.index > 0}>
            <Button type="button" variant="outline" onClick={() => void moveTo(wizard.index - 1)}>
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
                  skipped.current.add(current.id);
                  form.clearErrors();
                  wizard.markCompleted(current.id);
                  wizard.goTo(wizard.index + 1);
                }}
              >
                {t('wizard.skip')}
              </Button>
            </Conditional.If>
            <Button type="submit" loading={isLast && form.formState.isSubmitting}>
              {isLast ? (submitLabel ?? t('wizard.submit')) : t('wizard.next')}
              <Conditional.If condition={!isLast}>
                <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </Conditional.If>
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        tone="warning"
        title={t('form.discardTitle')}
        description={t('form.discardDescription')}
        confirmLabel={t('form.discardConfirm')}
        cancelLabel={t('form.keepEditing')}
        onConfirm={() => onCancel?.()}
      >
        {null}
      </ConfirmDialog>
    </FormProvider>
  );
}

FormWizard.Step = FormWizardStep;
FormWizard.Review = FormWizardReview;

export default FormWizard;
