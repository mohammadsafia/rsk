# UI Kit Composites — SP3 Plan A (forms contract + composites) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every `Form*` field one shared `FormField` anatomy with inline errors and descriptions. Add `FormContainer.Actions` and `FormSection`, fold PrimeCard and CollapsibleCard into `Card`, move ConfirmDialog to `tone`, and close the SP2 deferred minors that live in these folders. When the plan is done, `forms/` and the touched `shared/` folders have zero forbidden patterns.

**Architecture:**
- **`forms/FormField`** owns the label row, the message line and the id wiring. Each field passes its control through a render function that receives `id`, `invalid`, `aria-describedby` and `aria-required`, so the control choice stays with the field.
- **Retired components:** FormControl, FormLabel, FormMessage, ErrorTooltip, FormSubmitButtons, FieldSection, PrimeCard and CollapsibleCard. Each is deleted once its last importer has migrated. `tsc -b` proves the migration is complete.
- **Codemods:** literal-prop renames (ConfirmDialog `variant` → `tone`) go through the existing codemod engine.

**Tech Stack:** React 18, TypeScript 5.9, react-hook-form 7, Zod, Tailwind 4.3, CVA, Radix (label, collapsible, checkbox, radio-group), react-i18next, Vite+ (`vp`), happy-dom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-ui-kit-composites-design.md` §3 (Plan A), §2 and §6. It sits under the parent spec `docs/superpowers/specs/2026-10-15-ui-kit-design-system-design.md` and the SP2 addendum `docs/superpowers/specs/2026-10-15-ui-kit-primitives-design.md`.

## Global Constraints

- **Branch and commits:**
  - Branch `feat/ui-kit-composites`.
  - Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - Package commands use `P() { corepack pnpm@10.34.7 "$@"; }`.
  - **Gate every commit on real exit codes:** chain with `&&`, and never pipe a gate command into `grep`/`tail`.
- **Tests:**
  - Import from `vite-plus/test`. DOM tests start with `// @vitest-environment happy-dom` and call `cleanup` in `afterEach`.
  - Tests that need real strings import `'<relative>/i18n'`.
  - Tests that render tooltips wrap in `Tooltip.Provider`.
  - Tests that render `FormCombobox` wrap in `QueryClientProvider`.
  - Tests that use router hooks wrap in `MemoryRouter`.
- **Component conventions** (parent §6):
  - Files and exports: kebab-case folder, PascalCase file, `index.ts` re-export, tier barrel.
  - Parts: `className` + `cn()` + `...props` + `data-slot` on every part; `type` rather than `interface`; `import type` for types.
  - JSX: `Conditional.If` instead of `&&`/ternaries in JSX. The exception: when a value must be a direct child (Radix `Slottable`), use a ternary with a comment.
  - Handlers are named `handle*`, and the default export comes last.
- **Styling:**
  - Semantic tokens only.
  - No legacy names (`background`/`foreground`/`primary`/`secondary`/`muted`/`destructive`/`popover`), no hex/rgb/oklch in `.tsx`/`.mdx`, no arbitrary `px`/`rem` lengths.
  - No colored side-stripe or top-stripe borders; tone is carried by an icon or a tint.
- **i18n:** every new string ships in EN and AR in the same commit. `tests/i18n/parity.test.ts` enforces this.
- **Data values:** IDs, amounts and times render LTR-isolated (SP2 §11).
- **Baseline:** after every task that removes violations, run `P ds:baseline` and commit the baseline.
- **Circular imports:** a module that reads a barrel export **at module load time** (`cva(...)` with a barrel constant, `X.Y = Barrel.Z`) must import that value by its direct file path. SP2 hit this twice.

### Plan decisions not spelled out in the spec (keep them)

- **The field's `className` still targets its control.** It is not the FormField root, because existing callers such as FacetedFilter size the control through it. The root is styled via `data-slot="form-field"`.
- **FormField's `id`:** it uses the field's existing id strategy (`name`, or `useId`), passed as `id`.
  - When omitted, FormField generates one.
  - The message id is `${id}-message`.
  - `aria-describedby` is set only while a message (an error or a description) is visible.
- **Required marker:** a red `*` with `aria-hidden`, plus `aria-required` on the control. It is not an icon.
- **FormMessage is deleted, not kept as a part.** FormField renders the message line itself; nothing outside `forms/` used FormMessage except its docs.
- **New `ui/Textarea`.** SP2 never built one; FormTextarea rendered a raw `<textarea>` with legacy classes.
  - It uses `fieldVariants` with `h-auto min-h-20 py-2 resize-y field-sizing-content` and `invalid`.
- **Choice primitives gain `invalid`.**
  - `Checkbox` sets `aria-invalid` and a danger border.
  - `CheckboxGroup` and `RadioGroup` set `aria-invalid` on the group, and their items style themselves with `in-aria-invalid:` variants.
- **FormRadioGroup's duplicate ids:** each item now gets `${id}-${value}`, and the group gets `id`.
- **ConfirmDialog changes:**
  - Its `border-t-4` tone stripe is removed; tone is carried by the icon, consistent with the side-stripe ban.
  - Its `info` icon uses `text-info`.
- **`FormContainer.Actions`:**
  - The default `onCancel` is `navigate(-1)` (as in FormSubmitButtons).
  - `confirmOnCancel` asks only when `formState.isDirty`. FormSubmitButtons asked unconditionally.
- **Card's collapsible trigger:**
  - It is an `IconButton` with `aria-label={t('card.toggle')}`.
  - `aria-expanded` comes from Radix `Collapsible.Trigger`.
  - It is rendered by `Card.Header` when the card is collapsible.

## Review Focus

1. **A described field that becomes invalid swaps its message.** It must not stack the description and the error: `aria-describedby` points at one message element whose text changes. → Task 1 asserts that only one `[data-slot=form-field-message]` exists and that it holds the error text.
2. **The tooltip ⓘ stays out of the field's name.** "Email", not "Email More information". → Task 1 asserts the input's accessible name equals the label text exactly.
3. **Choice groups are announced as groups with their label.** CheckboxGroup and RadioGroup get `aria-labelledby` from the label. → Task 5 asserts `getByRole('group' | 'radiogroup', { name: label })`.
4. **Cancelling a pristine form doesn't nag.** `confirmOnCancel` only asks when the form is dirty. → Task 8 tests both cases.
5. **A collapsed card's content leaves the tab order.** → Task 9 asserts the body isn't rendered (Radix unmounts it) after collapsing.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/components/forms/form-field/*` (new) | FormField anatomy | 1 |
| `src/types/Form.ts` | `description` added (Task 1); `containerClassName`/`labelClassName`/`errorClassName` removed (Task 6) | 1, 6 |
| `src/components/ui/textarea/*` (new), `forms/{form-input,form-textarea,form-number}` | Text fields | 2 |
| `forms/{form-select,form-combobox,form-multi-combobox}` | Select-like fields | 3 |
| `forms/{form-date-picker,form-date-range,form-time-picker}`, `ui/time-picker` | Date and time fields | 4 |
| `ui/{checkbox,checkbox-group,radio-group}`, `forms/{form-checkbox,form-checkbox-group,form-radio-group}` | Choice fields | 5 |
| `forms/form-file-uploader`; deletions of `forms/{form-control,form-label,form-message}` and `shared/error-tooltip`; `component-docs/forms/FormField.mdx` | Last field + retirement | 6 |
| `shared/confirm-dialog/*`, `scripts/design-system/codemods/rules.ts` | ConfirmDialog `tone` | 7 |
| `forms/form-container/*`, `forms/form-section/*` (new); deletions of `shared/{form-submit-buttons,field-section}` | Actions + sections | 8 |
| `ui/card/*`; deletions of `shared/{prime-card,collapsible-card}` | Card absorbs both | 9 |
| `tables/data-table-filters/**`, `ui/formatted-number/*` | Deferred minors | 10 |
| `tests/design-system/forbidden-patterns.test.ts` | Plan A exit | 11 |


### Task 1: `FormField` — the shared field anatomy

**Files:**
- Create: `src/components/forms/form-field/FormField.tsx`, `src/components/forms/form-field/index.ts`
- Modify: `src/components/forms/index.ts` (export `./form-field` first)
- Modify: `src/types/Form.ts` (`FieldBaseProps` gains `description?: ReactNode`)
- Test: `src/components/forms/form-field/FormField.test.tsx`

**Interfaces:**
- Consumes: `Tooltip` (SP2) and the i18n key `common.moreInfo` (SP2).
- Produces:
  - `FormField: FC<FormFieldProps>`
  - `FormFieldProps = { id?: string; label?: ReactNode; description?: ReactNode; tooltip?: ReactNode; required?: boolean; error?: FieldError; className?: string; children: (control: FormFieldControlProps) => ReactNode }`
  - `FormFieldControlProps = { id: string; invalid: boolean; 'aria-labelledby'?: string; 'aria-describedby'?: string; 'aria-required'?: boolean }`. `aria-labelledby` (the label's id, `${id}-label`) is set whenever there is a label, so group controls (`role="group"` / `"radiogroup"`), which `<label for>` can't name, get their name too.
  - Data slots: `form-field`, `form-field-label`, `form-field-control`, `form-field-message`.
  - `FieldBaseProps.description?: ReactNode`.

- [ ] **Step 1: Write the failing test**

Create `src/components/forms/form-field/FormField.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { type FieldError } from 'react-hook-form';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormField } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderField = (props: { error?: FieldError; description?: string; tooltip?: string; required?: boolean } = {}) =>
  render(
    <Tooltip.Provider>
      <FormField id="email" label="Email" {...props}>
        {({ invalid, ...control }) => <input aria-invalid={invalid || undefined} {...control} />}
      </FormField>
    </Tooltip.Provider>,
  );

const message = () => document.querySelectorAll('[data-slot="form-field-message"]');

describe('FormField', () => {
  it('links the description to the control', () => {
    renderField({ description: 'Use your work email' });
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Use your work email');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('replaces the description with the error in a single message line', () => {
    renderField({ description: 'Use your work email', error: { type: 'required', message: 'Email is required' } });
    expect(message()).toHaveLength(1);
    expect(message()[0].textContent).toBe('Email is required');
    expect(message()[0].className).toContain('text-danger');
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(message()[0].id);
  });

  it('keeps the tooltip button out of the label so the name stays exact', () => {
    renderField({ tooltip: 'We never share it', required: true });
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
    const info = screen.getByRole('button', { name: 'More information' });
    expect(info.closest('label')).toBeNull();
  });

  it('marks required controls and omits describedby when there is no message', () => {
    renderField({ required: true });
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(message()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run src/components/forms/form-field`
Expected: FAIL. `FormField` is not exported from `@components/forms`.

- [ ] **Step 3: Implement**

Create `src/components/forms/form-field/FormField.tsx`:

```tsx
import { type FC, type ReactNode, useId } from 'react';
import { type FieldError } from 'react-hook-form';
import * as LabelPrimitive from '@radix-ui/react-label';

import { Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { AlertCircle, Info } from 'lucide-react';

/** What a field's control receives: wire these onto the focusable element (or the group root). */
export type FormFieldControlProps = {
  id: string;
  invalid: boolean;
  /** Set when there is a label; groups need it because `<label for>` can't name a `div`. */
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

export type FormFieldProps = {
  /** The control's id; generated when omitted. */
  id?: string;
  label?: ReactNode;
  /** Help text shown under the control while it is valid. */
  description?: ReactNode;
  /** Extra context behind an ⓘ button beside the label (never inside it). */
  tooltip?: ReactNode;
  required?: boolean;
  error?: FieldError;
  className?: string;
  children: (control: FormFieldControlProps) => ReactNode;
};

const FormField: FC<FormFieldProps> = ({ id, label, description, tooltip, required = false, error, className, children }) => {
  const { t } = useAppTranslation('common');
  const generatedId = useId();

  const controlId = id ?? generatedId;
  const labelId = `${controlId}-label`;
  const messageId = `${controlId}-message`;
  const message = error?.message || description;
  const hasMessage = message !== undefined && message !== null && message !== '';

  return (
    <div data-slot="form-field" data-invalid={!!error || undefined} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Conditional.If condition={!!label}>
        <div data-slot="form-field-label" className="flex items-center gap-1">
          <LabelPrimitive.Root id={labelId} htmlFor={controlId} className="text-fg text-sm leading-none font-medium">
            {label}

            <Conditional.If condition={required}>
              <span aria-hidden="true" className="text-danger ms-0.5">
                *
              </span>
            </Conditional.If>
          </LabelPrimitive.Root>

          <Conditional.If condition={!!tooltip}>
            <Tooltip content={tooltip} align="start">
              <button
                type="button"
                aria-label={t('moreInfo')}
                className="focus-ring text-fg-muted hover:text-fg inline-flex cursor-help rounded-sm"
              >
                <Info size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          </Conditional.If>
        </div>
      </Conditional.If>

      <div data-slot="form-field-control" className="relative min-w-0">
        {children({
          id: controlId,
          invalid: !!error,
          'aria-labelledby': label ? labelId : undefined,
          'aria-describedby': hasMessage ? messageId : undefined,
          'aria-required': required || undefined,
        })}
      </div>

      <Conditional.If condition={hasMessage}>
        <p id={messageId} data-slot="form-field-message" className={cn('flex items-start gap-1.5 text-xs', error ? 'text-danger' : 'text-fg-muted')}>
          <Conditional.If condition={!!error}>
            <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          </Conditional.If>

          <span>{message}</span>
        </p>
      </Conditional.If>
    </div>
  );
};

FormField.displayName = 'FormField';

export default FormField;
```

Create `src/components/forms/form-field/index.ts`:

```ts
export { default as FormField } from './FormField';
export type { FormFieldControlProps, FormFieldProps } from './FormField';
```

Add `export * from './form-field';` as the **first** line of `src/components/forms/index.ts`. Fields import it from the barrel, so it must load before them.

In `src/types/Form.ts`, add `description?: ReactNode;` after `tooltip?: ReactNode;` in `FieldBaseProps`.

- [ ] **Step 4: Run tests**

Run: `P exec vp test --run src/components/forms && P exec tsc -b`
Expected: PASS (the four FormField tests plus the existing form tests) and exit 0.

- [ ] **Step 5: Commit**

```bash
P exec vp check && \
git add src/components/forms src/types/Form.ts && \
git commit -m "feat(forms): FormField anatomy with inline message line and id wiring

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 2: `ui/Textarea` and the text fields (FormInput, FormTextarea, FormNumber)

**Files:**
- Create: `tests/forms/FormHarness.tsx` (shared test harness for every field task)
- Create: `src/components/ui/textarea/Textarea.tsx`, `src/components/ui/textarea/index.ts`
- Create: `src/components/ui/textarea/Textarea.test.tsx`
- Modify: `src/components/ui/index.ts` (export `./textarea` right after `./input`)
- Modify (rewrite the render): `src/components/forms/form-input/FormInput.tsx`, `src/components/forms/form-textarea/FormTextarea.tsx`, `src/components/forms/form-number/FormNumber.tsx`
- Create: `src/component-docs/ui/Textarea.mdx`
- Test: `src/components/forms/form-text-fields.test.tsx` (new)

**Interfaces:**
- Consumes: `FormField`, `FormFieldControlProps` (Task 1); `fieldVariants` (SP2).
- Produces:
  - `Textarea: FC<ComponentProps<'textarea'> & { invalid?: boolean }>` with `data-slot="textarea"`.
  - `FormHarness`: `({ errors?: Record<string, string>; defaultValues: Record<string, unknown>; children }) => JSX`. It wraps `Tooltip.Provider`, `QueryClientProvider` and `FormProvider`, and calls `setError` for each entry.

- [ ] **Step 1: Write the failing tests**

Create `tests/forms/FormHarness.tsx`:

```tsx
import { type ReactNode, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Tooltip } from '@components/ui';

type FormHarnessProps = {
  defaultValues: Record<string, unknown>;
  /** Field name → error message, applied after mount. */
  errors?: Record<string, string>;
  children: ReactNode;
};

/** Test-only wrapper: providers a field needs plus a form with optional pre-set errors. */
export function FormHarness({ defaultValues, errors = {}, children }: FormHarnessProps) {
  const methods = useForm({ defaultValues });
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    for (const [name, message] of Object.entries(errors)) methods.setError(name, { type: 'manual', message });
  }, [methods, errors]);

  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider>
        <FormProvider {...methods}>{children}</FormProvider>
      </Tooltip.Provider>
    </QueryClientProvider>
  );
}
```

Create `src/components/ui/textarea/Textarea.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Textarea } from '@components/ui';

afterEach(cleanup);

describe('Textarea', () => {
  it('uses the field shape, grows with content and exposes invalid', () => {
    render(<Textarea aria-label="Notes" invalid />);
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea.className).toContain('border-border-strong');
    expect(textarea.className).toContain('min-h-20');
    expect(textarea.className).not.toContain('h-control-md');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });
});
```

Create `src/components/forms/form-text-fields.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormInput, FormNumber, FormTextarea } from '@components/forms';

import { FormHarness } from '../../../tests/forms/FormHarness';

import '../../i18n';

afterEach(cleanup);

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('text fields', () => {
  it('FormInput shows its error inline and links it', async () => {
    render(
      <FormHarness defaultValues={{ email: '' }} errors={{ email: 'Email is required' }}>
        <FormInput name="email" label="Email" description="Work email" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    await waitFor(() => expect(describedText(input)).toBe('Email is required'));
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.className).not.toMatch(/ps-8|destructive/);
  });

  it('FormTextarea renders the Textarea primitive with its error', async () => {
    render(
      <FormHarness defaultValues={{ notes: '' }} errors={{ notes: 'Add a note' }}>
        <FormTextarea name="notes" label="Notes" />
      </FormHarness>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    await waitFor(() => expect(textarea.getAttribute('aria-invalid')).toBe('true'));
    expect(textarea.dataset.slot).toBe('textarea');
    expect(describedText(textarea)).toBe('Add a note');
  });

  it('FormNumber links its description while valid', () => {
    render(
      <FormHarness defaultValues={{ qty: null }}>
        <FormNumber name="qty" label="Quantity" description="Whole units only" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(describedText(input)).toBe('Whole units only');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/textarea src/components/forms/form-text-fields.test.tsx`
Expected: FAIL.
- `Textarea` is not exported.
- There is no `aria-describedby` on the inputs.
- FormTextarea's element has no `data-slot="textarea"` from the primitive. The raw textarea still carries legacy classes and has no `aria-invalid`.

- [ ] **Step 3: Implement**

`src/components/ui/textarea/Textarea.tsx`:

```tsx
import { type ComponentProps, type FC, forwardRef } from 'react';

import { fieldVariants } from '@components/ui';

import { cn } from '@utils';

type TextareaProps = ComponentProps<'textarea'> & {
  invalid?: boolean;
};

/** Multi-line field on the shared field shape; grows with its content (field-sizing). */
const Textarea: FC<TextareaProps> = ({ ref, className, invalid, ...props }) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    aria-invalid={invalid || undefined}
    className={cn(fieldVariants(), 'field-sizing-content h-auto min-h-20 resize-y items-start py-2 disabled:field-sizing-fixed', className)}
    {...props}
  />
);

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => Textarea({ ...props, ref }));
```

`src/components/ui/textarea/index.ts`:

```ts
export { default as Textarea } from './Textarea';
```

Add `export * from './textarea';` after the `./input` line in `src/components/ui/index.ts`.

Replace `src/components/forms/form-input/FormInput.tsx` with:

```tsx
import { type InputHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormField } from '@components/forms';
import { Input } from '@components/ui';

import type { FieldBaseProps } from '@app-types';

type FormInputProps<TFieldValues extends FieldValues> = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'size'> &
  FieldBaseProps<TFieldValues>;

function FormInput<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  tooltip,
  className,
  required,
  rules,
  ...props
}: FormInputProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const {
    fieldState: { error },
  } = useController<TFieldValues>({ name });

  const id = `${name}-${useId()}`;

  return (
    <FormField id={id} label={label} description={description} tooltip={tooltip} required={required} error={error}>
      {(control) => <Input autoComplete="off" className={className} {...control} {...register(name, rules)} {...props} />}
    </FormField>
  );
}

export default FormInput;
```

Replace `src/components/forms/form-textarea/FormTextarea.tsx` with:

```tsx
import { type TextareaHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormField } from '@components/forms';
import { Textarea } from '@components/ui';

import type { FieldBaseProps } from '@app-types';

type FormTextareaProps<TFieldValues extends FieldValues> = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBaseProps<TFieldValues>;

function FormTextarea<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  tooltip,
  className,
  required,
  rules,
  ...props
}: FormTextareaProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const {
    fieldState: { error },
  } = useController<TFieldValues>({ name });

  const id = `${name}-${useId()}`;

  return (
    <FormField id={id} label={label} description={description} tooltip={tooltip} required={required} error={error}>
      {(control) => <Textarea className={className} {...control} {...register(name, rules)} {...props} />}
    </FormField>
  );
}

export default FormTextarea;
```

Replace `src/components/forms/form-number/FormNumber.tsx` with:

```tsx
import { useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormField } from '@components/forms';
import { FormattedNumber, type FormattedNumberProps } from '@components/ui';

import type { ControlledFieldBaseProps } from '@app-types';

type FormNumberProps<TFieldValues extends FieldValues> = ControlledFieldBaseProps<TFieldValues, FormattedNumberProps>;

function FormNumber<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  ...props
}: FormNumberProps<TFieldValues>) {
  const id = useId();

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormField id={`${id}-${name}`} label={label} description={description} tooltip={tooltip} required={required} error={error}>
          {(fieldControl) => <FormattedNumber className={className} {...fieldControl} {...field} {...props} />}
        </FormField>
      )}
    />
  );
}

FormNumber.displayName = 'FormNumber';

export default FormNumber;
```

`containerClassName`/`labelClassName`/`errorClassName` are still on `FieldBaseProps` until Task 6, and no caller passes them. They are deliberately not destructured here.

Create `src/component-docs/ui/Textarea.mdx` with frontmatter `id: textarea`, `title: Textarea`, `section: Components`, `category: UI`, `description: 'Multi-line field on the shared field shape; grows with its content.'`, `tags: [ui, textarea, input]`. Add a Demo with `<Textarea placeholder="Visit notes" />` and `<Textarea invalid defaultValue="Too short" />`, an Imports block, and an API table (`invalid`; all native textarea props).

- [ ] **Step 4: Run tests**

Run: `P exec vp test --run src/components/ui/textarea src/components/forms && P exec tsc -b`
Expected: PASS and exit 0. The older `FormInput.test.tsx` cases still pass, since `aria-invalid` is unchanged.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A tests/forms src/components/ui/textarea src/components/ui/index.ts src/components/forms src/component-docs/ui/Textarea.mdx tests/design-system && \
git commit -m "feat(forms): Textarea primitive; FormInput/FormTextarea/FormNumber on FormField

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 3: Select-like fields (FormSelect, FormCombobox, FormMultiCombobox)

**Files:**
- Modify: `src/components/forms/form-select/FormSelect.tsx` (destructure lines 29-49; render lines 72-125)
- Modify: `src/components/forms/form-combobox/FormCombobox.tsx` (destructure lines 36-60; render lines 133-196)
- Modify: `src/components/forms/form-multi-combobox/FormMultiCombobox.tsx` (the same shape; trigger at line 147, message at line 229)
- Test: `src/components/forms/form-select-fields.test.tsx` (new)

**Interfaces:**
- Consumes: `FormField` (Task 1) and `FormHarness` (Task 2).
- Produces: no new exports. Each field accepts `description`.

- [ ] **Step 1: Write the failing test**

Create `src/components/forms/form-select-fields.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormCombobox, FormMultiCombobox, FormSelect } from '@components/forms';

import { FormHarness } from '../../../tests/forms/FormHarness';

import '../../i18n';

afterEach(cleanup);

const OPTIONS = [{ label: 'Admin', value: 'admin' }];
const optionProps = {
  options: OPTIONS,
  getOptionLabel: (option: { label: string }) => option.label,
  getOptionValue: (option: { value: string }) => option.value,
};

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('select-like fields', () => {
  it.each([
    ['FormSelect', <FormSelect key="s" name="role" label="Role" {...optionProps} />],
    ['FormCombobox', <FormCombobox key="c" name="role" label="Role" {...optionProps} />],
    ['FormMultiCombobox', <FormMultiCombobox key="m" name="role" label="Role" {...optionProps} />],
  ])('%s is labelled, invalid and described by its inline error', async (_name, field) => {
    render(
      <FormHarness defaultValues={{ role: null }} errors={{ role: 'Pick a role' }}>
        {field}
      </FormHarness>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Role' });
    await waitFor(() => expect(trigger.getAttribute('aria-invalid')).toBe('true'));
    expect(describedText(trigger)).toBe('Pick a role');
    expect(trigger.className).not.toMatch(/(^|\s)ps-8(\s|$)/);
  });
});
```

If `FormMultiCombobox`'s default value must be an array, change its harness `defaultValues` to `{ role: [] }` in that row only.

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run src/components/forms/form-select-fields.test.tsx`
Expected: FAIL. There is no `aria-describedby` on any trigger, and the classes contain `ps-8`.

- [ ] **Step 3: Implement (the same three edits in each file)**

**Edit A, imports.** Replace

```tsx
import { FormControl, FormLabel, FormMessage } from '@components/forms';
```

with

```tsx
import { FormField } from '@components/forms';
```

If `cn` becomes unused after Edit C, remove its import too (`vp check` reports it).

**Edit B, props.** In the destructuring, delete `containerClassName,`, `labelClassName,` and `errorClassName,`, and add `description,` right after `label,`.

**Edit C, render.** Replace the wrapper and wire the control:

1. Replace

```tsx
<FormControl className={containerClassName}>
  <FormLabel className={labelClassName} htmlFor={name} tooltip={tooltip} required={required} hidden={!label} error={error!}>
    {label}
  </FormLabel>

  <div className="relative">
```

with

```tsx
<FormField id={name} label={label} description={description} tooltip={tooltip} required={required} error={error}>
  {(fieldControl) => (
```

2. On the trigger, replace the id/invalid/className props:

   | File | Old trigger props | New trigger props |
   |---|---|---|
   | FormSelect (`<Select.Trigger`) | `id={name}` / `invalid={!!error}` / `className={cn(!!error && 'ps-8', className)}` | `{...fieldControl}` / `className={className}` |
   | FormCombobox (`<Combobox.Trigger`) | `id={name}` / `invalid={!!error}` / `className={cn(error && 'ps-8', className)}` | `{...fieldControl}` / `className={className}` |
   | FormMultiCombobox (`<Combobox.Trigger`) | `id={name}` / `invalid={!!error}` / `className={cn('h-auto min-h-control-md flex-wrap py-1', error && 'ps-8', className)}` | `{...fieldControl}` / `className={cn('h-auto min-h-control-md flex-wrap py-1', className)}` |

   Keep `ref={ref}` and every other trigger prop.

3. Replace the closing

```tsx
    <FormMessage className={errorClassName} hidden={!error} error={error!} />
  </div>
</FormControl>
```

with

```tsx
  )}
</FormField>
```

In FormSelect the `<FormMessage …/>` line sits after `</Select>`; in the Combobox fields it sits after `</Combobox>`. The `<Select>`/`<Combobox>` element becomes the render function's single returned element.

The three files still render the clear icon (`role="button"`) inside the trigger. That is unchanged here; it is an SP2 deferred minor owned by Plan B's `shared/` pass.

- [ ] **Step 4: Run tests**

Run: `P exec vp test --run src/components/forms && P exec tsc -b`
Expected: PASS and exit 0. The existing FormSelect case in `FormInput.test.tsx` still passes.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src/components/forms tests/design-system && \
git commit -m "feat(forms): Select and Combobox fields on FormField with inline errors

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 4: Date and time fields (FormDatePicker, FormDateRange, FormTimePicker)

**Files:**
- Modify: `src/components/forms/form-date-picker/FormDatePicker.tsx` (props destructure; render lines 172-253)
- Modify: `src/components/forms/form-date-range/FormDateRange.tsx` (`FormDateRangeCore` destructure lines 70-87; render lines 190-272)
- Modify: `src/components/ui/time-picker/TimePicker.tsx` (`TimePickerProps`: accept `aria-describedby` and `aria-required`, and forward them to the trigger)
- Modify: `src/components/forms/form-time-picker/FormTimePicker.tsx` (line 12 `Omit`; render lines 55-75)
- Modify: `src/components/forms/form-date-picker/FormDatePicker.test.tsx` (extend)
- Test: `src/components/forms/form-date-time-fields.test.tsx` (new)

**Interfaces:**
- Consumes: `FormField` (Task 1), `FormHarness` (Task 2).
- Produces:
  - `TimePickerProps` gains `'aria-describedby'?: string` and `'aria-required'?: boolean`.
  - The date shells expose `data-disabled` when disabled.

- [ ] **Step 1: Write the failing tests**

Create `src/components/forms/form-date-time-fields.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormDatePicker, FormDateRange, FormTimePicker } from '@components/forms';

import { FormHarness } from '../../../tests/forms/FormHarness';

import '../../i18n';

afterEach(cleanup);

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('date and time fields', () => {
  it('FormDatePicker links its inline error to the date input', async () => {
    render(
      <FormHarness defaultValues={{ visit: null }} errors={{ visit: 'Pick a visit date' }}>
        <FormDatePicker name="visit" label="Visit" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Visit' });
    await waitFor(() => expect(describedText(input)).toBe('Pick a visit date'));
    const shell = input.closest('[data-slot="date-picker-container"]') as HTMLElement;
    expect(shell.className).not.toMatch(/(^|\s)ps-8(\s|$)/);
  });

  it('FormDateRange links its inline error to the range input', async () => {
    render(
      <FormHarness defaultValues={{ stay: null }} errors={{ stay: 'Pick the stay dates' }}>
        <FormDateRange name="stay" label="Stay" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Stay' });
    await waitFor(() => expect(describedText(input)).toBe('Pick the stay dates'));
  });

  it('FormTimePicker describes its trigger with the inline error', async () => {
    render(
      <FormHarness defaultValues={{ time: null }} errors={{ time: 'Pick a time' }}>
        <FormTimePicker name="time" label="Time" />
      </FormHarness>,
    );
    const trigger = screen.getByRole('button', { name: /Time|Select time/ });
    await waitFor(() => expect(describedText(trigger)).toBe('Pick a time'));
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });

  it('a disabled date shell takes the field disabled look, not opacity', () => {
    render(
      <FormHarness defaultValues={{ visit: null }}>
        <FormDatePicker name="visit" label="Visit" disabled />
      </FormHarness>,
    );
    const shell = document.querySelector('[data-slot="date-picker-container"]') as HTMLElement;
    expect(shell.dataset.disabled).toBe('true');
    expect(shell.className).toContain('data-disabled:bg-surface-sunken');
    expect(shell.className).not.toContain('opacity-50');
  });
});
```

The existing `FormDatePicker.test.tsx` asserts `aria-invalid` on the shell and the input. Keep it as it is.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/forms/form-date-time-fields.test.tsx`
Expected: FAIL. There is no `aria-describedby`, the shell has `ps-8` on error, and a disabled shell uses `opacity-50`.

- [ ] **Step 3: Implement**

**FormDatePicker** (`FormDatePicker.tsx`):
- Imports: replace `FormControl, FormLabel, FormMessage` with `FormField`.
- Destructure: remove `containerClassName`, `labelClassName` and `errorClassName`; add `description`.
- Render:
  1. Replace the opening `<FormControl …>` + `<FormLabel …>{label}</FormLabel>` + `<div className="relative">` with:

     ```tsx
     <FormField id={name} label={label} description={description} tooltip={tooltip} required={required} error={error}>
       {(fieldControl) => (
     ```

  2. Replace the closing `<FormMessage … />` + `</div>` + `</FormControl>` with:

     ```tsx
       )}
     </FormField>
     ```

     The `<Popover>` becomes the render function's single element.
  3. On the shell `div[data-slot="date-picker-container"]`, replace its `aria-invalid` and `className` props with:

     ```tsx
            aria-invalid={fieldControl.invalid || undefined}
            data-disabled={disabled || undefined}
            className={cn(
              fieldVariants(),
              'group gap-2 pe-1',
              'data-disabled:border-border data-disabled:bg-surface-sunken data-disabled:text-fg-subtle data-disabled:pointer-events-none',
              className,
            )}
     ```

  4. On the inner `<input>`, replace `id={name}` and `aria-invalid={!!error || undefined}` with:

     ```tsx
                id={fieldControl.id}
                aria-invalid={fieldControl.invalid || undefined}
                aria-describedby={fieldControl['aria-describedby']}
                aria-required={fieldControl['aria-required']}
     ```

**FormDateRange** (`FormDateRange.tsx`). Make the same edits inside `FormDateRangeCore`:
- Imports.
- Its destructure: remove the three classNames and add `description`. `FormDateRangeBaseProps` gets `description` through `ControlledFieldBaseProps`.
- The wrapper (`FormField id={name}`). For Flat mode `name` is already `fromName`.
- The `date-range-container` shell's `aria-invalid`/`data-disabled`/`className` (same classes as above).
- The inner `<input>` attributes.

**TimePicker** (`src/components/ui/time-picker/TimePicker.tsx`):
- Add these to `TimePickerProps`:

  ```tsx
    'aria-describedby'?: string;
    'aria-required'?: boolean;
  ```

- In the `TimePicker` component's destructure, add `'aria-describedby': ariaDescribedBy,` and `'aria-required': ariaRequired,`.
- On `<TimePickerTrigger …>`, add `aria-describedby={ariaDescribedBy}` and `aria-required={ariaRequired}`.

**FormTimePicker** (`FormTimePicker.tsx`):
- Line 12: change `Omit<TimePickerProps, 'name' | 'value' | 'onChange' | 'error'>` to `Omit<TimePickerProps, 'name' | 'value' | 'onChange'>`. This closes an SP2 deferred minor.
- Imports: replace `FormControl, FormLabel, FormMessage` with `FormField`.
- Destructure: remove the three classNames and add `description`.
- Replace the returned JSX inside `render` with:

  ```tsx
          <FormField id={name} label={label} description={description} tooltip={tooltip} required={required} error={error}>
            {(fieldControl) => (
              <TimePicker
                name={name}
                id={fieldControl.id}
                invalid={fieldControl.invalid}
                aria-describedby={fieldControl['aria-describedby']}
                aria-required={fieldControl['aria-required']}
                value={timeValue}
                onChange={handleChange}
                use24hFormat={use24hFormat}
                className={className}
                {...props}
              />
            )}
          </FormField>
  ```

  Remove the `cn` import if it is now unused.

- [ ] **Step 4: Run tests**

Run: `P exec vp test --run src/components/forms src/components/ui/time-picker && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src/components/forms src/components/ui/time-picker tests/design-system && \
git commit -m "feat(forms): date and time fields on FormField; disabled date shells match Input

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 5: Choice fields (FormCheckbox, FormCheckboxGroup, FormRadioGroup) + `invalid` on the choice primitives

**Files:**
- Modify: `src/components/ui/checkbox/Checkbox.tsx` (the `invalid` prop; `checkboxBoxClassName` danger states)
- Modify: `src/components/ui/checkbox-group/CheckboxGroup.tsx` (the `invalid` prop on the root; item danger state)
- Modify: `src/components/ui/radio-group/RadioGroup.tsx` (the `invalid` prop on the root; item and circle danger states)
- Rewrite: `src/components/forms/form-checkbox/FormCheckbox.tsx`, `src/components/forms/form-checkbox-group/FormCheckboxGroup.tsx`, `src/components/forms/form-radio-group/FormRadioGroup.tsx`
- Test: `src/components/forms/form-choice-fields.test.tsx` (new)

**Interfaces:**
- Consumes: `FormField` with `aria-labelledby` (Task 1) and `FormHarness` (Task 2).
- Produces:
  - `Checkbox`, `CheckboxGroup` and `RadioGroup` accept `invalid?: boolean`, which renders as `aria-invalid`.
  - `checkboxBoxClassName` adds `aria-invalid:border-danger in-aria-invalid:border-danger`.
  - FormCheckbox drops `checkboxClassName`; FormCheckboxGroup drops `checkboxItemClassName`; FormRadioGroup drops `radioItemClassName`. No caller passes any of them.

- [ ] **Step 1: Write the failing test**

Create `src/components/forms/form-choice-fields.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormCheckbox, FormCheckboxGroup, FormRadioGroup } from '@components/forms';

import { FormHarness } from '../../../tests/forms/FormHarness';

import '../../i18n';

afterEach(cleanup);

const OPTIONS = [
  { label: 'Pollen', value: 'pollen' },
  { label: 'Dust', value: 'dust' },
];
const optionProps = {
  options: OPTIONS,
  getOptionLabel: (option: { label: string }) => option.label,
  getOptionValue: (option: { value: string }) => option.value,
};

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('choice fields', () => {
  it('FormCheckbox is named by its card label, once, and described by its error', async () => {
    render(
      <FormHarness defaultValues={{ agree: false }} errors={{ agree: 'You must agree' }}>
        <FormCheckbox name="agree" label="I agree to the terms" />
      </FormHarness>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'I agree to the terms' });
    await waitFor(() => expect(checkbox.getAttribute('aria-invalid')).toBe('true'));
    expect(describedText(checkbox)).toBe('You must agree');
    expect(screen.getAllByText('I agree to the terms')).toHaveLength(1);
  });

  it('FormCheckboxGroup is a named, invalid, described group', async () => {
    render(
      <FormHarness defaultValues={{ allergies: [] }} errors={{ allergies: 'Pick at least one' }}>
        <FormCheckboxGroup name="allergies" label="Allergies" {...optionProps} />
      </FormHarness>,
    );
    const group = screen.getByRole('group', { name: 'Allergies' });
    await waitFor(() => expect(group.getAttribute('aria-invalid')).toBe('true'));
    expect(describedText(group)).toBe('Pick at least one');
  });

  it('FormRadioGroup is a named radiogroup with unique item ids', async () => {
    render(
      <FormHarness defaultValues={{ blood: '' }} errors={{ blood: 'Pick one' }}>
        <FormRadioGroup name="blood" label="Blood group" {...optionProps} />
      </FormHarness>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Blood group' });
    await waitFor(() => expect(group.getAttribute('aria-invalid')).toBe('true'));
    expect(describedText(group)).toBe('Pick one');
    const ids = screen.getAllByRole('radio').map((radio) => radio.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run src/components/forms/form-choice-fields.test.tsx`
Expected: FAIL:
- There is no `aria-invalid` on the checkbox or the groups.
- The label text appears twice for FormCheckbox.
- The groups have no accessible name.
- The radio ids are all `blood`.

- [ ] **Step 3: Implement the primitives**

**`Checkbox.tsx`:**
- Change `type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;` to `type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & { invalid?: boolean };`.
- Add a fourth entry to `checkboxBoxClassName`: `'aria-invalid:border-danger in-aria-invalid:border-danger'`.
- In `Checkbox`, destructure `invalid` and add `aria-invalid={invalid || undefined}` to `CheckboxPrimitive.Root`.

**`CheckboxGroup.tsx`:**
- Change `type CheckboxGroupProps = ComponentPropsWithoutRef<'div'>;` to `ComponentPropsWithoutRef<'div'> & { invalid?: boolean };`.
- Make the root `({ className, invalid, children, ...props }) => <div role="group" data-slot="checkbox-group" aria-invalid={invalid || undefined} className={cn('grid w-full gap-3', className)} {...props}>`.
- In `Item`'s class list, add `'in-aria-invalid:border-danger'` after the `data-[state=checked]` line.

**`RadioGroup.tsx`:**
- Change `type RadioGroupProps` to `ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & { invalid?: boolean };`.
- In the root component, destructure `invalid` and add `aria-invalid={invalid || undefined}`.
- In `Item`'s classes, add `'in-aria-invalid:border-danger'`.
- In `radioCircleClassName`, add `'in-aria-invalid:border-danger'`.

- [ ] **Step 4: Implement the fields**

Replace `src/components/forms/form-checkbox/FormCheckbox.tsx` from the `type FormCheckboxProps` line down with:

```tsx
type FormCheckboxProps<TFieldValues extends FieldValues> = Omit<
  ControlledFieldBaseProps<TFieldValues, ComponentPropsWithoutRef<typeof Checkbox>>,
  'onChange'
> & {
  onChange?: (checked: boolean | string) => void;
};

/** A single consent-style checkbox: the label sits inside a selectable card next to the box. */
function FormCheckbox<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  description,
  className,
  required,
  disabled,
  onChange,
  ...props
}: FormCheckboxProps<TFieldValues>) {
  const id = `${name}-${useId()}`;

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormField id={id} description={description} required={required} error={error}>
          {(fieldControl) => (
            <label
              htmlFor={id}
              data-slot="form-checkbox-card"
              className={cn(
                'border-border bg-surface text-fg flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                'hover:border-border-strong has-data-[state=checked]:border-accent has-data-[state=checked]:bg-accent-subtle has-aria-invalid:border-danger',
                disabled && 'pointer-events-none opacity-50',
                className,
              )}
            >
              <span className="flex-1">{label}</span>

              <Checkbox
                {...fieldControl}
                ref={field.ref}
                name={field.name}
                checked={!!field.value}
                disabled={field.disabled || disabled}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onChange?.(checked);
                }}
                onBlur={field.onBlur}
                {...props}
              />
            </label>
          )}
        </FormField>
      )}
    />
  );
}

FormCheckbox.displayName = 'FormCheckbox';

export default FormCheckbox;
```

Its imports become:
- `import { type ComponentPropsWithoutRef, useId } from 'react';`
- `import { Controller, type FieldValues } from 'react-hook-form';`
- `import { FormField } from '@components/forms';`
- `import { Checkbox } from '@components/ui';`
- `import { cn } from '@utils';`
- `import type { ControlledFieldBaseProps } from '@app-types';`

Replace `src/components/forms/form-checkbox-group/FormCheckboxGroup.tsx` from the props type down with:

```tsx
type FormCheckboxGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof CheckboxGroup>
> & {
  options: TOption[];
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
};

function FormCheckboxGroup<TFieldValues extends FieldValues, TOption = FormSelectOption>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  disabled,
  options,
  getOptionLabel,
  getOptionValue,
  ...props
}: FormCheckboxGroupProps<TFieldValues, TOption>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const selectedValues: string[] = Array.isArray(field.value) ? field.value : [];

        const handleCheckedChange = (optionValue: string, checked: boolean) => {
          field.onChange(checked ? [...selectedValues, optionValue] : selectedValues.filter((value) => value !== optionValue));
        };

        return (
          <FormField id={name} label={label} description={description} tooltip={tooltip} required={required} error={error}>
            {(fieldControl) => (
              <CheckboxGroup {...fieldControl} className={cn('flex flex-wrap gap-3', className)} {...props}>
                {options.map((option, index) => {
                  const value = getOptionValue(option);

                  return (
                    <CheckboxGroup.Item
                      key={value}
                      ref={index === 0 ? field.ref : undefined}
                      className="min-w-40 flex-1"
                      checked={selectedValues.includes(value)}
                      disabled={field.disabled || disabled}
                      onCheckedChange={(checked) => handleCheckedChange(value, !!checked)}
                    >
                      <span className="flex-1">{getOptionLabel(option)}</span>

                      <CheckboxGroup.Indicator>
                        <Check className="hidden size-3 group-data-[state=checked]/checkbox-item:block" strokeWidth={3} />
                      </CheckboxGroup.Indicator>
                    </CheckboxGroup.Item>
                  );
                })}
              </CheckboxGroup>
            )}
          </FormField>
        );
      }}
    />
  );
}

FormCheckboxGroup.displayName = 'FormCheckboxGroup';

export default FormCheckboxGroup;
```

Replace `src/components/forms/form-radio-group/FormRadioGroup.tsx` from the props type down with:

```tsx
type FormRadioGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof RadioGroup>
> & {
  options: TOption[];
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
};

function FormRadioGroup<TFieldValues extends FieldValues, TOption = FormSelectOption>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  disabled,
  options,
  getOptionLabel,
  getOptionValue,
  ...props
}: FormRadioGroupProps<TFieldValues, TOption>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormField id={name} label={label} description={description} tooltip={tooltip} required={required} error={error}>
          {(fieldControl) => (
            <RadioGroup
              {...fieldControl}
              className={cn('flex flex-wrap gap-3', className)}
              value={field.value ?? ''}
              disabled={field.disabled || disabled}
              onValueChange={field.onChange}
              {...props}
            >
              {options.map((option, index) => {
                const value = getOptionValue(option);

                return (
                  <RadioGroup.Item
                    key={value}
                    id={`${fieldControl.id}-${value}`}
                    ref={index === 0 ? field.ref : undefined}
                    className="min-w-40 flex-1"
                    value={value}
                  >
                    <span className="flex-1">{getOptionLabel(option)}</span>

                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                );
              })}
            </RadioGroup>
          )}
        </FormField>
      )}
    />
  );
}

FormRadioGroup.displayName = 'FormRadioGroup';

export default FormRadioGroup;
```

In both group files:
- Swap `FormControl, FormLabel, FormMessage` for `FormField` in the `@components/forms` import.
- Keep `Check` from `lucide-react` only in FormCheckboxGroup; FormRadioGroup's indicator draws its own dot (SP2 RadioGroup), so remove `Check` there.
- The old `stroke="white"` is gone: the check inherits `text-accent-fg`.

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/components/forms src/components/ui && P exec tsc -b`
Expected: PASS and exit 0. The SP2 Checkbox, CheckboxGroup and RadioGroup tests still pass.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src/components tests/design-system && \
git commit -m "feat(forms): choice fields on FormField; invalid state on choice primitives; unique radio ids

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 6: FormFileUploader, then retire FormControl, FormLabel, FormMessage and ErrorTooltip

**Files:**
- Modify: `src/components/forms/form-file-uploader/FormFileUploader.tsx`
- Delete: `src/components/forms/{form-control,form-label,form-message}/`, `src/components/shared/error-tooltip/`
- Delete: `src/component-docs/forms/{FormControl,FormLabel,FormMessage}.mdx`, `src/component-docs/shared/ErrorTooltip.mdx`
- Modify: `src/components/forms/index.ts` and `src/components/shared/index.ts` (drop the barrel lines)
- Modify: `src/types/Form.ts` (remove `containerClassName`, `labelClassName`, `errorClassName`)
- Create: `src/component-docs/forms/FormField.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (new "forms/ is clean" assertion)
- Test: `src/components/forms/form-file-uploader/FormFileUploader.test.tsx` (new)

**Interfaces:**
- Consumes: `FormField` (Task 1) and `FormHarness` (Task 2).
- Produces:
  - `FieldBaseProps = { name; label?; description?; tooltip?; required?; rules? }`.
  - FormControl, FormLabel, FormMessage and ErrorTooltip no longer exist.

- [ ] **Step 1: Write the failing tests**

Create `src/components/forms/form-file-uploader/FormFileUploader.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormFileUploader } from '@components/forms';

import { FormHarness } from '../../../../tests/forms/FormHarness';

import '../../../i18n';

afterEach(cleanup);

describe('FormFileUploader', () => {
  it('labels the file input and describes it with the inline error', async () => {
    render(
      <FormHarness defaultValues={{ report: null }} errors={{ report: 'Attach the report' }}>
        <FormFileUploader name="report" label="Report" />
      </FormHarness>,
    );
    const input = screen.getByLabelText('Report', { selector: 'input' });
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Attach the report');
  });
});
```

In `tests/design-system/forbidden-patterns.test.ts`, add inside `describe('clean primitives', …)`:

```ts
  it('forms/ contains no forbidden patterns (SP3 Plan A)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/forms/'));
    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/forms/form-file-uploader tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL.
- The file input has no `aria-invalid` or `aria-describedby`.
- The forms guard lists `FormLabel.tsx`, `FormMessage.tsx` and `FormFileUploader.tsx` (legacy `destructive`), plus any files Tasks 2–5 still left dirty.

- [ ] **Step 3: Migrate FormFileUploader**

In `FormFileUploader.tsx`:
- Imports: change `FormControl, FormLabel, FormMessage` to `FormField`.
- Destructure: remove `containerClassName`, `labelClassName` and `errorClassName`; add `description` after `label`.
- Replace the `render={…}` body with:

```tsx
      render={({ field: { ref, value, onChange, onBlur, ...field }, fieldState: { error } }) => (
        <FormField id={`${name}-file-upload`} label={label} description={description} tooltip={tooltip} required={required} error={error}>
          {({ id: _inputId, invalid, ...fieldControl }) => (
            <FileUploader
              name={name}
              value={value}
              onChange={onChange}
              accept={accept}
              multiple={multiple}
              disabled={field.disabled || disabled}
              isUploading={isUploading}
              className={cn(invalid && '**:data-[slot=file-uploader-dropzone-group]:border-danger', className)}
            >
              <FileUploader.DropzoneGroup>
                <FileUploader.Dropzone
                  ref={ref}
                  onBlur={onBlur}
                  aria-invalid={invalid || undefined}
                  placeholder={placeholder ?? label}
                  {...fieldControl}
                />

                <FileUploader.Actions onDownload={onDownload} clearable={clearable} />
              </FileUploader.DropzoneGroup>

              <Conditional.If condition={multiple && !showPreview}>
                <FileUploader.FileList variant={listVariant} />
              </Conditional.If>

              <Conditional.If condition={showPreview}>
                <FileUploader.ImagePreview />
              </Conditional.If>
            </FileUploader>
          )}
        </FormField>
      )}
```

`FileUploader` derives the input id itself (`${name}-file-upload`). FormField's `id` is set to the same value, and the render function drops the `id` it receives (`_inputId`). If `vp check` flags `_inputId`, use the repo's unused-var ignore comment on that line.

- [ ] **Step 4: Retire the old parts**

```bash
git rm -rq src/components/forms/form-control src/components/forms/form-label src/components/forms/form-message src/components/shared/error-tooltip \
  src/component-docs/forms/FormControl.mdx src/component-docs/forms/FormLabel.mdx src/component-docs/forms/FormMessage.mdx src/component-docs/shared/ErrorTooltip.mdx
```

- In `src/components/forms/index.ts`, delete the `./form-control`, `./form-label` and `./form-message` lines.
- In `src/components/shared/index.ts`, delete the `./error-tooltip` line.
- In `src/types/Form.ts`, delete the three lines `containerClassName?: string;`, `labelClassName?: string;` and `errorClassName?: string;`.

Then confirm nothing references the retired names. The grep must print nothing:

```bash
grep -rnE 'FormControl|FormLabel|FormMessage|ErrorTooltip|containerClassName|labelClassName|errorClassName|errorType' src
```

The only legitimate leftovers would be words inside prose. If the grep shows an MDX sentence, reword it to name `FormField`.

Create `src/component-docs/forms/FormField.mdx`:

````mdx
---
id: form-field
title: FormField
section: Components
category: Forms
description: 'The anatomy every Form* field shares: label row, control, and one message line for the description or the error.'
tags: [forms, field, label, error, description]
---

import { FormInputDemo } from '@pages/components/components.data.demos';

## Demo

<FormInputDemo />

## Anatomy

| Part | data-slot | Notes |
|---|---|---|
| Root | `form-field` | `data-invalid` while the field has an error |
| Label row | `form-field-label` | Label + required `*` + optional ⓘ tooltip button **beside** the label (kept out of the field's name) |
| Control | `form-field-control` | Receives `id`, `invalid`, `aria-labelledby`, `aria-describedby`, `aria-required` |
| Message | `form-field-message` | Shows the error (danger) or else the `description` (muted); referenced by `aria-describedby` |

## Field props (every `Form*`)

| Prop | Notes |
|---|---|
| `name` | react-hook-form path |
| `label` | Visible label |
| `description` | Help text under the field while valid |
| `tooltip` | Extra context behind an ⓘ button |
| `required` | Red `*` + `aria-required` |
| `disabled` | Disables the control |
| `className` | Applied to the control; style the rest via `data-slot` |
| `rules` | react-hook-form rules when not using a schema |

## Building a custom field

```tsx
<FormField id={id} label="Licence number" description="As printed on the card" error={error}>
  {(control) => <Input {...control} {...register('licence')} />}
</FormField>
```
````

If `FormInputDemo` doesn't exist in the demos file, import the first form demo that does (check the `export function Form…Demo` names) and use that instead.

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components tests && P exec tsc -b`
Expected: PASS and exit 0. The forms guard is now green; if it still lists a file, fix the remaining legacy classes in it with semantic tokens.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && \
git commit -m "feat(forms): FormFileUploader on FormField; retire FormControl/FormLabel/FormMessage/ErrorTooltip

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 7: ConfirmDialog — `tone` replaces `variant`, description announced, no tone stripe

**Files:**
- Modify: `src/components/shared/confirm-dialog/ConfirmDialog.tsx` (types and maps at lines 1-84; body uses of `variant`)
- Modify: `scripts/design-system/codemods/rules.ts` (`confirm` rule set) and `tests/design-system/codemods/migrate-props.test.ts`
- Modify: call sites rewritten by `P ds:migrate confirm`:
  - `src/pages/components/components.data.demos.tsx` (lines 608-704)
  - `src/component-docs/shared/{ConfirmDialog,FileCard}.mdx`
  - `src/component-docs/hooks/UseRowEditing.mdx`
  - `src/components/shared/form-submit-buttons/FormSubmitButtons.tsx:49`. This file is deleted in Task 8, but it must compile until then.
- Modify: `src/components/shared/confirm-dialog/ConfirmDialog.test.tsx`
- Modify: `src/component-docs/shared/CountTooltip.mdx:33` (its last legacy classes)

**Interfaces:**
- Consumes: `Dialog.Content`, which spreads `aria-describedby` (SP2).
- Produces:
  - `ConfirmDialogTone = 'danger' | 'warning' | 'success' | 'info'`.
  - `ConfirmDialogProps.tone?: ConfirmDialogTone` (default `'danger'`); the `variant` key is removed.
  - `confirmDialogIconVariants` is keyed by `tone`.
  - The `confirmDialogVariants` export and the `ConfirmDialogVariants` type are removed.
  - `RULE_SETS.confirm`.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/shared/confirm-dialog/ConfirmDialog.test.tsx` inside its `describe`:

```tsx
  it('carries tone through the icon and confirm button, without a colored stripe', () => {
    render(
      <Tooltip.Provider>
        <ConfirmDialog tone="danger" title="Delete record?" description="This can't be undone." open>
          {null}
        </ConfirmDialog>
      </Tooltip.Provider>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).not.toMatch(/border-t-/);
    expect(dialog.querySelector('svg.text-danger')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Confirm' }).dataset.tone).toBe('danger');
  });

  it('announces its description', () => {
    render(
      <Tooltip.Provider>
        <ConfirmDialog tone="warning" title="Leave?" description="Unsaved changes will be lost." open>
          {null}
        </ConfirmDialog>
      </Tooltip.Provider>,
    );
    const dialog = screen.getByRole('dialog');
    expect(document.getElementById(dialog.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Unsaved changes will be lost.');
  });

  it('rejects the removed variant prop at compile time', () => {
    // @ts-expect-error — `variant` was replaced by `tone`
    const element = <ConfirmDialog variant="destructive" open />;
    expect(element).toBeTruthy();
  });
```

Also change the existing test's `variant="success"` to `tone="success"`.

Append to `tests/design-system/codemods/migrate-props.test.ts`:

```ts
describe('confirm rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.confirm, 'x.tsx').output;

  it.each([
    ['<ConfirmDialog variant="destructive" title="x">', '<ConfirmDialog tone="danger" title="x">'],
    ['<ConfirmDialog variant="warning">', '<ConfirmDialog tone="warning">'],
    ['<ConfirmDialog variant="success">', '<ConfirmDialog tone="success">'],
    ['<ConfirmDialog variant="info">', '<ConfirmDialog tone="info">'],
    ['<ConfirmDialog title="x">', '<ConfirmDialog title="x">'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/shared/confirm-dialog tests/design-system/codemods`
Expected: FAIL.
- `tone` is ignored: the icon is `text-destructive` and the dialog has `border-t-4`.
- `aria-describedby` is undefined.
- `RULE_SETS.confirm` is undefined.

- [ ] **Step 3: Implement ConfirmDialog**

Replace the types and maps (from `export type ConfirmDialogVariants` through the end of `confirmDialogVariants`) with:

```tsx
export type ConfirmDialogTone = 'danger' | 'warning' | 'success' | 'info';

export type ConfirmDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Meaning of the action; carried by the icon and the confirm button. @default 'danger' */
  tone?: ConfirmDialogTone;
  /** Overrides the auto-mapped button tone. */
  primaryTone?: ButtonVariants['tone'];
  title?: ReactNode;
  description?: ReactNode;
  /** @default 'Confirm' */
  confirmLabel?: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  children?: ReactNode | [ReactNode] | [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode];
  className?: string;
  /** When provided, the consumer manages spinner and close. When omitted, the component auto-manages both. */
  loading?: boolean;
  /** Escape and outside clicks close the dialog only when true; a ✕ is always shown. @default false */
  dismissible?: boolean;
  /** Supports async — return a `Promise` for auto-spinner and auto-close on resolve. */
  onConfirm?: () => void | Promise<unknown>;
};

const TONE_ICON: Record<ConfirmDialogTone, typeof AlertTriangle> = {
  warning: AlertTriangle,
  success: CheckCircle,
  danger: XCircle,
  info: Info,
};

const TONE_BUTTON: Record<ConfirmDialogTone, ButtonVariants['tone']> = {
  danger: 'danger',
  success: 'neutral',
  warning: 'neutral',
  info: 'neutral',
};

export const confirmDialogIconVariants = cva('mb-4', {
  variants: {
    tone: {
      warning: 'text-warning',
      success: 'text-success',
      danger: 'text-danger',
      info: 'text-info',
    },
  },
  defaultVariants: {
    tone: 'danger',
  },
});
```

In the component body:
- Destructure `tone = 'danger'` in place of `variant = 'destructive'`.
- `const Icon = TONE_ICON[tone];`
- Add `const descriptionId = useId();` and import `useId` from `react`.
- On `<Dialog.Content …>`:
  - change `className={cn(confirmDialogVariants({ variant }), className)}` to `className={className}`;
  - add `{...(description ? { 'aria-describedby': descriptionId } : {})}` before the `className` prop.
- `<Icon className={confirmDialogIconVariants({ tone })} size={48} />`.
- Give the description paragraph `id={descriptionId}`: `<p id={descriptionId} className="text-fg-muted text-sm">{description}</p>`.
- Change `variant !== 'success' && variant !== 'info'` to `tone !== 'success' && tone !== 'info'`.
- `tone={primaryTone ?? TONE_BUTTON[tone]}` on the confirm `Button`.
- Rewrite the JSDoc block above the function:
  - its "Variant → Button Mapping" section now reads "Tone → Button: `danger → danger`; `success`, `warning`, `info` → `neutral`. Override with `primaryTone`."
  - remove the stale "destructive → destructive" lines.
- Remove `cn` and `VariantProps` from the imports if they are unused.

If any file outside this folder imports `confirmDialogVariants` or `ConfirmDialogVariants`, `tsc -b` lists it; remove those uses. As of this plan, nothing does.

- [ ] **Step 4: Add the codemod and migrate**

In `scripts/design-system/codemods/rules.ts`, add the rule and register it:

```ts
const CONFIRM_TONES: Readonly<Record<string, string>> = {
  destructive: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'info',
};

const confirmDialogRule: TagRule = {
  tag: 'ConfirmDialog',
  keys: ['variant'],
  transform: (attrs) => (attrs.variant === undefined ? {} : { tone: lookup(CONFIRM_TONES, attrs.variant, 'ConfirmDialog variant') }),
};
```

```ts
  confirm: [confirmDialogRule],
```

Run `P ds:migrate confirm`.
Expected: about 16 tags changed (demos, FileCard.mdx, UseRowEditing.mdx, FormSubmitButtons) and 0 manual items.

In `src/component-docs/shared/CountTooltip.mdx:33`, replace `className="bg-destructive-100 text-destructive"` with `className="bg-danger-subtle text-danger"`. In `ConfirmDialog.mdx`, update any prose that says "variant" to "tone", and list the four tones.

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/components/shared tests/design-system && P exec tsc -b`
Expected: PASS and exit 0. `tsc` consumes the `@ts-expect-error`.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src scripts tests && \
git commit -m "feat(shared): ConfirmDialog tone, announced description, no tone stripe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 8: `FormContainer.Actions` and `FormSection` (replace FormSubmitButtons and FieldSection)

**Files:**
- Create: `src/components/forms/form-container/FormContainerActions.tsx`
- Modify: `src/components/forms/form-container/FormContainer.tsx` (props become `<form>` attributes; `.Actions` static)
- Create: `src/components/forms/form-section/FormSection.tsx`, `src/components/forms/form-section/index.ts`
- Modify: `src/components/forms/index.ts` (export `./form-section`)
- Modify: `src/locales/en/common.json`, `src/locales/ar/common.json` (the `form.*` keys)
- Delete: `src/components/shared/{form-submit-buttons,field-section}/`, `src/component-docs/shared/{FormSubmitButtons,FieldSection}.mdx`
- Modify: `src/components/shared/index.ts` (drop both barrel lines)
- Modify: `src/component-docs/forms/FormContainer.mdx` (an Actions section); create `src/component-docs/forms/FormSection.mdx`
- Test: `src/components/forms/form-container/FormContainer.test.tsx`, `src/components/forms/form-section/FormSection.test.tsx` (new)

**Interfaces:**
- Consumes: `ConfirmDialog` with `tone` (Task 7) and `Button` (SP2).
- Produces:
  - `FormContainerProps<T> = Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> & { formContext: UseFormReturn<T>; onSuccess: SubmitHandler<T> }`.
  - `FormContainer.Actions: FC<FormContainerActionsProps>`, where `FormContainerActionsProps = ComponentPropsWithoutRef<'div'> & { submitLabel?: ReactNode; cancelLabel?: ReactNode; onCancel?: () => void; hideCancel?: boolean; confirmOnCancel?: boolean; sticky?: boolean }`.
  - `FormSection: FC<Omit<ComponentPropsWithoutRef<'section'>, 'title'> & { title?: ReactNode; description?: ReactNode }>`.
  - i18n keys `common.form.discardTitle`, `common.form.discardDescription`, `common.form.discardConfirm`, `common.form.keepEditing`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/forms/form-container/FormContainer.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FormContainer, FormInput } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const Example = ({ onSuccess, onCancel }: { onSuccess: () => Promise<void> | void; onCancel: () => void }) => {
  const form = useForm({ defaultValues: { name: '' } });

  return (
    <FormContainer formContext={form} onSuccess={onSuccess}>
      <FormInput name="name" label="Name" />
      <FormContainer.Actions confirmOnCancel onCancel={onCancel} />
    </FormContainer>
  );
};

const renderExample = (props: { onSuccess?: () => Promise<void> | void; onCancel?: () => void } = {}) => {
  const onCancel = props.onCancel ?? vi.fn();
  render(
    <MemoryRouter>
      <Tooltip.Provider>
        <Example onSuccess={props.onSuccess ?? (() => undefined)} onCancel={onCancel} />
      </Tooltip.Provider>
    </MemoryRouter>,
  );
  return { onCancel };
};

describe('FormContainer.Actions', () => {
  it('shows the submit button as loading while the submit handler runs', async () => {
    renderExample({ onSuccess: () => new Promise<void>(() => undefined) });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Save/ }).getAttribute('aria-busy')).toBe('true'));
  });

  it('cancels a pristine form without asking', () => {
    const { onCancel } = renderExample();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks before discarding a dirty form', async () => {
    const { onCancel } = renderExample();
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Layla' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
```

Create `src/components/forms/form-section/FormSection.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormSection } from '@components/forms';

afterEach(cleanup);

describe('FormSection', () => {
  it('titles a group of fields and separates sections with a hairline', () => {
    render(
      <>
        <FormSection title="Patient" description="Who the visit is for">
          <input aria-label="Name" />
        </FormSection>
        <FormSection title="Insurance">
          <input aria-label="Policy" />
        </FormSection>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(screen.getByText('Who the visit is for').className).toContain('text-fg-muted');
    const sections = document.querySelectorAll('[data-slot="form-section"]');
    expect(sections).toHaveLength(2);
    expect(sections[1].className).toContain('[&+&]:border-t');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/forms/form-container src/components/forms/form-section`
Expected: FAIL. `FormContainer.Actions` is undefined and `FormSection` is not exported.

- [ ] **Step 3: Add the i18n keys**

In `src/locales/en/common.json`, add a `"form"` object:

```json
  "form": {
    "discardTitle": "Discard unsaved changes?",
    "discardDescription": "Your changes on this form will be lost.",
    "discardConfirm": "Discard",
    "keepEditing": "Keep editing"
  },
```

In `src/locales/ar/common.json`:

```json
  "form": {
    "discardTitle": "تجاهل التغييرات غير المحفوظة؟",
    "discardDescription": "ستفقد التغييرات التي أجريتها على هذا النموذج.",
    "discardConfirm": "تجاهل",
    "keepEditing": "متابعة التعديل"
  },
```

- [ ] **Step 4: Implement**

Create `src/components/forms/form-container/FormContainerActions.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactNode, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@components/ui';
import { ConfirmDialog } from '@components/shared';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

export type FormContainerActionsProps = ComponentPropsWithoutRef<'div'> & {
  /** @default t('save') */
  submitLabel?: ReactNode;
  /** @default t('cancel') */
  cancelLabel?: ReactNode;
  /** @default navigate(-1) */
  onCancel?: () => void;
  hideCancel?: boolean;
  /** Ask before cancelling — only when the form has unsaved changes. */
  confirmOnCancel?: boolean;
  /** Pin the row to the bottom of a scrolling form. */
  sticky?: boolean;
};

/** Footer row for a FormContainer: extra actions (children), Cancel, then Submit (loading while submitting). */
const FormContainerActions: FC<FormContainerActionsProps> = ({
  className,
  submitLabel,
  cancelLabel,
  onCancel,
  hideCancel = false,
  confirmOnCancel = false,
  sticky = false,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  const navigate = useNavigate();
  const {
    formState: { isSubmitting, isDirty },
  } = useFormContext();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const cancel = onCancel ?? (() => navigate(-1));

  const handleCancelClick = () => {
    if (confirmOnCancel && isDirty) {
      setIsConfirmOpen(true);
      return;
    }
    cancel();
  };

  return (
    <div
      data-slot="form-actions"
      className={cn('flex items-center justify-end gap-2 pt-2', sticky && 'bg-canvas border-border-subtle sticky bottom-0 z-10 border-t py-3', className)}
      {...props}
    >
      {children}

      <Conditional.If condition={!hideCancel}>
        <Button type="button" variant="outline" onClick={handleCancelClick}>
          {cancelLabel ?? t('cancel')}
        </Button>
      </Conditional.If>

      <Button type="submit" loading={isSubmitting}>
        {submitLabel ?? t('save')}
      </Button>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        tone="warning"
        title={t('form.discardTitle')}
        description={t('form.discardDescription')}
        confirmLabel={t('form.discardConfirm')}
        cancelLabel={t('form.keepEditing')}
        onConfirm={cancel}
      >
        {null}
      </ConfirmDialog>
    </div>
  );
};

export default FormContainerActions;
```

Replace `src/components/forms/form-container/FormContainer.tsx` with:

```tsx
import type { ComponentPropsWithoutRef } from 'react';
import { type FieldValues, FormProvider, type SubmitHandler, type UseFormReturn } from 'react-hook-form';

import FormContainerActions from './FormContainerActions';

export type FormContainerProps<TFieldValues extends FieldValues = FieldValues> = Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> & {
  formContext: UseFormReturn<TFieldValues>;
  onSuccess: SubmitHandler<TFieldValues>;
};

function FormContainer<TFieldValues extends FieldValues = FieldValues>({
  children,
  formContext,
  onSuccess,
  ...props
}: FormContainerProps<TFieldValues>) {
  return (
    <FormProvider<TFieldValues> {...formContext}>
      <form data-slot="form-container" autoComplete="new-password" noValidate {...props} onSubmit={formContext.handleSubmit(onSuccess)}>
        {children}
      </form>
    </FormProvider>
  );
}

FormContainer.Actions = FormContainerActions;

export default FormContainer;
```

Replace `src/components/forms/form-container/index.ts` with:

```ts
export { default as FormContainer } from './FormContainer';
export type { FormContainerProps } from './FormContainer';
export type { FormContainerActionsProps } from './FormContainerActions';
```

Create `src/components/forms/form-section/FormSection.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type FormSectionProps = Omit<ComponentPropsWithoutRef<'section'>, 'title'> & {
  title?: ReactNode;
  description?: ReactNode;
};

/** A titled group of fields; consecutive sections are separated by a hairline. */
const FormSection: FC<FormSectionProps> = ({ className, title, description, children, ...props }) => (
  <section data-slot="form-section" className={cn('border-border-subtle flex flex-col gap-4 [&+&]:border-t [&+&]:pt-6', className)} {...props}>
    <Conditional.If condition={!!title || !!description}>
      <header data-slot="form-section-header" className="flex flex-col gap-1">
        <Conditional.If condition={!!title}>
          <h3 className="text-fg text-md font-semibold">{title}</h3>
        </Conditional.If>

        <Conditional.If condition={!!description}>
          <p className="text-fg-muted text-sm">{description}</p>
        </Conditional.If>
      </header>
    </Conditional.If>

    <div data-slot="form-section-content" className="grid gap-4">
      {children}
    </div>
  </section>
);

FormSection.displayName = 'FormSection';

export default FormSection;
```

`src/components/forms/form-section/index.ts`:

```ts
export { default as FormSection } from './FormSection';
```

Add `export * from './form-section';` to `src/components/forms/index.ts`.

- [ ] **Step 5: Retire FormSubmitButtons and FieldSection**

```bash
git rm -rq src/components/shared/form-submit-buttons src/components/shared/field-section \
  src/component-docs/shared/FormSubmitButtons.mdx src/component-docs/shared/FieldSection.mdx
```

- In `src/components/shared/index.ts`, delete the two barrel lines.
- Add a "Actions" section to `FormContainer.mdx`: the default Save/Cancel, `confirmOnCancel`, `sticky`, extra actions as children, and the props table.
- Create `src/component-docs/forms/FormSection.mdx` with frontmatter `id: form-section`, `category: Forms`. It shows two sections (Patient, Insurance) with fields, plus a props table (`title`, `description`).

The grep must print nothing:

```bash
grep -rnE 'FormSubmitButtons|FieldSection' src
```

- [ ] **Step 6: Run tests**

Run: `P exec vp test --run src tests && P exec tsc -b`
Expected: PASS and exit 0. The i18n parity test covers the new keys.

- [ ] **Step 7: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && \
git commit -m "feat(forms): FormContainer.Actions with dirty-aware cancel and FormSection; retire FormSubmitButtons and FieldSection

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 9: Card absorbs PrimeCard and CollapsibleCard (`collapsible`, `loading`, `tone`, header shortcuts)

**Files:**
- Rewrite: `src/components/ui/card/Card.tsx`; modify `src/components/ui/card/index.ts`
- Modify: `src/locales/{en,ar}/common.json` (`card.toggle`)
- Delete: `src/components/shared/{prime-card,collapsible-card}/`, `src/component-docs/shared/{PrimeCard,CollapsibleCard}.mdx`
- Modify: `src/components/shared/index.ts` (drop both barrel lines)
- Modify: `src/component-docs/hooks/UseRowEditing.mdx:61-80,251-275` (CollapsibleCard → `Card collapsible`)
- Modify: `src/component-docs/ui/Card.mdx` (sections for tone, collapsible, loading and the shortcut header)
- Test: `src/components/ui/card/Card.test.tsx` (extend)

**Interfaces:**
- Consumes: `IconButton`, `Skeleton`, `Tooltip` (SP2) and Radix Collapsible.
- Produces:
  - `CardProps = Omit<ComponentPropsWithoutRef<'article'>, 'title'> & { tone?: 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'; title?; description?; icon?; tooltip?; collapsible?; open?; defaultOpen?; onOpenChange?; loading? }`.
  - The statics are unchanged: Header, Title, Description, Actions, Content, Footer.
  - A collapsible header renders a toggle (`data-slot="card-toggle"`) in column 3.
  - `common.card.toggle`.
- PrimeCard variant → Card tone (used only in docs):

  | PrimeCard variant | Card tone |
  |---|---|
  | `default` | `neutral` |
  | `primary` | `accent` |
  | `secondary` | `neutral` |
  | `success` | `success` |
  | `destructive` | `danger` |
  | `warning` | `warning` |
  | `info` | `info` |
  | `outline`, `outline-dashed`, `glass`, `gradient` | removed (parent §8.2) |

- [ ] **Step 1: Write the failing tests**

Append to `src/components/ui/card/Card.test.tsx` (add the `fireEvent` and `Tooltip` imports, and `import '../../../i18n';`):

```tsx
describe('Card shortcuts and states', () => {
  it('builds the header from title, description, icon and tooltip', () => {
    render(
      <Tooltip.Provider>
        <Card title="Patients" description="Seen this week" icon={<svg data-testid="icon" />} tooltip="Counts unique visits">
          <Card.Content>Body</Card.Content>
        </Card>
      </Tooltip.Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Patients' })).toBeTruthy();
    expect(screen.getByText('Seen this week')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More information' })).toBeTruthy();
    expect(screen.getByTestId('icon').closest('[data-slot="card-header"]')).not.toBeNull();
  });

  it('collapses and removes its body from the tab order', () => {
    render(
      <Tooltip.Provider>
        <Card title="Billable lines" collapsible>
          <Card.Content>
            <button type="button">Add row</button>
          </Card.Content>
        </Card>
      </Tooltip.Provider>,
    );
    const toggle = screen.getByRole('button', { name: 'Show or hide content' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Add row' })).toBeNull();
  });

  it('shows skeletons while loading', () => {
    render(
      <Card title="Patients" loading>
        <Card.Content>Real body</Card.Content>
      </Card>,
    );
    expect(screen.queryByText('Real body')).toBeNull();
    expect(document.querySelector('[data-slot="card-content"]')?.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('tints the whole card by tone', () => {
    render(<Card tone="success" data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card.dataset.tone).toBe('success');
    expect(card.className).toContain('bg-success-subtle');
  });
});
```

If SP2's Skeleton uses a different `data-slot`, read it from `ui/skeleton/Skeleton.tsx` and use that value.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/card`
Expected: FAIL. The `title` prop is not rendered as a header, there is no toggle, `loading` is ignored, and `tone` is ignored.

- [ ] **Step 3: Add the key**

- `src/locales/en/common.json`: `"card": { "toggle": "Show or hide content" },`
- `src/locales/ar/common.json`: `"card": { "toggle": "إظهار المحتوى أو إخفاؤه" },`

- [ ] **Step 4: Rewrite Card**

Replace `src/components/ui/card/Card.tsx` with:

```tsx
import { Children, type ComponentPropsWithoutRef, createContext, type FC, isValidElement, type ReactNode, useContext } from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { IconButton, Skeleton, Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { ChevronDown, Info } from 'lucide-react';

const cardVariants = cva('bg-surface border-border text-fg rounded-lg border', {
  variants: {
    tone: {
      neutral: '',
      accent: 'bg-accent-subtle',
      info: 'bg-info-subtle',
      success: 'bg-success-subtle',
      warning: 'bg-warning-subtle',
      danger: 'bg-danger-subtle',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

export type CardProps = Omit<ComponentPropsWithoutRef<'article'>, 'title'> &
  VariantProps<typeof cardVariants> & {
    /** Header shortcut: renders Card.Header when no explicit header child is given. */
    title?: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    tooltip?: ReactNode;
    collapsible?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Replaces the body with skeleton lines. */
    loading?: boolean;
  };

type CardHeaderProps = ComponentPropsWithoutRef<'header'>;
type CardTitleProps = ComponentPropsWithoutRef<'h3'>;
type CardDescriptionProps = ComponentPropsWithoutRef<'p'>;
type CardActionsProps = ComponentPropsWithoutRef<'div'>;
type CardContentProps = ComponentPropsWithoutRef<'section'>;
type CardFooterProps = ComponentPropsWithoutRef<'footer'>;

type CardComponent = FC<CardProps> & {
  Header: FC<CardHeaderProps>;
  Title: FC<CardTitleProps>;
  Description: FC<CardDescriptionProps>;
  Actions: FC<CardActionsProps>;
  Content: FC<CardContentProps>;
  Footer: FC<CardFooterProps>;
};

const CardContext = createContext<{ collapsible: boolean }>({ collapsible: false });

// Column 2 holds Card.Actions, column 3 the collapsible toggle; a hairline separates the header from a following body.
const Header: FC<CardHeaderProps> = ({ className, children, ...props }) => {
  const { collapsible } = useContext(CardContext);
  const { t } = useAppTranslation('common');

  return (
    <header
      data-slot="card-header"
      className={cn(
        'border-border-subtle grid auto-rows-min items-start gap-x-2 gap-y-1 px-5 pt-4 not-last:border-b not-last:pb-3',
        'has-data-[slot=card-actions]:grid-cols-[1fr_auto] has-data-[slot=card-toggle]:grid-cols-[1fr_auto_auto]',
        className,
      )}
      {...props}
    >
      {children}

      <Conditional.If condition={collapsible}>
        <CollapsiblePrimitive.Trigger asChild>
          <IconButton
            data-slot="card-toggle"
            size="sm"
            tooltip={false}
            aria-label={t('card.toggle')}
            className="col-start-3 row-start-1 self-start [&[data-state=open]>svg]:rotate-180"
          >
            <ChevronDown className="duration-base transition-transform motion-reduce:transition-none" />
          </IconButton>
        </CollapsiblePrimitive.Trigger>
      </Conditional.If>
    </header>
  );
};

const Title: FC<CardTitleProps> = ({ className, ...props }) => (
  <h3 data-slot="card-title" className={cn('text-fg text-md flex items-center gap-1.5 leading-tight font-semibold', className)} {...props} />
);

const Description: FC<CardDescriptionProps> = ({ className, ...props }) => (
  <p data-slot="card-description" className={cn('text-fg-muted text-sm', className)} {...props} />
);

const Actions: FC<CardActionsProps> = ({ className, ...props }) => (
  <div
    data-slot="card-actions"
    className={cn('col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-start justify-self-end', className)}
    {...props}
  />
);

const Content: FC<CardContentProps> = ({ className, ...props }) => (
  <section data-slot="card-content" className={cn('px-5 py-4', className)} {...props} />
);

const Footer: FC<CardFooterProps> = ({ className, ...props }) => (
  <footer data-slot="card-footer" className={cn('border-border-subtle flex items-center gap-2 border-t px-5 py-3', className)} {...props} />
);

type ShortcutHeaderProps = Pick<CardProps, 'title' | 'description' | 'icon' | 'tooltip'>;

const ShortcutHeader: FC<ShortcutHeaderProps> = ({ title, description, icon, tooltip }) => {
  const { t } = useAppTranslation('common');

  return (
    <Header>
      <div data-slot="card-heading" className={cn('grid min-w-0 items-center gap-x-2 gap-y-0.5', !!icon && 'grid-cols-[auto_1fr]')}>
        <Conditional.If condition={!!icon}>
          <span className="text-fg-muted flex [&_svg]:size-4">{icon}</span>
        </Conditional.If>

        <Title>
          {title}

          <Conditional.If condition={!!tooltip}>
            <Tooltip content={tooltip} align="start">
              <button type="button" aria-label={t('moreInfo')} className="focus-ring text-fg-muted inline-flex cursor-help rounded-sm">
                <Info size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          </Conditional.If>
        </Title>

        <Conditional.If condition={!!description}>
          <Description className={cn(!!icon && 'col-start-2')}>{description}</Description>
        </Conditional.If>
      </div>
    </Header>
  );
};

const LoadingBody: FC = () => (
  <Content aria-busy="true">
    <div className="grid gap-2">
      <Skeleton />
      <Skeleton />
      <Skeleton className="w-2/3" />
    </div>
  </Content>
);

const Card: CardComponent = ({
  className,
  tone,
  title,
  description,
  icon,
  tooltip,
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  loading = false,
  children,
  ...props
}) => {
  const childArray = Children.toArray(children);
  const explicitHeader = childArray.find((child) => isValidElement(child) && child.type === Header);
  const body = childArray.filter((child) => child !== explicitHeader);
  const hasShortcutHeader = !explicitHeader && (title !== undefined || description !== undefined || icon !== undefined);

  const articleProps = {
    'data-slot': 'card',
    'data-tone': tone ?? 'neutral',
    className: cn(cardVariants({ tone }), className),
    ...props,
  };

  const inner = (
    <>
      {explicitHeader}

      <Conditional.If condition={hasShortcutHeader}>
        <ShortcutHeader title={title} description={description} icon={icon} tooltip={tooltip} />
      </Conditional.If>

      <Conditional>
        <Conditional.If condition={collapsible}>
          <CollapsiblePrimitive.Content
            data-slot="card-collapsible-content"
            className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden motion-reduce:animate-none"
          >
            <Conditional>
              <Conditional.If condition={loading}>
                <LoadingBody />
              </Conditional.If>

              <Conditional.Else>{body}</Conditional.Else>
            </Conditional>
          </CollapsiblePrimitive.Content>
        </Conditional.If>

        <Conditional.Else>
          <Conditional>
            <Conditional.If condition={loading}>
              <LoadingBody />
            </Conditional.If>

            <Conditional.Else>{body}</Conditional.Else>
          </Conditional>
        </Conditional.Else>
      </Conditional>
    </>
  );

  return (
    <CardContext.Provider value={{ collapsible }}>
      <Conditional>
        <Conditional.If condition={collapsible}>
          <CollapsiblePrimitive.Root asChild open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <article {...articleProps}>{inner}</article>
          </CollapsiblePrimitive.Root>
        </Conditional.If>

        <Conditional.Else>
          <article {...articleProps}>{inner}</article>
        </Conditional.Else>
      </Conditional>
    </CardContext.Provider>
  );
};

Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Actions = Actions;
Card.Content = Content;
Card.Footer = Footer;

export default Card;
```

`src/components/ui/card/index.ts` stays `export { default as Card } from './Card'; export type { CardProps } from './Card';`.

The SP2 test "rests flat … no shadow" still holds. The SP2 test "places Actions in the header trailing slot" still holds, because Actions stays in column 2.

- [ ] **Step 5: Retire PrimeCard and CollapsibleCard; migrate the docs**

```bash
git rm -rq src/components/shared/prime-card src/components/shared/collapsible-card \
  src/component-docs/shared/PrimeCard.mdx src/component-docs/shared/CollapsibleCard.mdx
```

- Delete both barrel lines in `src/components/shared/index.ts`.
- In `UseRowEditing.mdx`, replace each `<CollapsibleCard>…</CollapsibleCard>` block (lines ~63-80 and ~253-275) with:

```tsx
<Card collapsible>
  <Card.Header>
    <Card.Title>
      <FileCode2 className="text-fg-muted size-4" />
      Billable Lines
    </Card.Title>

    <Card.Actions>
      <AddRowButton />
    </Card.Actions>
  </Card.Header>

  <Card.Content className="p-0">{/* the block's existing table content */}</Card.Content>
</Card>
```

  Keep each block's inner content exactly as it is, update its import to `Card` from `@components/ui`, and replace `text-primary` on the icon with `text-fg-muted`.
- In `Card.mdx`:
  - Add "Tone" (the six tones side by side).
  - Add "Header shortcut" (`title`, `description`, `icon`, `tooltip`).
  - Add "Collapsible" (`collapsible`, `defaultOpen`, controlled `open`/`onOpenChange`, plus `Card.Actions` next to the toggle).
  - Add "Loading".
  - Extend the API table with each new prop.

The grep must print nothing:

```bash
grep -rnE 'PrimeCard|CollapsibleCard' src
```

- [ ] **Step 6: Run tests**

Run: `P exec vp test --run src tests && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 7: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && \
git commit -m "feat(ui): Card tone, collapsible, loading and header shortcuts; retire PrimeCard and CollapsibleCard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 10: Deferred minors — compact filter pills, FormattedNumber arrow keys

**Files:**
- Modify: `src/components/tables/data-table-filters/async-select-filter/AsyncSelectFilter.tsx:93,96`
- Modify: `src/components/tables/data-table-filters/date-filter/DateFilter.tsx:97,100`
- Modify: `src/components/tables/data-table-filters/time-filter/TimeFilter.tsx:51,54`
- Modify: `src/components/tables/data-table-filters/select-filter/SelectFilter.tsx:75,78`
- Modify: `src/components/tables/data-table-filters/filter-chip-list/FilterChipList.tsx:33,38,45`
- Modify: `src/components/ui/formatted-number/FormattedNumber.tsx` (`handleKeyDown`, lines 74-78; destructure `onKeyDown`)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (a "table filters are clean" assertion)
- Test: `src/components/ui/formatted-number/FormattedNumber.test.tsx` (extend)

**Interfaces:**
- Consumes: `Combobox.Trigger size` (SP2 Task 15).
- Produces: no new exports. `FormattedNumber` now composes a consumer's `onKeyDown` instead of being replaced by it.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/ui/formatted-number/FormattedNumber.test.tsx` inside its `describe`:

```tsx
  it('steps with the arrow keys without moving the caret, and keeps the consumer handler', () => {
    const handleChange = vi.fn();
    const handleKeyDown = vi.fn();
    renderNumber({ value: 5, min: 0, max: 10, onChange: handleChange, onKeyDown: handleKeyDown });
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(false);
    expect(handleChange).toHaveBeenCalledWith(6);
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });
```

In `tests/design-system/forbidden-patterns.test.ts`, add inside `describe('clean primitives', …)`:

```ts
  it('table filters contain no forbidden patterns (SP3 Plan A)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/tables/data-table-filters/'));
    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/formatted-number tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. The ArrowUp `keyDown` returns `true` (it is not prevented), the consumer's `onKeyDown` replaces the stepping, and the filters guard lists the four filters and FilterChipList.

- [ ] **Step 3: Implement**

**The four filters.** On each `<Combobox.Trigger …>`, replace

```tsx
className="hover:not-disabled:border-primary-25 hover:not-disabled:ring-primary-25 w-auto gap-1 rounded-sm px-2 py-1 text-xs"
```

with

```tsx
size="sm"
className="w-auto gap-1"
```

and change the `ChevronDown` three lines below from `className="text-muted-400"` to `className="text-fg-muted"`.

**FilterChipList.tsx:**

| Line | Old | New |
|---|---|---|
| 33 | `text-muted-400` | `text-fg-muted` |
| 38 | `text-muted-400 hover:text-destructive` | `text-fg-muted hover:text-danger` |
| 45 | `bg-primary-15` | `bg-accent-subtle` |

If the file has other legacy classes the guard reports, map them the same way: `muted-*` → `fg-muted`/`fg-subtle`, `primary-*` tints → `accent-subtle`, `destructive` → `danger`.

**FormattedNumber.tsx:**
- Add `onKeyDown,` to the component's destructure (next to `onBlur`).
- Replace `handleKeyDown` with:

```tsx
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'ArrowUp' && !isIncrementDisabled) {
      event.preventDefault();
      handleIncrement();
    }

    if (event.key === 'ArrowDown' && !isDecrementDisabled) {
      event.preventDefault();
      handleDecrement();
    }
  };
```

Because `onKeyDown` is now destructured, it no longer reaches `{...props}`, and `handleKeyDown` stays wired.

- [ ] **Step 4: Run tests**

Run: `P exec vp test --run src/components tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src tests && \
git commit -m "fix: compact token filter pills; FormattedNumber arrow keys prevent caret jump and compose onKeyDown

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 11: Plan A exit — clean folders, gate, visual review of the forms

**Files:**
- Modify: `tests/design-system/forbidden-patterns.test.ts` (a "Plan A shared folders are clean" assertion)
- Possibly modify: whatever the assertion or the review surfaces

**Interfaces:**
- Consumes: everything above.
- Produces: the Plan A exit state. `forms/`, the table filters and `shared/{confirm-dialog,count-tooltip}` are clean, and seven components are retired: FormControl, FormLabel, FormMessage, ErrorTooltip, FormSubmitButtons, FieldSection, PrimeCard and CollapsibleCard.

- [ ] **Step 1: Add the shared-folder assertion**

Add to `describe('clean primitives', …)`:

```ts
  it('Plan A shared folders contain no forbidden patterns', () => {
    const folders = ['src/components/shared/confirm-dialog/', 'src/components/shared/count-tooltip/', 'src/components/ui/'];
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => folders.some((folder) => file.startsWith(folder)));
    expect(offenders).toEqual([]);
  });

  it('Plan A retired components are gone', () => {
    const retired = ['form-control', 'form-label', 'form-message', 'error-tooltip', 'form-submit-buttons', 'field-section', 'prime-card', 'collapsible-card'];
    const present = componentFolders(`${REPO_ROOT}src/components`).filter((name) => retired.includes(name));
    expect(present).toEqual([]);
  });
```

`componentFolders` already exists in this file (SP2 exit). Then run: `P exec vp test --run tests/design-system`.
Expected: PASS. If an assertion fails, fix the listed file or folder, and record which earlier task should have caught it.

- [ ] **Step 2: Full gate**

```bash
P exec vp check && P exec vp test --run && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && P exec vp build && P docs:lint && P ds:baseline
```

Expected: every command exits 0, and `ds:baseline` reports no increase. Record the test count and the remaining violation total.

- [ ] **Step 3: Visual review (dark/light × en/ar)**

1. Start `P exec vp dev --open false --port 3123` in the background.
2. Screenshot these docs pages in all four combinations, opening any dialog or menu first. Save each to `.superpowers/screens/sp3a-<page>-<theme>-<lang>.png`.
   - `/components/form-field`
   - `/components/form-with-validation` (submit it empty first, so errors show)
   - `/components/form-checkbox-group`, `/components/form-radio-group`
   - `/components/form-container`, `/components/form-section`
   - `/components/card`
   - `/components/confirm-dialog`
   - `/components/data-table`

   Check doc ids with `grep -rh '^id: ' src/component-docs | sort` before navigating.
3. Check each of these:
   - Every error appears as an inline line under its field, with no ⓘ inside an input.
   - Descriptions are muted and errors are danger-colored.
   - Required `*` markers are present.
   - Choice groups show a danger border when invalid.
   - Cards: the collapsible chevron rotates, the loading skeleton shows, and the tone tints are subtle.
   - ConfirmDialog has no colored top border.
   - Table filter pills are 28px.
   - In Arabic, every message line and label row mirrors.
4. Smoke-render every `/components/*` page and record any page that shows the error boundary. Match on the boundary's wrapper (`div.min-h-dvh.items-center.justify-center .max-w-lg.text-center`), not on text.
5. Stop: `pkill -f "vp dev --open false --port 3123"; playwright-cli close; rm -rf .playwright-cli`.

- [ ] **Step 4: Commit**

```bash
git add -A tests/design-system src && \
git commit -m "test(design-system): SP3 Plan A exit — forms and composites clean, retired components gone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


