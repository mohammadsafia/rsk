# Kit depth — Plan C: FormWizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `FormWizard` in `@components/forms` with these parts:
- **Stepper indicator:** the existing Stepper, showing each step's status.
- **Per-step validation** and locked forward navigation.
- **Steps:** optional and conditional steps.
- **Review step:** with an Edit link per step.
- **Session draft:** saved, restored and discardable.
- **Server-error mapping:** errors on submit route back to the step that owns them.
- **Cancel:** confirmed when the form is dirty.
- **Opt-in `?step=` URL sync.**

**Architecture:** `FormWizard` owns one react-hook-form instance (passed in as `form`) and renders its own `FormProvider` + `<form>`, so it can use `handleSubmit(onValid, onInvalid)`. `FormWizard.Step` and `FormWizard.Review` are marker components: the wizard reads their props through `Children` and renders only the current step's children. Step state lives in `useWizardSteps` (current index, completed and errored sets, jump rules), so it can be tested on its own. The draft lives in `useWizardDraft`.

**Tech Stack:** React 18, react-hook-form 7, zod 3, nuqs 2, Tailwind v4 tokens, react-i18next, Vitest + Testing Library (happy-dom), MDX docs.

**Spec:** `docs/superpowers/specs/2026-10-16-kit-depth-design.md` (Plan C section).

## Global Constraints

- Semantic tokens only; the `ds:baseline` stays `{}`. Every field keeps Input's height. No coloured side stripes.
- English and Arabic for all copy; RTL-correct (Stepper runs right to left, Next/Back arrows mirror); Western digits.
- Tests come first for every behaviour (TDD). The docs page follows the enforced anatomy. `docs:lint` and the render-all test pass.
- Docs stay dev-only. No new dependencies.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `P() { corepack pnpm@10.34.7 "$@"; }`.
- Run `tsc` unpiped (`P exec tsc -b`) so a type error fails the step.
- For new MDX pages, run `rm -rf node_modules/.vitest-cache node_modules/.vite node_modules/.vite-temp` before tests.

## Spec deviations (rulings, decided here)

- **Fields for a step without a schema:** the spec says "or `form.trigger` on the fields registered inside the step". Finding registered fields at runtime is unreliable, so a step lists them instead: `fields?: string[]`. `schema` takes priority over `fields`. Field ownership for error routing uses `fields` or the schema's top-level keys.
- **Review labels:** the spec says "labels from the fields' `label`". Field labels aren't readable from outside the field components, so a step gives its summary rows as `review?: { name: string; label: string; format?: (value) => ReactNode }[] | ((values) => ReactNode)`. Without it, the step's field names are shown as labels.

## Review Focus

1. **Refresh on a locked step.** With `urlSync`, opening `?step=documents` before the earlier steps are valid lands on the first incomplete step, not the locked one. → Task 5 test.
2. **Files in drafts.** `File` or `FileList` values are not written to sessionStorage. Restoring a draft never throws on them; it restores the other fields and leaves the file fields empty. → Task 3 test.
3. **Corrupt or old draft JSON.** Unparseable stored JSON is ignored and removed, not crashing the form. → Task 3 test.
4. **Going back never validates.** Back from an invalid step moves without showing errors. → Task 1 test.
5. **Field errors on a hidden step.** A server error for a field on a step hidden by `condition` doesn't jump to a step that doesn't exist; it stays on the review step with a form-level alert. → Task 4 test.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/forms/form-wizard/FormWizard.tsx` | root: steps from children, nav bar, stepper, footer, submit |
| `src/components/forms/form-wizard/parts.tsx` | `FormWizardStep`, `FormWizardReview` markers + their prop types |
| `src/components/forms/form-wizard/useWizardSteps.ts` | step state machine |
| `src/components/forms/form-wizard/useWizardDraft.ts` | sessionStorage draft |
| `src/components/forms/form-wizard/FormWizardError.ts` | throwable field-error map |
| `src/components/forms/form-wizard/{FormWizard,draft,steps}.test.tsx` | tests |
| `src/components/forms/form-wizard/index.ts`, `src/components/forms/index.ts` | exports |
| `src/locales/{en,ar}/common.json` | `wizard.*` |
| `src/component-docs/forms/FormWizard.mdx` | docs (patient intake) |

---

### Task 1: Steps, navigation and submit

**Interfaces — produces:**
- `FormWizard<TValues extends FieldValues>(props: { form: UseFormReturn<TValues>; onSubmit: (values: TValues) => void | Promise<void>; draftKey?: string; urlSync?: boolean; onCancel?: () => void; className?: string; children: ReactNode })`
- `FormWizard.Step` with props `{ id: string; title: string; description?: string; schema?: ZodTypeAny; fields?: string[]; optional?: boolean; condition?: boolean; review?: ReviewRows | ((values) => ReactNode); children: ReactNode }`
- `FormWizard.Review` with props `{ title?: string }`
- `useWizardSteps(ids: string[]): { index; currentId; completed: ReadonlySet<string>; errored: ReadonlySet<string>; canJumpTo(i); goTo(i); next(); back(); markCompleted(id); markErrored(ids: string[]); clearErrored(id) }`

- [ ] **Step 1: Locale keys** — en `common.json`:

```json
  "wizard": {
    "next": "Next",
    "back": "Back",
    "skip": "Skip",
    "submit": "Submit",
    "edit": "Edit",
    "review": "Review",
    "stepOf": "Step {{current}} of {{total}}",
    "stepAnnounce": "Step {{current}} of {{total}}, {{title}}",
    "optional": "Optional",
    "draftRestored": "Draft restored from your last visit.",
    "discardDraft": "Discard",
    "submitFailed": "Some details need attention before you can submit.",
    "steps": "Steps"
  },
```

ar:

```json
  "wizard": {
    "next": "التالي",
    "back": "رجوع",
    "skip": "تخطي",
    "submit": "إرسال",
    "edit": "تعديل",
    "review": "المراجعة",
    "stepOf": "الخطوة {{current}} من {{total}}",
    "stepAnnounce": "الخطوة {{current}} من {{total}}، {{title}}",
    "optional": "اختياري",
    "draftRestored": "تمت استعادة المسودة من زيارتك الأخيرة.",
    "discardDraft": "تجاهل",
    "submitFailed": "بعض التفاصيل تحتاج إلى مراجعة قبل الإرسال.",
    "steps": "الخطوات"
  },
```

- [ ] **Step 2: Failing tests** — `src/components/forms/form-wizard/FormWizard.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import { Tooltip } from '@components/ui';
import { FormInput, FormWizard } from '@components/forms';

import '../../../i18n';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

type Values = { name: string; phone: string; insurer: string; notes: string };

function Intake({ onSubmit = vi.fn() }: { onSubmit?: (values: Values) => void }) {
  const form = useForm<Values>({ defaultValues: { name: '', phone: '', insurer: '', notes: '' } });
  return (
    <MemoryRouter>
      <Tooltip.Provider>
        <FormWizard form={form} onSubmit={onSubmit}>
          <FormWizard.Step id="patient" title="Patient" schema={z.object({ name: z.string().min(1, 'Enter the name') })}>
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="contact" title="Contact" fields={['phone']}>
            <FormInput name="phone" label="Phone" rules={{ required: 'Enter a phone number' }} />
          </FormWizard.Step>
          <FormWizard.Step id="notes" title="Notes">
            <FormInput name="notes" label="Notes" />
          </FormWizard.Step>
        </FormWizard>
      </Tooltip.Provider>
    </MemoryRouter>
  );
}

const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }));

describe('FormWizard navigation', () => {
  it('shows one step at a time with a stepper, a caption and the step heading', () => {
    render(<Intake />);
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(screen.queryByLabelText('Phone')).toBeNull();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Steps' }).querySelectorAll('li')).toHaveLength(3);
  });

  it('validates only the current step with its schema, showing the error and focusing the field', async () => {
    render(<Intake />);
    next();
    expect(await screen.findByText('Enter the name')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Full name')));
  });

  it('moves on when valid, focuses the new heading and announces the step', async () => {
    render(<Intake />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara Haddad' } });
    next();
    const heading = await screen.findByRole('heading', { name: 'Contact' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('Step 2 of 3, Contact');
  });

  it('validates a schema-less step through its listed fields', async () => {
    render(<Intake />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    next();
    expect(await screen.findByText('Enter a phone number')).toBeTruthy();
  });

  it('goes back without validating', async () => {
    render(<Intake />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(screen.queryByText('Enter a phone number')).toBeNull();
  });

  it('lets completed steps be revisited from the stepper but keeps later ones locked', async () => {
    render(<Intake />);
    const stepButton = (name: string) => screen.getByRole('button', { name: new RegExp(name) });
    expect(stepButton('Contact').hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.click(stepButton('Patient'));
    expect(await screen.findByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(stepButton('Notes').hasAttribute('disabled')).toBe(true);
  });

  it('submits from the last step with the whole form', async () => {
    const onSubmit = vi.fn();
    render(<Intake onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0790000000' } });
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sara', phone: '0790000000' }));
  });
});
```

- [ ] **Step 3: Run it** — `P exec vp test --run src/components/forms/form-wizard` → Expected: FAIL (`FormWizard` not exported).

- [ ] **Step 4: Implement**

`parts.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { ZodTypeAny } from 'zod';

export type ReviewRows = { name: string; label: string; format?: (value: unknown) => ReactNode }[];

export type FormWizardStepProps = {
  id: string;
  title: string;
  description?: string;
  /** Validates this step's values on Next; takes priority over `fields`. */
  schema?: ZodTypeAny;
  /** Field paths validated with form.trigger on Next when there is no schema. */
  fields?: string[];
  optional?: boolean;
  /** false hides the step entirely. */
  condition?: boolean;
  /** Summary rows (or a renderer) for FormWizard.Review. */
  review?: ReviewRows | ((values: Record<string, unknown>) => ReactNode);
  children?: ReactNode;
};

export type FormWizardReviewProps = { title?: string };

/** Marker: FormWizard reads its props; it renders its children only while current. */
export function FormWizardStep({ children }: FormWizardStepProps) {
  return <>{children}</>;
}

export function FormWizardReview(_props: FormWizardReviewProps) {
  return null;
}
```

`useWizardSteps.ts`:

```ts
import { useCallback, useState } from 'react';

/** Current step, completed/errored sets and the jump rule: a step is reachable when every earlier step is completed. */
export function useWizardSteps(ids: string[], initialIndex = 0) {
  const [index, setIndex] = useState(initialIndex);
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
  const [errored, setErrored] = useState<ReadonlySet<string>>(new Set());

  const safeIndex = Math.min(index, Math.max(0, ids.length - 1));
  const canJumpTo = useCallback((target: number) => target <= safeIndex || ids.slice(0, target).every((id) => completed.has(id)), [ids, completed, safeIndex]);

  return {
    index: safeIndex,
    currentId: ids[safeIndex],
    completed,
    errored,
    canJumpTo,
    goTo: (target: number) => setIndex(Math.max(0, Math.min(ids.length - 1, target))),
    markCompleted: (id: string) => {
      setCompleted((current) => new Set(current).add(id));
      setErrored((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    },
    markErrored: (stepIds: string[]) => setErrored((current) => new Set([...current, ...stepIds])),
  };
}
```

`FormWizard.tsx`:

```tsx
import { Children, isValidElement, type ReactElement, type ReactNode, useEffect, useRef } from 'react';
import { type FieldValues, FormProvider, type Path, type UseFormReturn } from 'react-hook-form';

import { Button } from '@components/ui';
import { Stepper } from '@components/shared';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { FormWizardReview, type FormWizardReviewProps, FormWizardStep, type FormWizardStepProps } from './parts';
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

type WizardStep = FormWizardStepProps & { kind: 'step' } | (FormWizardReviewProps & { kind: 'review'; id: string; title: string });

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

function FormWizard<TValues extends FieldValues>({ form, onSubmit, className, children }: FormWizardProps<TValues>) {
  const { t } = useAppTranslation('common');
  const steps = readSteps(children, t('wizard.review'));
  const ids = steps.map((step) => step.id);
  const wizard = useWizardSteps(ids);
  const current = steps[wizard.index];
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
      for (const issue of result.error.issues) form.setError(issue.path.join('.') as Path<TValues>, { type: 'wizard', message: issue.message });
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
          <ol aria-label={t('wizard.steps')} className="hidden sm:block">
            <Stepper>
              {steps.map((step, index) => {
                const status = index === wizard.index ? 'current' : wizard.errored.has(step.id) ? 'error' : wizard.completed.has(step.id) ? 'done' : 'next';
                return (
                  <li key={step.id} className="contents">
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
                  </li>
                );
              })}
            </Stepper>
          </ol>
          <p className="text-fg-muted hidden text-xs sm:block">{t('wizard.stepOf', { current: wizard.index + 1, total: steps.length })}</p>
        </nav>

        <span aria-live="polite" className="sr-only">
          {moved.current && current ? t('wizard.stepAnnounce', { current: wizard.index + 1, total: steps.length, title: current.title }) : ''}
        </span>

        <section data-slot="form-wizard-step" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 ref={headingRef} tabIndex={-1} className="text-fg text-lg font-semibold focus:outline-none">
              {current?.title}
            </h2>
            <Conditional.If condition={current?.kind === 'step' && !!current.description}>
              <p className="text-fg-muted text-sm">{current?.kind === 'step' ? current.description : ''}</p>
            </Conditional.If>
          </div>
          {current?.kind === 'step' ? current.children : null}
        </section>

        <div data-slot="form-wizard-actions" className="border-border-subtle flex items-center gap-2 border-t pt-4">
          <Conditional.If condition={wizard.index > 0}>
            <Button type="button" variant="outline" onClick={() => wizard.goTo(wizard.index - 1)}>
              <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              {t('wizard.back')}
            </Button>
          </Conditional.If>

          <div className="ms-auto flex items-center gap-2">
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
```

Notes:
- The test checks for `role="list"` named "Steps". A `<Stepper>` (a div) inside an `<ol>` would make invalid list markup. Instead, render the stepper's step elements so each `li` is a direct child of the `ol`: give `Stepper` an `as="ol"` prop, or render `Stepper.Step` inside `li`s in an `ol` that has the stepper classes. Pick whichever keeps the Stepper's divider rendering, and ledger the choice.
- The live region must only announce after a move (the `moved` ref). If the ref read during render is stale, use a `useState` flag set in the effect instead.

`index.ts`:

```ts
export { default as FormWizard, type FormWizardProps } from './FormWizard';
export { type FormWizardStepProps, type FormWizardReviewProps, type ReviewRows } from './parts';
```

Add `export * from './form-wizard';` to `src/components/forms/index.ts`.

- [ ] **Step 5: Run it** — `P exec vp test --run src/components/forms/form-wizard tests/i18n && P exec tsc -b` → Expected: PASS.

- [ ] **Step 6: Commit** — `git add src/components/forms src/locales && git commit -m "feat(forms): FormWizard — steps, per-step validation, locked stepper, focus and announcements, submit"` (with trailer).

---

### Task 2: Optional, conditional and review steps

**Tests** (add to `FormWizard.test.tsx`, a new `describe('FormWizard steps')` with its own harness):

```tsx
type Intake2 = { name: string; insured: boolean; insurer: string; notes: string };

function ReviewHarness({ insured = true }: { insured?: boolean }) {
  const form = useForm<Intake2>({ defaultValues: { name: 'Sara Haddad', insured, insurer: '', notes: '' } });
  return (
    <MemoryRouter>
      <Tooltip.Provider>
        <FormWizard form={form} onSubmit={vi.fn()}>
          <FormWizard.Step id="patient" title="Patient" fields={['name']} review={[{ name: 'name', label: 'Full name' }]}>
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="insurance" title="Insurance" optional condition={insured} review={[{ name: 'insurer', label: 'Insurer' }]}>
            <FormInput name="insurer" label="Insurer" />
          </FormWizard.Step>
          <FormWizard.Review />
        </FormWizard>
      </Tooltip.Provider>
    </MemoryRouter>
  );
}

describe('FormWizard steps', () => {
  it('skips an optional step without validating it', async () => {
    render(<ReviewHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' });
    expect(screen.getByText('Optional')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeTruthy();
  });

  it('hides a step whose condition is false', () => {
    render(<ReviewHarness insured={false} />);
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('summarises every step with Edit links that jump back', async () => {
    render(<ReviewHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' });
    fireEvent.change(screen.getByLabelText('Insurer'), { target: { value: 'Jordan Health Mutual' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Review' });

    expect(screen.getByText('Full name').closest('dl')?.textContent).toContain('Sara Haddad');
    expect(screen.getByText('Jordan Health Mutual')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Insurance' }));
    expect(await screen.findByRole('heading', { name: 'Insurance' })).toBeTruthy();
  });
});
```

**Implement:**
- Show an "Optional" `Badge` next to the step heading.
- When the current step is optional, render a Skip button (`variant="ghost"`) before Next. It calls `wizard.markCompleted(current.id); wizard.goTo(index + 1)` without validating.
- When `current.kind === 'review'`, render a `FormWizardReviewPanel` (in `FormWizard.tsx`). For each earlier step it renders:
  - a header row with the step title and an `IconButton`-less `Button variant="link" size="sm" aria-label={`${t('wizard.edit')} ${title}`}` that calls `wizard.goTo(index)`;
  - then either `step.review(values)` when it's a function, or a `DescriptionList layout="inline"` built from the rows (`term: label`, `value: format ? format(v) : String(v ?? '') || '—'`). Without `review`, use `stepFields(step).map((name) => ({ name, label: name }))`.

Commit message: `feat(forms): FormWizard optional, conditional and review steps`.

---

### Task 3: Session draft

**Interfaces — produces:** `useWizardDraft(key: string | undefined, form: UseFormReturn, stepIndex: number, setStepIndex: (i: number) => void): { restored: boolean; discard(): void; clear(): void }`; storage key `rsk:wizard:<key>`, value `{ values, step }` JSON.

**Tests** — `draft.test.tsx` (harness: the Task 1 `Intake` with `draftKey="intake"`, plus a `FormFileUploader`-free field `photo` set to a `File` through `form.setValue`):

```tsx
it('saves values (not files) to sessionStorage, debounced', async () => {
  render(<DraftHarness />);
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
  await waitFor(() => expect(JSON.parse(sessionStorage.getItem('rsk:wizard:intake')!).values.name).toBe('Sara'), { timeout: 2000 });
  expect(JSON.parse(sessionStorage.getItem('rsk:wizard:intake')!).values.photo).toBeUndefined();
});

it('restores a draft with a notice, and Discard resets the form and removes it', async () => {
  sessionStorage.setItem('rsk:wizard:intake', JSON.stringify({ values: { name: 'Omar' }, step: 0 }));
  render(<DraftHarness />);
  expect(await screen.findByText('Draft restored from your last visit.')).toBeTruthy();
  expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe('Omar');
  fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
  expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe('');
  expect(sessionStorage.getItem('rsk:wizard:intake')).toBeNull();
});

it('ignores and removes corrupt draft JSON', () => {
  sessionStorage.setItem('rsk:wizard:intake', '{not json');
  render(<DraftHarness />);
  expect(screen.queryByText('Draft restored from your last visit.')).toBeNull();
  expect(sessionStorage.getItem('rsk:wizard:intake')).toBeNull();
});

it('clears the draft after a successful submit', async () => { /* fill all steps, submit, expect getItem → null */ });
```

**Implement** — `useWizardDraft.ts`:
- **On mount:** read the key inside `try`. On a parse failure, remove the key. If it exists, `form.reset({ ...form.formState.defaultValues, ...values })`, set the step (clamped), and set `restored`.
- **Saving:** subscribe with `form.watch((values) => …)`, debounced 400 ms. Write `{ values: stripFiles(values), step }`, where `stripFiles` drops `File`, `Blob` and `FileList` values recursively, including inside arrays.
- **`discard()`:** `form.reset(defaultValues)`, remove the key, set `restored` to false.
- **`clear()`:** remove the key.
- **Errors:** every storage access sits in `try`/`catch`; private mode or full storage is ignored.

FormWizard renders an `Alert tone="info"` with the notice and a Discard `Button variant="link"` while `restored`, and calls `clear()` after `onSubmit` resolves.

Commit message: `feat(forms): FormWizard session draft — save, restore, discard, cleared on submit`.

---

### Task 4: Submit errors and cancel

**Interfaces — produces:** `class FormWizardError extends Error { fieldErrors: Record<string, string> }`, exported from `@components/forms`.

**Tests** (in `FormWizard.test.tsx`):
- **Server errors route back to their step:**
  1. Fill all steps.
  2. Submit with an `onSubmit` that throws `new FormWizardError({ phone: 'Number already registered' })`.
  3. Expect the Contact heading, the message under Phone, and the Contact stepper item in error status (`[data-slot="stepper-step"] svg.text-danger`).
- **Invalid on final validation:** with a resolver that rejects `name` at submit, the wizard jumps to Patient.
- **Error for a hidden step's field:** `throw new FormWizardError({ insurer: 'Unknown insurer' })` while the Insurance step is hidden. The wizard stays on the current step and shows `Alert tone="danger"` with `wizard.submitFailed` and the message.
- **Cancel:**
  - With `onCancel`, a Cancel button shows. On a dirty form it opens the discard ConfirmDialog (reuse `form.discard*` keys); confirming calls `onCancel`.
  - On a pristine form, Cancel calls `onCancel` directly.

**Implement:**
- **Submit:** wrap `onSubmit` in `try`/`catch`. On a `FormWizardError`, `setError` for each field. Find the first visible step whose `stepFields` include an errored field; `markErrored` those steps and `goTo` the first. If no visible step owns the field, set a `formError` state shown as a danger Alert above the actions.
- **Final validation:** `form.handleSubmit(onValid, onInvalid)`. `onInvalid(errors)` routes `Object.keys(errors)` the same way.
- **Cancel:** render the button when `onCancel` is set, before Back. Use `ConfirmDialog` controlled by `open`, the same as `FormContainerActions`.

Commit message: `feat(forms): FormWizard maps submit errors back to their steps and confirms cancel`.

---

### Task 5: URL sync

**Tests** (in `FormWizard.test.tsx`, wrapping in `NuqsTestingAdapter` with `searchParams="?step=contact"` and `onUrlUpdate` spy):

- `urlSync` writes `?step=<id>` on every move (spy receives `step=contact` after Next).
- Opening at `?step=notes` with earlier steps incomplete lands on the first incomplete step (Patient) and rewrites the param.
- Without `urlSync`, the URL is never touched.

**Implement:**
- `useQueryState('step', parseAsString)` from nuqs, used only when `urlSync`. Call the hook unconditionally, and ignore its value when `urlSync` is false.
- **On mount:** if the URL step exists and `canJumpTo(index)`, go there; otherwise go to the first step that isn't completed.
- **On every index change:** with `urlSync`, `setStep(currentId)`.

Commit message: `feat(forms): FormWizard opt-in ?step= URL sync that respects locked steps`.

---

### Task 6: Docs page

Create `src/component-docs/forms/FormWizard.mdx` (`category: Forms`, `id: form-wizard`). It's a patient intake demo exported in the MDX, with these steps:
- **Patient:** a schema for name and date of birth.
- **Contact:** fields for phone and email.
- **Insurance:** optional, shown only when "Has insurance" is checked on the Patient step.
- **Documents:** a `FormFileUploader`.
- **Review.**

Settings: `draftKey="docs-intake"` and an `onSubmit` that resolves after 800 ms. The Code tab uses `demoSource('IntakeDemo', pageSource)` with `import pageSource from './FormWizard.mdx?raw'`.

Page sections:
- `## Steps and validation` (the demo)
- `## Review`
- `## Drafts`
- `## Server errors` (a `throw new FormWizardError({...})` snippet)
- `## URL sync`
- `## API`: PropsTable for FormWizard plus a sub-table for Step props
- `## Accessibility`: step heading focus, polite announcement, the stepper as a list of buttons with `aria-current="step"`, locked steps disabled
- `## RTL notes`: the stepper runs right to left, Next/Back arrows mirror, the step caption uses Western digits

Run `docs:lint` and the render-all test. Commit message: `docs(forms): FormWizard page with a patient intake demo`.

---

### Task 7: Exit — gate and screenshots

- Full gate (`ds:baseline`, `vp fmt`, `vp check`, `tsc -b`, `tsc -p tsconfig.scripts.json`, `docs:lint`, `vp test --run src tests`, `vp build`) → exit 0. The bundle must still have no docs and no recharts.
- Screenshots at 1440 px (dark/light × EN/AR) and at 390 px of the wizard on step 1, on a validation error, and on review.
- Check:
  - in Arabic the stepper runs right to left and the arrows mirror
  - the step caption shows on mobile
  - nothing is clipped
  - field heights match Input
- Commit message: `test(forms): Plan C exit — gate and screenshots`.
