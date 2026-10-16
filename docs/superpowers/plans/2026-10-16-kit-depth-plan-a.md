# Kit depth — Plan A: overlays and data display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Money, Sheet, StatCard, Timeline, DataTable bulk selection and PageHeader media/meta to the kit, each tested and documented.

**Architecture:** Each component follows the existing kit pattern: a folder with `Component.tsx`, `index.ts` and `Component.test.tsx`, exported from its family barrel (`@components/ui`, `@components/shared`, `@components/tables`), styled with semantic tokens and `cva`, copy in `src/locales/{en,ar}/common.json`. Sheet is built on Radix Dialog like `Dialog`. Selection extends `DataTable` additively through its context.

**Tech Stack:** React 18, TypeScript, Tailwind v4 tokens, Radix (Dialog, Checkbox via kit), TanStack Table v8, react-i18next, date-fns via `useDate`, Vitest + Testing Library (happy-dom), MDX docs.

**Spec:** `docs/superpowers/specs/2026-10-16-kit-depth-design.md` (Plan A section).

## Global Constraints

- Semantic tokens only; the forbidden-pattern baseline (`corepack pnpm@10.34.7 ds:baseline`) stays `{}`. No coloured side stripes. Every field keeps Input's height.
- English and Arabic for all copy (`src/locales/{en,ar}`), RTL-correct layout (logical properties, mirrored directional icons, LTR-isolated values, Western digits).
- Every new component ships with tests (TDD) and a docs page with the enforced anatomy: titled `<Example>`s, `PropsTable` API, Accessibility, RTL notes. `docs:lint` and the render-all test must pass.
- The docs site stays dev-only; nothing in this spec may make production import `@component-docs/*`.
- Existing public APIs keep working: every change to `CalendarGrid`, `DataTable` and `PageHeader` is additive and optional.
- New dependency: `recharts` (v3) only (not used in Plan A). No drag-and-drop library.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Package commands: `corepack pnpm@10.34.7 …` (written `P` below: `P() { corepack pnpm@10.34.7 "$@"; }`).

## Review Focus

1. **Missing or invalid amounts.** `Money` given `null`, `undefined` or `NaN` (API gaps) must show an em dash, never "NaN" or "$0.00". → Task 1 test.
2. **Server-paginated tables.** With `manualPagination`, "Select all N results" cannot select rows that aren't loaded, so it must not be offered. → Task 5 test.
3. **Arabic Sheet placement.** `side="end"` must use logical insets so it opens on the left in Arabic (no physical `right-0`). → Task 2 test.
4. **Flat trends.** `StatCard` with `trend.value === 0` must read "No change" in a neutral tone, not "Up 0%" in green. → Task 3 test.
5. **Feeds with undated items.** `Timeline.Item` without `time` (or an unparseable one) must render without crashing and without a `<time>`. → Task 4 test.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app-config/appConfig.ts` | add `CURRENCY: 'USD'` |
| `src/lib/utils/formatMoney.ts` | `formatMoney`, `useMoneyFormat` (pure + hook) |
| `src/components/ui/money/{Money.tsx,index.ts,Money.test.tsx}` | display-only amount |
| `src/components/ui/sheet/{Sheet.tsx,index.ts,Sheet.test.tsx}` | side panel on Radix Dialog |
| `src/components/shared/stat-card/{StatCard.tsx,index.ts,StatCard.test.tsx}` | KPI card with trend |
| `src/components/shared/timeline/{Timeline.tsx,useGroupedByDay.ts,index.ts,Timeline.test.tsx}` | activity feed |
| `src/components/tables/data-table/data-table-selection/{createSelectionColumn.tsx,DataTableBulkActions.tsx,index.ts,selection.test.tsx}` | selection column + bulk bar |
| `src/components/tables/data-table/DataTable.tsx` | context gains `bulkActionsMounted` |
| `src/components/tables/data-table/data-table-toolbar/DataTableToolbar.tsx` | hides itself while bulk actions show |
| `src/components/tables/data-table/data-table-content/DataTableContent.tsx` | Escape clears selection |
| `src/components/shared/page-header/PageHeader.tsx` | `media`, `meta` |
| `src/locales/{en,ar}/common.json` | `statCard.*`, `timeline.*`, `table.select*` |
| `src/component-docs/ui/{Money,Sheet}.mdx`, `src/component-docs/shared/{StatCard,Timeline}.mdx` | new docs pages |
| `src/component-docs/tables/DataTable.mdx`, `src/component-docs/shared/PageHeader.mdx` | new sections |

---

### Task 1: Money and formatMoney

**Files:**
- Modify: `src/app-config/appConfig.ts`
- Create: `src/lib/utils/formatMoney.ts`; modify `src/lib/utils/index.ts`
- Create: `src/components/ui/money/Money.tsx`, `index.ts`, `Money.test.tsx`; modify `src/components/ui/index.ts`
- Create: `src/component-docs/ui/Money.mdx`

**Interfaces:**
- Produces: `formatMoney(value: number, language: string, options?: FormatMoneyOptions): string`; `useMoneyFormat(): (value: number, options?: FormatMoneyOptions) => string`; `type FormatMoneyOptions = { currency?: string; compact?: boolean; negative?: 'sign' | 'parentheses'; minimumFractionDigits?: number; maximumFractionDigits?: number }`; `<Money value currency? compact? negative? tone? />` from `@components/ui`; `APP_CONFIGURATIONS.CURRENCY`.

- [ ] **Step 1: Write the failing test** — `src/components/ui/money/Money.test.tsx`

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Money } from '@components/ui';
import { formatMoney } from '@utils';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('formatMoney', () => {
  it('formats currency, compact and accounting negatives', () => {
    expect(formatMoney(1240.5, 'en', { currency: 'USD' })).toBe('$1,240.50');
    expect(formatMoney(12400, 'en', { currency: 'USD', compact: true })).toBe('$12.4K');
    expect(formatMoney(-80, 'en', { currency: 'USD', negative: 'parentheses' })).toBe('($80.00)');
  });

  it('keeps Western digits in Arabic', () => {
    const text = formatMoney(1240.5, 'ar', { currency: 'USD' });
    expect(text).toMatch(/1,240\.50/);
    expect(text).not.toMatch(/[٠-٩]/);
  });
});

describe('Money', () => {
  it('renders an LTR-isolated, tabular amount in the app currency', () => {
    render(<Money value={1240.5} />);
    const money = screen.getByText('$1,240.50');
    expect(money.getAttribute('dir')).toBe('ltr');
    expect(money.className).toContain('tabular-nums');
  });

  it('colours negative amounts danger by default, and not with tone="none"', () => {
    const { rerender } = render(<Money value={-5} currency="USD" />);
    expect(screen.getByText('-$5.00').className).toContain('text-danger');
    rerender(<Money value={-5} currency="USD" tone="none" />);
    expect(screen.getByText('-$5.00').className).not.toContain('text-danger');
  });

  it('shows an em dash for missing or invalid values', () => {
    render(
      <>
        <Money value={null} data-testid="a" />
        <Money value={undefined} data-testid="b" />
        <Money value={Number.NaN} data-testid="c" />
      </>,
    );
    for (const id of ['a', 'b', 'c']) expect(screen.getByTestId(id).textContent).toBe('—');
  });
});
```

- [ ] **Step 2: Run it** — `P exec vp test --run src/components/ui/money` → Expected: FAIL (`Money`/`formatMoney` not exported).

- [ ] **Step 3: Implement**

`src/app-config/appConfig.ts` — add to `APP_CONFIGURATIONS`:

```ts
  /** Default ISO 4217 currency for <Money> and money-formatted charts. */
  CURRENCY: 'USD',
```

`src/lib/utils/formatMoney.ts`:

```ts
import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@constants';

import { APP_CONFIGURATIONS } from '../../app-config/appConfig';

export type FormatMoneyOptions = {
  currency?: string;
  /** "12.4K" style. */
  compact?: boolean;
  /** "parentheses" uses accounting style: ($80.00). */
  negative?: 'sign' | 'parentheses';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/** Currency formatting with Western digits in every language (`-u-nu-latn`). */
export const formatMoney = (value: number, language: string, options: FormatMoneyOptions = {}): string => {
  const { currency = APP_CONFIGURATIONS.CURRENCY, compact = false, negative = 'sign', ...digits } = options;
  const base = language === LANGUAGES.AR ? 'ar' : 'en';

  return new Intl.NumberFormat(`${base}-u-nu-latn`, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    currencySign: negative === 'parentheses' ? 'accounting' : 'standard',
    ...(compact ? { maximumFractionDigits: 1 } : {}),
    ...digits,
  }).format(value);
};

export const useMoneyFormat = () => {
  const { i18n } = useTranslation();
  return (value: number, options?: FormatMoneyOptions) => formatMoney(value, i18n.language, options);
};
```

Add `export * from './formatMoney';` to `src/lib/utils/index.ts`.

`src/components/ui/money/Money.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cn, type FormatMoneyOptions, useMoneyFormat } from '@utils';

export type MoneyProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> &
  FormatMoneyOptions & {
    value: number | null | undefined;
    /** "auto" colours negative amounts danger. */
    tone?: 'auto' | 'none';
  };

const Money: FC<MoneyProps> = ({ value, currency, compact, negative, minimumFractionDigits, maximumFractionDigits, tone = 'auto', className, ...props }) => {
  const format = useMoneyFormat();
  const valid = typeof value === 'number' && Number.isFinite(value);

  return (
    <span
      data-slot="money"
      dir="ltr"
      className={cn('font-mono tabular-nums', tone === 'auto' && valid && value < 0 && 'text-danger', className)}
      {...props}
    >
      {valid ? format(value, { currency, compact, negative, minimumFractionDigits, maximumFractionDigits }) : '—'}
    </span>
  );
};

export default Money;
```

`src/components/ui/money/index.ts`: `export { default as Money, type MoneyProps } from './Money';` — and add `export * from './money';` to `src/components/ui/index.ts` (after `formatted-number`).

- [ ] **Step 4: Run it** — `P exec vp test --run src/components/ui/money` → Expected: PASS (6 tests). If `@utils` → app-config import creates a cycle error, keep the relative import shown (the `@app-config` alias is index-only).

- [ ] **Step 5: Docs page** — `src/component-docs/ui/Money.mdx`:

````mdx
---
id: money
title: Money
section: Components
category: UI
description: 'Display-only amount: currency, compact and accounting formats with Western digits, isolated left to right.'
tags: [ui, money, currency, number]
---

import { Money } from '@components/ui';

## Amounts

<Example title="Currency">
  <Money value={1240.5} />
  <Money value={1240.5} currency="EUR" />
  <Money value={1240.5} currency="JOD" />
</Example>

## Negative and compact

`tone="auto"` colours negative amounts danger; `negative="parentheses"` uses accounting style. `compact` shortens large values.

<Example title="Negatives and compact">
  <Money value={-80} />
  <Money value={-80} negative="parentheses" />
  <Money value={-80} tone="none" />
  <Money value={12400} compact />
</Example>

## Missing values

`null`, `undefined` and `NaN` render an em dash.

<Example title="Empty">
  <Money value={null} />
</Example>

## API

<PropsTable
  rows={[
    { prop: 'value', type: 'number | null | undefined', required: true, description: 'The amount; invalid values show —.' },
    { prop: 'currency', type: 'string (ISO 4217)', default: 'APP_CONFIGURATIONS.CURRENCY', description: 'Currency code.' },
    { prop: 'compact', type: 'boolean', default: 'false', description: '"12.4K" style.' },
    { prop: 'negative', type: "'sign' | 'parentheses'", default: "'sign'", description: 'How negatives are written.' },
    { prop: 'tone', type: "'auto' | 'none'", default: "'auto'", description: 'auto colours negatives danger.' },
    { prop: 'minimumFractionDigits · maximumFractionDigits', type: 'number', description: 'Override the currency’s decimals.' },
  ]}
/>

`formatMoney(value, language, options)` and `useMoneyFormat()` (from `@utils`) give the same string for charts, exports and aria labels.

## Accessibility

- Plain text in a `<span>`, read as written; a negative amount is still announced with its minus sign or parentheses, never by colour alone.

## RTL notes

- The amount is wrapped in `dir="ltr"` so the sign, symbol and digits keep their order in Arabic; digits are always Western.
````

- [ ] **Step 6: Verify and commit**

Run: `P docs:lint && P exec vp test --run src/components/ui/money src/component-docs && P exec tsc -b`
Expected: PASS.

```bash
git add src/app-config/appConfig.ts src/lib/utils src/components/ui/money src/components/ui/index.ts src/component-docs/ui/Money.mdx
git commit -m "feat(ui): Money and formatMoney — currency, compact and accounting formats with Western digits

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Sheet

**Files:**
- Create: `src/components/ui/sheet/Sheet.tsx`, `index.ts`, `Sheet.test.tsx`; modify `src/components/ui/index.ts`
- Create: `src/component-docs/ui/Sheet.mdx`

**Interfaces:**
- Produces: `Sheet` (Radix Root), `Sheet.Trigger`, `Sheet.Content` (`title` required, `description?`, `hideTitle?`, `dismissible?`, `side?: 'end' | 'start'`, `size?: 'sm' | 'md' | 'lg'`), `Sheet.Body`, `Sheet.Footer`, `Sheet.Close`; `type SheetContentProps`.

- [ ] **Step 1: Write the failing test** — `src/components/ui/sheet/Sheet.test.tsx`

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button, Sheet } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const Example = ({ dismissible, side }: { dismissible?: boolean; side?: 'end' | 'start' }) => (
  <Sheet>
    <Sheet.Trigger asChild>
      <Button>Book</Button>
    </Sheet.Trigger>
    <Sheet.Content title="New appointment" description="Fri 16 Oct" side={side} dismissible={dismissible}>
      <Sheet.Body>
        <input aria-label="Patient" />
      </Sheet.Body>
      <Sheet.Footer>
        <Button>Save</Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet>
);

describe('Sheet', () => {
  it('is a dialog named by its title, with a sticky footer for actions', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const sheet = screen.getByRole('dialog', { name: 'New appointment' });
    expect(sheet.querySelector('[data-slot="sheet-footer"]')?.textContent).toContain('Save');
    expect(sheet.querySelector('[data-slot="sheet-body"]')?.className).toContain('overflow-y-auto');
  });

  it('places side="end" with logical insets, so it opens on the left in Arabic', () => {
    render(<Example side="end" />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const classes = screen.getByRole('dialog').className;
    expect(classes).toContain('md:end-0');
    expect(classes).not.toMatch(/\b(md:)?(right|left)-0\b/);
  });

  it('ignores Escape when not dismissible', () => {
    render(<Example dismissible={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it** — `P exec vp test --run src/components/ui/sheet` → Expected: FAIL (`Sheet` not exported).

- [ ] **Step 3: Implement** — `src/components/ui/sheet/Sheet.tsx`

```tsx
import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { XIcon } from 'lucide-react';

// Below md the sheet is a bottom sheet; from md up it is a full-height side panel.
const sheetContentVariants = cva(
  [
    'bg-surface-raised text-fg shadow-overlay border-border fixed z-50 flex flex-col outline-none',
    'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg border-t',
    'md:inset-y-0 md:max-h-none md:w-full md:rounded-none md:border-t-0',
    'data-[state=open]:animate-in data-[state=closed]:animate-out duration-slow motion-reduce:animate-none',
    'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
  ],
  {
    variants: {
      side: {
        end: 'md:start-auto md:end-0 md:border-s md:data-[state=open]:slide-in-from-end md:data-[state=closed]:slide-out-to-end',
        start: 'md:start-0 md:end-auto md:border-e md:data-[state=open]:slide-in-from-start md:data-[state=closed]:slide-out-to-start',
      },
      size: {
        sm: 'md:max-w-sm',
        md: 'md:max-w-lg',
        lg: 'md:max-w-3xl',
      },
    },
    defaultVariants: { side: 'end', size: 'md' },
  },
);

type SheetProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
type SheetTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
type SheetCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
type SheetSectionProps = ComponentPropsWithoutRef<'div'>;

export type SheetContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> &
  VariantProps<typeof sheetContentVariants> & {
    title: ReactNode;
    hideTitle?: boolean;
    description?: ReactNode;
    /** When false: no close button, Escape and outside interaction are ignored. */
    dismissible?: boolean;
  };

type SheetComponent = FC<SheetProps> & {
  Trigger: FC<SheetTriggerProps>;
  Content: FC<SheetContentProps>;
  Body: FC<SheetSectionProps>;
  Footer: FC<SheetSectionProps>;
  Close: FC<SheetCloseProps>;
};

type EscapeKeyDownEvent = Parameters<NonNullable<SheetContentProps['onEscapeKeyDown']>>[0];
type InteractOutsideEvent = Parameters<NonNullable<SheetContentProps['onInteractOutside']>>[0];

const SheetContent: FC<SheetContentProps> = ({
  ref,
  className,
  side,
  size,
  title,
  hideTitle = false,
  description,
  dismissible = true,
  onEscapeKeyDown,
  onInteractOutside,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  const describedBy = description ? {} : { 'aria-describedby': undefined };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="sheet-overlay"
        className="bg-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-slow fixed inset-0 z-50"
      />

      <DialogPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        data-side={side ?? 'end'}
        className={cn(sheetContentVariants({ side, size }), className)}
        onEscapeKeyDown={(event: EscapeKeyDownEvent) => {
          if (!dismissible) event.preventDefault();
          onEscapeKeyDown?.(event);
        }}
        onInteractOutside={(event: InteractOutsideEvent) => {
          if (!dismissible) event.preventDefault();
          onInteractOutside?.(event);
        }}
        {...describedBy}
        {...props}
      >
        <header data-slot="sheet-header" className={cn('border-border-subtle flex flex-col gap-1 border-b px-5 py-4 pe-12', hideTitle && !description && 'sr-only')}>
          <DialogPrimitive.Title data-slot="sheet-title" className={cn('text-fg text-md font-semibold', hideTitle && 'sr-only')}>
            {title}
          </DialogPrimitive.Title>

          <Conditional.If condition={!!description}>
            <DialogPrimitive.Description data-slot="sheet-description" className="text-fg-muted text-sm">
              {description}
            </DialogPrimitive.Description>
          </Conditional.If>
        </header>

        {children}

        <Conditional.If condition={dismissible}>
          <DialogPrimitive.Close asChild>
            <IconButton size="sm" tooltip={false} aria-label={t('close')} className="absolute end-3 top-3">
              <XIcon />
            </IconButton>
          </DialogPrimitive.Close>
        </Conditional.If>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

const SheetBody: FC<SheetSectionProps> = ({ className, ...props }) => (
  <div data-slot="sheet-body" className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
);

const SheetFooter: FC<SheetSectionProps> = ({ className, ...props }) => (
  <div data-slot="sheet-footer" className={cn('border-border-subtle flex justify-end gap-2 border-t px-5 py-3', className)} {...props} />
);

const Sheet = DialogPrimitive.Root as unknown as SheetComponent;

// React 18 bridge — remove forwardRef wrappers when upgrading to React 19
Sheet.Trigger = forwardRef<HTMLButtonElement, SheetTriggerProps>((props, ref) => <DialogPrimitive.Trigger ref={ref} data-slot="sheet-trigger" {...props} />);
Sheet.Content = forwardRef<HTMLDivElement, SheetContentProps>((props, ref) => SheetContent({ ...props, ref }));
Sheet.Close = forwardRef<HTMLButtonElement, SheetCloseProps>((props, ref) => <DialogPrimitive.Close ref={ref} data-slot="sheet-close" {...props} />);
Sheet.Body = SheetBody;
Sheet.Footer = SheetFooter;

Sheet.Trigger.displayName = 'SheetTrigger';
Sheet.Content.displayName = 'SheetContent';
Sheet.Close.displayName = 'SheetClose';

export default Sheet;
```

`src/components/ui/sheet/index.ts`: `export { default as Sheet, type SheetContentProps } from './Sheet';` — add `export * from './sheet';` to `src/components/ui/index.ts` after `./dialog`.

Note: the spec lists `lg` as 720px; the kit has no 720px width token and arbitrary px widths are forbidden, so `lg` uses `max-w-3xl` (768px). Ledger this as a ruling.

- [ ] **Step 4: Run it** — `P exec vp test --run src/components/ui/sheet` → Expected: PASS (3 tests).

- [ ] **Step 5: Docs page** — `src/component-docs/ui/Sheet.mdx`:

````mdx
---
id: sheet
title: Sheet
section: Components
category: UI
description: 'Side panel for forms and details: slides in from the end on desktop, a bottom sheet on phones.'
tags: [ui, sheet, drawer, panel, overlay]
---

import { Button, Input, Sheet } from '@components/ui';

## Side panel

`Sheet.Body` scrolls; the header and `Sheet.Footer` stay put.

<Example title="Booking form">
  <Sheet>
    <Sheet.Trigger asChild>
      <Button>New appointment</Button>
    </Sheet.Trigger>
    <Sheet.Content title="New appointment" description="Fri 16 Oct · 10:30">
      <Sheet.Body className="grid gap-3">
        <Input aria-label="Patient" placeholder="Patient" />
        <Input aria-label="Reason" placeholder="Reason for visit" />
      </Sheet.Body>
      <Sheet.Footer>
        <Sheet.Close asChild>
          <Button variant="outline">Cancel</Button>
        </Sheet.Close>
        <Button>Book</Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet>
</Example>

## Side and size

<Example title="Start side, large">
  <Sheet>
    <Sheet.Trigger asChild>
      <Button variant="outline">Filters</Button>
    </Sheet.Trigger>
    <Sheet.Content title="Filters" side="start" size="lg">
      <Sheet.Body>
        <p className="text-fg-muted text-sm">Large panels suit detail views and long forms.</p>
      </Sheet.Body>
    </Sheet.Content>
  </Sheet>
</Example>

Below the `md` breakpoint every sheet becomes a bottom sheet. Use [Dialog](/docs/components/dialog) for short, focused decisions.

## API

<PropsTable
  rows={[
    { prop: 'Content · title', type: 'ReactNode', required: true, description: 'Names the sheet for assistive tech.' },
    { prop: 'Content · description · hideTitle', type: 'ReactNode · boolean', description: 'As on Dialog.' },
    { prop: 'Content · side', type: "'end' | 'start'", default: "'end'", description: 'Logical side, so it mirrors in Arabic.' },
    { prop: 'Content · size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '384px · 512px · 768px wide from md up.' },
    { prop: 'Content · dismissible', type: 'boolean', default: 'true', description: 'false removes the close button and ignores Escape and outside clicks.' },
    { prop: 'open · onOpenChange', type: 'boolean · (open) => void', description: 'On Sheet, to control it from state.' },
  ]}
/>

`Sheet.Body` is the scrolling region; `Sheet.Footer` holds end-aligned actions.

## Accessibility

- A modal dialog (Radix): `role="dialog"`, `aria-modal`, named by the title; focus is trapped and returns to the trigger.
- Escape and the scrim close a dismissible sheet.

## RTL notes

- `side="end"` opens from the left in Arabic and `side="start"` from the right; the close button sits at the inline end.
````

- [ ] **Step 6: Verify and commit**

Run: `P docs:lint && P exec vp test --run src/components/ui/sheet src/component-docs && P exec tsc -b` → Expected: PASS.

```bash
git add src/components/ui/sheet src/components/ui/index.ts src/component-docs/ui/Sheet.mdx
git commit -m "feat(ui): Sheet — side panel on Radix Dialog, logical sides, bottom sheet on phones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: StatCard

**Files:**
- Create: `src/components/shared/stat-card/StatCard.tsx`, `index.ts`, `StatCard.test.tsx`; modify `src/components/shared/index.ts`
- Modify: `src/locales/en/common.json`, `src/locales/ar/common.json`
- Create: `src/component-docs/shared/StatCard.mdx`

**Interfaces:**
- Consumes: `Money` (Task 1) in docs only; `formatNumber` from `@utils`.
- Produces: `StatCard` with `{ label: ReactNode; value: ReactNode; trend?: StatCardTrend; caption?: string; sparkline?: ReactNode; icon?: ReactNode; loading?: boolean; href?: string; className?: string }`; `type StatCardTrend = { value: number; direction?: 'up' | 'down'; positive?: 'up' | 'down' }`. Plan B fills `sparkline`.

- [ ] **Step 1: Locale keys** — add to `src/locales/en/common.json` (top level):

```json
  "statCard": {
    "up": "Up",
    "down": "Down",
    "flat": "No change",
    "trend": "{{direction}} {{value}}",
    "trendWithCaption": "{{direction}} {{value}} {{caption}}"
  },
```

and to `src/locales/ar/common.json`:

```json
  "statCard": {
    "up": "ارتفاع",
    "down": "انخفاض",
    "flat": "دون تغيير",
    "trend": "{{direction}} {{value}}",
    "trendWithCaption": "{{direction}} {{value}} {{caption}}"
  },
```

- [ ] **Step 2: Write the failing test** — `src/components/shared/stat-card/StatCard.test.tsx`

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { StatCard } from '@components/shared';

import '../../../i18n';

afterEach(cleanup);

describe('StatCard', () => {
  it('shows the value and a signed trend whose label reads out direction and caption', () => {
    render(<StatCard label="Visits" value="248" trend={{ value: 12.4 }} caption="vs last week" />);
    expect(screen.getByText('248').closest('[dir="ltr"]')).not.toBeNull();
    const trend = screen.getByLabelText('Up 12.4% vs last week');
    expect(trend.className).toContain('text-success');
  });

  it('uses danger when the movement is against the positive direction', () => {
    render(<StatCard label="No-shows" value="3" trend={{ value: 8, positive: 'down' }} />);
    expect(screen.getByLabelText('Up 8%').className).toContain('text-danger');
  });

  it('reads a zero trend as "No change" in a neutral tone', () => {
    render(<StatCard label="Wait" value="14 min" trend={{ value: 0 }} />);
    const trend = screen.getByLabelText('No change 0%');
    expect(trend.className).toContain('text-fg-muted');
    expect(trend.className).not.toMatch(/text-(success|danger)/);
  });

  it('shows a skeleton while loading and becomes a link with href', () => {
    const { rerender } = render(<StatCard label="Visits" value="248" loading />);
    expect(screen.queryByText('248')).toBeNull();
    expect(document.querySelector('[data-slot="stat-card"] [aria-hidden="true"]')).not.toBeNull();

    rerender(
      <MemoryRouter>
        <StatCard label="Visits" value="248" href="/visits" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Visits/ }).getAttribute('href')).toBe('/visits');
  });
});
```

- [ ] **Step 3: Run it** — `P exec vp test --run src/components/shared/stat-card` → Expected: FAIL (`StatCard` not exported).

- [ ] **Step 4: Implement** — `src/components/shared/stat-card/StatCard.tsx`

```tsx
import { type FC, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn, formatNumber } from '@utils';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export type StatCardTrend = {
  /** Percentage change, e.g. 12.4 or -3. */
  value: number;
  /** Override the direction derived from the sign. */
  direction?: 'up' | 'down';
  /** Which direction is good news. @default 'up' */
  positive?: 'up' | 'down';
};

export type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  trend?: StatCardTrend;
  /** e.g. "vs last week"; joins the trend's accessible label. */
  caption?: string;
  sparkline?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  /** Makes the whole card a link. */
  href?: string;
  className?: string;
};

const CARD = 'bg-surface border-border text-fg relative flex flex-col gap-2 rounded-lg border p-4';

const StatCard: FC<StatCardProps> = ({ label, value, trend, caption, sparkline, icon, loading = false, href, className }) => {
  const { t, i18n } = useAppTranslation('common');

  const direction = trend ? (trend.direction ?? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat')) : 'flat';
  const good = direction !== 'flat' && direction === (trend?.positive ?? 'up');
  const percent = trend ? formatNumber(Math.abs(trend.value) / 100, i18n.language, { style: 'percent', maximumFractionDigits: 1 }) : '';
  const trendLabel = trend
    ? t(caption ? 'statCard.trendWithCaption' : 'statCard.trend', { direction: t(`statCard.${direction}`), value: percent, caption })
    : '';
  const TrendIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-fg-muted text-sm">{label}</span>
        <Conditional.If condition={!!icon}>
          <span aria-hidden="true" className="text-fg-subtle [&_svg]:size-4">
            {icon}
          </span>
        </Conditional.If>
      </div>

      <Conditional>
        <Conditional.If condition={loading}>
          <Skeleton size="lg" className="w-24" />
        </Conditional.If>
        <Conditional.Else>
          <span dir="ltr" className="text-fg text-start font-mono text-2xl font-medium tabular-nums rtl:text-end">
            {value}
          </span>
        </Conditional.Else>
      </Conditional>

      <div className="flex items-end justify-between gap-3">
        <Conditional.If condition={!!trend && !loading}>
          <span
            aria-label={trendLabel}
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              direction === 'flat' ? 'text-fg-muted' : good ? 'text-success' : 'text-danger',
            )}
          >
            <TrendIcon aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
            <span aria-hidden="true" dir="ltr" className="tabular-nums">
              {percent}
            </span>
            <Conditional.If condition={!!caption}>
              <span aria-hidden="true" className="text-fg-muted font-normal">
                {caption}
              </span>
            </Conditional.If>
          </span>
        </Conditional.If>

        <Conditional.If condition={!!sparkline && !loading}>
          <span className="ms-auto w-24">{sparkline}</span>
        </Conditional.If>
      </div>
    </>
  );

  return (
    <Conditional>
      <Conditional.If condition={!!href}>
        <Link to={href ?? ''} data-slot="stat-card" className={cn(CARD, 'hover:border-border-strong focus-ring transition-colors', className)}>
          {body}
        </Link>
      </Conditional.If>
      <Conditional.Else>
        <article data-slot="stat-card" aria-busy={loading || undefined} className={cn(CARD, className)}>
          {body}
        </article>
      </Conditional.Else>
    </Conditional>
  );
};

export default StatCard;
```

Check that `useAppTranslation` returns `i18n`; if it doesn't, take the language from `useTranslation()` (react-i18next) instead. Index: `export { default as StatCard, type StatCardProps, type StatCardTrend } from './StatCard';`. Add `export * from './stat-card';` to `src/components/shared/index.ts`.

- [ ] **Step 5: Run it** — `P exec vp test --run src/components/shared/stat-card tests/i18n` → Expected: PASS (4 tests + locale parity).

- [ ] **Step 6: Docs page** — `src/component-docs/shared/StatCard.mdx`:

````mdx
---
id: stat-card
title: StatCard
section: Components
category: Shared
description: 'A KPI tile: label, value, a trend whose colour knows whether up is good, and an optional sparkline.'
tags: [shared, kpi, stat, dashboard, metric]
---

import { CardGrid, StatCard } from '@components/shared';
import { Money } from '@components/ui';
import { CalendarCheck, Clock, UserX, Wallet } from 'lucide-react';

## Dashboard row

<Example title="Four KPIs">
  <CardGrid className="w-full">
    <StatCard label="Visits today" value="48" icon={<CalendarCheck />} trend={{ value: 12.4 }} caption="vs last week" />
    <StatCard label="Collected" value={<Money value={2940} />} icon={<Wallet />} trend={{ value: -3.1 }} caption="vs last week" />
    <StatCard label="No-shows" value="3" icon={<UserX />} trend={{ value: 8, positive: 'down' }} caption="vs last week" />
    <StatCard label="Average wait" value="14 min" icon={<Clock />} trend={{ value: 0 }} />
  </CardGrid>
</Example>

`positive="down"` flips the colours for metrics where less is better (no-shows, wait time).

## Loading

<Example title="Skeleton">
  <div className="w-64">
    <StatCard label="Visits today" value="48" loading />
  </div>
</Example>

## API

<PropsTable
  rows={[
    { prop: 'label · value', type: 'ReactNode', required: true, description: 'value is mono and LTR-isolated; pass Money for amounts.' },
    { prop: 'trend', type: '{ value: number; direction?; positive?: "up" | "down" }', description: 'Percent change; tone is success when it moves the positive way.' },
    { prop: 'caption', type: 'string', description: 'e.g. "vs last week"; part of the trend label.' },
    { prop: 'sparkline · icon', type: 'ReactNode', description: 'A Sparkline chart and a decorative icon.' },
    { prop: 'loading', type: 'boolean', default: 'false', description: 'Skeleton value, aria-busy.' },
    { prop: 'href', type: 'string', description: 'Makes the whole card a router link.' },
  ]}
/>

## Accessibility

- The trend has an `aria-label` such as "Up 12.4% vs last week"; its arrow and colour are decorative, so the meaning never relies on colour.
- With `href`, the card is one link named by its contents.

## RTL notes

- The value and percentage are LTR-isolated; the trend arrow mirrors in Arabic.
````

- [ ] **Step 7: Verify and commit**

Run: `P docs:lint && P exec vp test --run src/components/shared/stat-card src/component-docs tests/i18n && P exec tsc -b` → Expected: PASS.

```bash
git add src/components/shared/stat-card src/components/shared/index.ts src/locales src/component-docs/shared/StatCard.mdx
git commit -m "feat(shared): StatCard — KPI tile with direction-aware trend, sparkline slot, loading and link

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Timeline

**Files:**
- Create: `src/components/shared/timeline/Timeline.tsx`, `useGroupedByDay.ts`, `index.ts`, `Timeline.test.tsx`; modify `src/components/shared/index.ts`
- Modify: `src/locales/{en,ar}/common.json`
- Create: `src/component-docs/shared/Timeline.mdx`

**Interfaces:**
- Produces: `Timeline` (`ol`; `loading?`, `empty?: ReactNode`, `hasMore?`, `onLoadMore?`, `loadingMore?`), `Timeline.Group` (`label: ReactNode`), `Timeline.Item` (`title: ReactNode; time?: DateInput; meta?: ReactNode; icon?: ReactNode; avatar?: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'`), `useGroupedByDay<T>(items: T[], getTime: (item: T) => DateInput): { key: string; label: string; items: T[] }[]`.

- [ ] **Step 1: Locale keys** — en `common.json`:

```json
  "timeline": {
    "today": "Today",
    "yesterday": "Yesterday",
    "loadMore": "Load more",
    "empty": "No activity yet"
  },
```

ar:

```json
  "timeline": {
    "today": "اليوم",
    "yesterday": "أمس",
    "loadMore": "عرض المزيد",
    "empty": "لا يوجد نشاط بعد"
  },
```

- [ ] **Step 2: Write the failing test** — `src/components/shared/timeline/Timeline.test.tsx`

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { Timeline, useGroupedByDay } from '@components/shared';

import '../../../i18n';

afterEach(cleanup);

const wrap = (ui: React.ReactNode) => render(<Tooltip.Provider>{ui}</Tooltip.Provider>);

describe('Timeline', () => {
  it('renders an ordered list of items with a machine-readable time', () => {
    wrap(
      <Timeline>
        <Timeline.Item title="Visit completed" meta="Dr. Haddad" time="2026-10-16T10:30:00" />
        <Timeline.Item title="Invoice paid" time="2026-10-15T09:00:00" tone="success" />
      </Timeline>,
    );
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(document.querySelector('time')?.getAttribute('dateTime')).toContain('2026-10-16');
  });

  it('renders items without a time (or with an invalid one) and no <time>', () => {
    wrap(
      <Timeline>
        <Timeline.Item title="Note added" />
        <Timeline.Item title="Imported" time="not a date" />
      </Timeline>,
    );
    expect(screen.getByText('Note added')).toBeTruthy();
    expect(screen.getByText('Imported')).toBeTruthy();
    expect(document.querySelector('time')).toBeNull();
  });

  it('shows the empty state, and a Load more button that calls back', () => {
    const onLoadMore = vi.fn();
    const { rerender } = wrap(<Timeline />);
    expect(screen.getByText('No activity yet')).toBeTruthy();

    rerender(
      <Tooltip.Provider>
        <Timeline hasMore onLoadMore={onLoadMore}>
          <Timeline.Item title="Visit completed" />
        </Timeline>
      </Tooltip.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('groups items by local day, newest first, labelling today and yesterday', () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 60_000);
    const yesterday = new Date(now.getTime() - 24 * 3_600_000);
    const items = [{ at: yesterday }, { at: now }, { at: earlier }];

    const { result } = renderHook(() => useGroupedByDay(items, (item) => item.at));
    expect(result.current.map((group) => group.label)).toEqual(['Today', 'Yesterday']);
    expect(result.current[0].items).toEqual([items[1], items[2]]);
  });
});
```

- [ ] **Step 3: Run it** — `P exec vp test --run src/components/shared/timeline` → Expected: FAIL (`Timeline` not exported).

- [ ] **Step 4: Implement**

`src/components/shared/timeline/useGroupedByDay.ts`:

```ts
import { useMemo } from 'react';

import { type DateInput, useAppTranslation, useDate } from '@hooks/shared';

export type TimelineGroup<T> = { key: string; label: string; items: T[] };

/** Groups items by local calendar day, newest day first; items keep their order inside a day. */
export function useGroupedByDay<T>(items: T[], getTime: (item: T) => DateInput): TimelineGroup<T>[] {
  const { t } = useAppTranslation('common');
  const { toDate, subtractDuration, isValid, formatDate, constants } = useDate();

  return useMemo(() => {
    const today = toDate(new Date(), constants.DateFormats.ISO_DATE);
    const yesterday = toDate(subtractDuration(new Date(), 1, constants.UnitOfTime.DAY), constants.DateFormats.ISO_DATE);
    const groups = new Map<string, T[]>();

    for (const item of items) {
      const time = getTime(item);
      const key = isValid(time) ? toDate(time, constants.DateFormats.ISO_DATE) : '';
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, groupItems]) => ({
        key,
        label: key === today ? t('timeline.today') : key === yesterday ? t('timeline.yesterday') : key ? formatDate(key, constants.DateFormats.SHORT_MONTH_DAY_YEAR) : '—',
        items: groupItems,
      }));
  }, [items, getTime, t, toDate, subtractDuration, isValid, formatDate, constants]);
}
```

Check `constants.UnitOfTime.DAY` exists in `useDate().constants` (it exports `UnitOfTime`); if the hook functions aren't referentially stable, drop them from the dependency list and keep `[items, getTime, t]`.

`src/components/shared/timeline/Timeline.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Button, Skeleton, Tooltip } from '@components/ui';
import { EmptyState } from '@components/ui';
import { Conditional } from '@components/utils';

import { type DateInput, useAppTranslation, useDate } from '@hooks/shared';

import { cn } from '@utils';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const DOT: Record<Tone, string> = {
  neutral: 'bg-fg-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export type TimelineProps = ComponentPropsWithoutRef<'ol'> & {
  loading?: boolean;
  empty?: ReactNode;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export type TimelineItemProps = Omit<ComponentPropsWithoutRef<'li'>, 'title'> & {
  title: ReactNode;
  time?: DateInput;
  meta?: ReactNode;
  icon?: ReactNode;
  avatar?: ReactNode;
  tone?: Tone;
};

type TimelineGroupProps = ComponentPropsWithoutRef<'li'> & { label: ReactNode };

type TimelineComponent = FC<TimelineProps> & { Item: FC<TimelineItemProps>; Group: FC<TimelineGroupProps> };

const Item: FC<TimelineItemProps> = ({ title, time, meta, icon, avatar, tone = 'neutral', className, children, ...props }) => {
  const { getTimeAgo, isValid, toDate, formatDate, constants } = useDate();
  const hasTime = time !== undefined && isValid(time);

  return (
    <li
      data-slot="timeline-item"
      className={cn(
        'relative flex gap-3 pb-5 last:pb-0',
        'before:bg-border-subtle before:absolute before:start-3 before:top-7 before:-bottom-0 before:w-px last:before:hidden',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="bg-surface border-border relative z-10 grid size-6 shrink-0 place-items-center rounded-full border [&_svg]:size-3.5">
        <Conditional>
          <Conditional.If condition={!!avatar}>{avatar}</Conditional.If>
          <Conditional.If condition={!!icon}>
            <span className="text-fg-muted">{icon}</span>
          </Conditional.If>
          <Conditional.Else>
            <span className={cn('size-2 rounded-full', DOT[tone])} />
          </Conditional.Else>
        </Conditional>
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-fg text-sm font-medium">{title}</span>
          <Conditional.If condition={!!meta}>
            <span className="text-fg-muted text-xs">{meta}</span>
          </Conditional.If>
          <Conditional.If condition={hasTime}>
            <Tooltip content={hasTime ? formatDate(time, constants.DateFormats.SHORT_MONTH_DAY_YEAR_TIME) : ''}>
              <time tabIndex={0} dateTime={hasTime ? toDate(time, constants.DateFormats.ISO_DATETIME) : undefined} className="text-fg-subtle focus-ring ms-auto rounded-sm text-xs">
                {hasTime ? getTimeAgo(time) : ''}
              </time>
            </Tooltip>
          </Conditional.If>
        </div>
        <Conditional.If condition={!!children}>
          <div className="text-fg-muted text-sm">{children}</div>
        </Conditional.If>
      </div>
    </li>
  );
};

const Group: FC<TimelineGroupProps> = ({ label, className, children, ...props }) => (
  <li data-slot="timeline-group" className={cn('flex flex-col gap-3 pb-6 last:pb-0', className)} {...props}>
    <h3 className="text-fg-muted text-xs font-medium tracking-wider uppercase rtl:tracking-normal">{label}</h3>
    <ol className="flex flex-col">{children}</ol>
  </li>
);

const Timeline: TimelineComponent = ({ loading = false, empty, hasMore = false, onLoadMore, loadingMore = false, className, children, ...props }) => {
  const { t } = useAppTranslation('common');
  const isEmpty = !loading && !children;

  return (
    <div data-slot="timeline" className={cn('flex flex-col gap-4', className)}>
      <Conditional>
        <Conditional.If condition={loading}>
          <div aria-busy="true" className="flex flex-col gap-4">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <Skeleton shape="circle" size="sm" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="w-1/2" />
                  <Skeleton size="sm" className="w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </Conditional.If>
        <Conditional.If condition={isEmpty}>{empty ?? <EmptyState size="sm" kind="first-use" title={t('timeline.empty')} />}</Conditional.If>
        <Conditional.Else>
          <ol className="flex flex-col" {...props}>
            {children}
          </ol>
        </Conditional.Else>
      </Conditional>

      <Conditional.If condition={hasMore && !loading}>
        <Button variant="outline" size="sm" className="self-center" loading={loadingMore} onClick={onLoadMore}>
          {t('timeline.loadMore')}
        </Button>
      </Conditional.If>
    </div>
  );
};

Timeline.Item = Item;
Timeline.Group = Group;

export default Timeline;
```

Note `EmptyState` comes from `@components/ui` (the shared barrel re-exports it). The `title` prop of `EmptyState` exists (`kind`, `title`, `size`).

`src/components/shared/timeline/index.ts`:

```ts
export { default as Timeline, type TimelineProps, type TimelineItemProps } from './Timeline';
export { useGroupedByDay, type TimelineGroup } from './useGroupedByDay';
```

Add `export * from './timeline';` to `src/components/shared/index.ts`.

- [ ] **Step 5: Run it** — `P exec vp test --run src/components/shared/timeline tests/i18n` → Expected: PASS (4 tests + parity).

- [ ] **Step 6: Docs page** — `src/component-docs/shared/Timeline.mdx`:

````mdx
---
id: timeline
title: Timeline
section: Components
category: Shared
description: 'Activity feed on a hairline rail: icon or avatar markers, actor, relative time with the full date on hover, grouped by day.'
tags: [shared, timeline, activity, feed, history]
---

import { Timeline, useGroupedByDay } from '@components/shared';
import { Avatar } from '@components/ui';
import { CalendarCheck, FileText, Receipt } from 'lucide-react';

export const NOW = Date.now();
export const EVENTS = [
  { id: 1, title: 'Visit completed', meta: 'Dr. Lina Khoury', at: new Date(NOW - 20 * 60_000), icon: CalendarCheck },
  { id: 2, title: 'Invoice INV-2026-0142 paid', meta: 'Card', at: new Date(NOW - 3 * 3_600_000), icon: Receipt },
  { id: 3, title: 'Lab results uploaded', meta: 'Sara Haddad', at: new Date(NOW - 27 * 3_600_000), icon: FileText },
];

export const GroupedFeed = () => {
  const groups = useGroupedByDay(EVENTS, (event) => event.at);
  return (
    <Timeline className="w-full max-w-md">
      {groups.map((group) => (
        <Timeline.Group key={group.key} label={group.label}>
          {group.items.map((event) => {
            const Icon = event.icon;
            return <Timeline.Item key={event.id} title={event.title} meta={event.meta} time={event.at} icon={<Icon />} />;
          })}
        </Timeline.Group>
      ))}
    </Timeline>
  );
};

## Feed

<Example title="Items with tones and avatars">
  <Timeline className="w-full max-w-md">
    <Timeline.Item title="Appointment booked" meta="Reception" time={new Date(NOW - 5 * 60_000)} tone="accent" />
    <Timeline.Item
      title="Note added"
      meta="Dr. Omar Nasser"
      time={new Date(NOW - 2 * 3_600_000)}
      avatar={
        <Avatar size="sm">
          <Avatar.Fallback>ON</Avatar.Fallback>
        </Avatar>
      }
    >
      Patient reports improved sleep since the dose change.
    </Timeline.Item>
    <Timeline.Item title="Payment failed" meta="Card declined" time={new Date(NOW - 26 * 3_600_000)} tone="danger" />
  </Timeline>
</Example>

## Grouped by day

`useGroupedByDay(items, getTime)` returns `{ key, label, items }` groups, newest first, labelled Today, Yesterday or the date.

<Example title="Today and yesterday" code={`const groups = useGroupedByDay(events, (event) => event.at);

<Timeline>
  {groups.map((group) => (
    <Timeline.Group key={group.key} label={group.label}>
      {group.items.map((event) => (
        <Timeline.Item key={event.id} title={event.title} meta={event.meta} time={event.at} icon={<event.icon />} />
      ))}
    </Timeline.Group>
  ))}
</Timeline>`}>
  <GroupedFeed />
</Example>

## States

<Example title="Loading and empty">
  <div className="grid w-full max-w-md gap-6">
    <Timeline loading />
    <Timeline />
  </div>
</Example>

## API

<PropsTable
  rows={[
    { prop: 'loading · empty', type: 'boolean · ReactNode', description: 'Skeleton rows, or the content shown when there are no items.' },
    { prop: 'hasMore · onLoadMore · loadingMore', type: 'boolean · () => void · boolean', description: 'A Load more button under the feed.' },
    { prop: 'Item · title · meta', type: 'ReactNode', description: 'What happened, and who or how.' },
    { prop: 'Item · time', type: 'DateInput', description: 'Relative time, full date in a tooltip; omitted when missing or invalid.' },
    { prop: 'Item · icon · avatar · tone', type: "ReactNode · ReactNode · 'neutral' | 'accent' | …", description: 'Marker on the rail: an icon, an avatar, or a tone dot.' },
    { prop: 'Group · label', type: 'ReactNode', required: true, description: 'Day heading for a group of items.' },
  ]}
/>

## Accessibility

- An ordered list; each time is a focusable `<time dateTime>` whose tooltip gives the full date on hover and focus.
- Markers are decorative; titles carry the meaning.

## RTL notes

- The rail and markers sit at the start (right in Arabic); relative times use Western digits.
````

- [ ] **Step 7: Verify and commit**

Run: `P docs:lint && P exec vp test --run src/components/shared/timeline src/component-docs tests/i18n && P exec tsc -b` → Expected: PASS.

```bash
git add src/components/shared/timeline src/components/shared/index.ts src/locales src/component-docs/shared/Timeline.mdx
git commit -m "feat(shared): Timeline — activity feed with markers, relative times, day groups, load more

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: DataTable bulk selection

**Files:**
- Create: `src/components/tables/data-table/data-table-selection/createSelectionColumn.tsx`, `DataTableBulkActions.tsx`, `index.ts`, `selection.test.tsx`
- Modify: `src/components/tables/data-table/index.ts`, `DataTable.tsx`, `data-table-toolbar/DataTableToolbar.tsx`, `data-table-content/DataTableContent.tsx`
- Modify: `src/locales/{en,ar}/common.json` (`table.*`)
- Modify: `src/component-docs/tables/DataTable.mdx`

**Interfaces:**
- Consumes: `useDataTableContext()` (exists), `Checkbox` (`checked: boolean | 'indeterminate'`).
- Produces: `createSelectionColumn<TData>(options?: { getRowLabel?: (row: TData) => string }): ColumnDef<TData>`; `DataTable.BulkActions` with `children?: (rows: Row<TData>[]) => ReactNode`; context field `bulkActionsMounted: boolean` + `setBulkActionsMounted(value: boolean)`.

- [ ] **Step 1: Locale keys** — inside `"table"` in en `common.json`:

```json
    "selectPage": "Select all rows on this page",
    "selectRow": "Select row",
    "selectRowNamed": "Select {{name}}",
    "selected_one": "{{count}} selected",
    "selected_other": "{{count}} selected",
    "selectAllResults_one": "Select {{count}} result",
    "selectAllResults_other": "Select all {{count}} results",
    "clearSelection": "Clear selection",
    "bulkActions": "Actions for selected rows"
```

ar (Arabic needs all six plural forms, like `total_*`):

```json
    "selectPage": "تحديد كل صفوف هذه الصفحة",
    "selectRow": "تحديد الصف",
    "selectRowNamed": "تحديد {{name}}",
    "selected_zero": "لم يُحدَّد شيء",
    "selected_one": "تم تحديد عنصر واحد",
    "selected_two": "تم تحديد عنصرين",
    "selected_few": "تم تحديد {{count}} عناصر",
    "selected_many": "تم تحديد {{count}} عنصرًا",
    "selected_other": "تم تحديد {{count}} عنصر",
    "selectAllResults_zero": "لا توجد نتائج",
    "selectAllResults_one": "تحديد النتيجة",
    "selectAllResults_two": "تحديد النتيجتين",
    "selectAllResults_few": "تحديد كل النتائج ({{count}})",
    "selectAllResults_many": "تحديد كل النتائج ({{count}})",
    "selectAllResults_other": "تحديد كل النتائج ({{count}})",
    "clearSelection": "إلغاء التحديد",
    "bulkActions": "إجراءات الصفوف المحددة"
```

If `tests/i18n/parity.test.ts` rejects plural forms present only in Arabic, follow how it treats `total_zero`/`total_two` (they already exist only in ar).

- [ ] **Step 2: Write the failing test** — `src/components/tables/data-table/data-table-selection/selection.test.tsx`

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button } from '@components/ui';
import { createSelectionColumn, DataTable } from '@components/tables';

import '../../../../i18n';

type Invoice = { id: string; patient: string };

const rows: Invoice[] = Array.from({ length: 5 }, (_, index) => ({ id: `INV-${index + 1}`, patient: `Patient ${index + 1}` }));

const columns: ColumnDef<Invoice>[] = [createSelectionColumn<Invoice>({ getRowLabel: (row) => row.id }), { accessorKey: 'patient', header: 'Patient' }];

function Harness({ manualPagination = false }: { manualPagination?: boolean }) {
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
    pageCount: manualPagination ? 3 : undefined,
    initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
  });

  return (
    <DataTable table={table}>
      <DataTable.Toolbar totalCount={rows.length} />
      <DataTable.BulkActions>{(selected) => <Button size="sm">Export {selected.length}</Button>}</DataTable.BulkActions>
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable>
  );
}

afterEach(cleanup);

describe('DataTable selection', () => {
  it('labels row checkboxes and swaps the toolbar for the bulk bar while rows are selected', () => {
    render(<Harness />);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')).not.toBeNull();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));

    const bar = screen.getByRole('toolbar', { name: 'Actions for selected rows' });
    expect(bar.textContent).toContain('1 selected');
    expect(screen.getByRole('button', { name: 'Export 1' })).toBeTruthy();
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('1 selected');
  });

  it('header checkbox selects the page (indeterminate when partial), then offers all filtered results', () => {
    render(<Harness />);
    const header = screen.getByRole('checkbox', { name: 'Select all rows on this page' });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));
    expect(header.getAttribute('aria-checked')).toBe('mixed');

    fireEvent.click(header);
    expect(screen.getByRole('toolbar').textContent).toContain('2 selected');

    fireEvent.click(screen.getByRole('button', { name: 'Select all 5 results' }));
    expect(screen.getByRole('toolbar').textContent).toContain('5 selected');
  });

  it('does not offer "select all results" when pagination is server-side', () => {
    render(<Harness manualPagination />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(screen.queryByRole('button', { name: /Select all .* results/ })).toBeNull();
  });

  it('clears with the Clear button and with Escape inside the table', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('toolbar')).toBeNull();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-2' }));
    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select INV-2' }), { key: 'Escape' });
    expect(screen.queryByRole('toolbar')).toBeNull();
  });
});
```

- [ ] **Step 3: Run it** — `P exec vp test --run src/components/tables/data-table/data-table-selection` → Expected: FAIL (`createSelectionColumn` not exported).

- [ ] **Step 4: Implement**

`DataTable.tsx` — add to `DataTableContextValue` and the provider:

```tsx
// type
  bulkActionsMounted: boolean;
  setBulkActionsMounted: (mounted: boolean) => void;
```

```tsx
// in DataTableRoot, before contextValue
  const [bulkActionsMounted, setBulkActionsMounted] = useState(false);
// add both fields to the memo value and its dependency list
```

Import `useState` from `react`. Register the new part: `DataTable.BulkActions = DataTableBulkActions;` and add `BulkActions: typeof DataTableBulkActions;` to `DataTableComponents`; import it from `./data-table-selection/DataTableBulkActions`.

`data-table-selection/createSelectionColumn.tsx`:

```tsx
import type { ColumnDef, Row, Table } from '@tanstack/react-table';

import { Checkbox } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

function SelectPageCheckbox<TData>({ table }: { table: Table<TData> }) {
  const { t } = useAppTranslation('common');
  const checked = table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false;

  return <Checkbox aria-label={t('table.selectPage')} checked={checked} onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)} />;
}

function SelectRowCheckbox<TData>({ row, label }: { row: Row<TData>; label?: string }) {
  const { t } = useAppTranslation('common');

  return (
    <Checkbox
      aria-label={label ? t('table.selectRowNamed', { name: label }) : t('table.selectRow')}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(value === true)}
    />
  );
}

/** A pinned-start checkbox column. Rows are keyed by the table's `getRowId`, so selection survives paging and sorting. */
export function createSelectionColumn<TData>({ getRowLabel }: { getRowLabel?: (row: TData) => string } = {}): ColumnDef<TData> {
  return {
    id: 'select',
    size: 44,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    meta: { disableRowClick: true },
    header: ({ table }) => <SelectPageCheckbox table={table} />,
    cell: ({ row }) => <SelectRowCheckbox row={row} label={getRowLabel?.(row.original)} />,
  };
}
```

`data-table-selection/DataTableBulkActions.tsx`:

```tsx
import { type ReactNode, useEffect } from 'react';

import type { Row } from '@tanstack/react-table';

import { Button } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { useDataTableContext } from '../DataTable';

type DataTableBulkActionsProps<TData> = {
  /** Receives the selected rows; render your action buttons. */
  children?: (rows: Row<TData>[]) => ReactNode;
  className?: string;
};

/** Replaces the toolbar while rows are selected: count, "select all results", your actions, Clear. */
function DataTableBulkActions<TData>({ children, className }: DataTableBulkActionsProps<TData>) {
  const { t } = useAppTranslation('common');
  const { table, setBulkActionsMounted } = useDataTableContext<TData>();

  useEffect(() => {
    setBulkActionsMounted(true);
    return () => setBulkActionsMounted(false);
  }, [setBulkActionsMounted]);

  const selected = table.getSelectedRowModel().rows;
  const count = selected.length;
  const total = table.getFilteredRowModel().rows.length;
  const canSelectAll = !table.options.manualPagination && table.getIsAllPageRowsSelected() && !table.getIsAllRowsSelected() && total > count;

  return (
    <>
      <span aria-live="polite" className="sr-only">
        {count > 0 ? t('table.selected', { count }) : ''}
      </span>

      <Conditional.If condition={count > 0}>
        <div
          data-slot="data-table-bulk-actions"
          role="toolbar"
          aria-label={t('table.bulkActions')}
          className={cn('bg-surface border-border flex w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-2', className)}
        >
          <span className="text-fg text-sm font-medium tabular-nums">{t('table.selected', { count })}</span>

          <Conditional.If condition={canSelectAll}>
            <Button variant="link" tone="accent" size="sm" onClick={() => table.toggleAllRowsSelected(true)}>
              {t('table.selectAllResults', { count: total })}
            </Button>
          </Conditional.If>

          <div className="ms-auto flex flex-wrap items-center gap-2">
            {children?.(selected)}
            <Button variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
              {t('table.clearSelection')}
            </Button>
          </div>
        </div>
      </Conditional.If>
    </>
  );
}

export default DataTableBulkActions;
```

`data-table-selection/index.ts`:

```ts
export { createSelectionColumn } from './createSelectionColumn';
export { default as DataTableBulkActions } from './DataTableBulkActions';
```

Add `export * from './data-table-selection';` to `src/components/tables/data-table/index.ts` (check the file's existing export shape; the `tables` barrel re-exports `./data-table`). If importing `useDataTableContext` from `../DataTable` causes a cycle warning, keep it: `DataTable.tsx` imports BulkActions only for assignment, the same way it imports Toolbar.

`DataTableToolbar.tsx` — read `bulkActionsMounted` from context and hide (stay mounted, so typed search survives):

```tsx
  const { table, onResetFilters, bulkActionsMounted } = useDataTableContext();
  const hasSelection = bulkActionsMounted && table.getSelectedRowModel().rows.length > 0;
```

and on the root `div`: `hidden={hasSelection || undefined}`.

`DataTableContent.tsx` — on the root `ScrollArea` add:

```tsx
      onKeyDown={(event) => {
        if (event.key === 'Escape' && Object.keys(table.getState().rowSelection).length > 0) table.resetRowSelection();
      }}
```

- [ ] **Step 5: Run it** — `P exec vp test --run src/components/tables tests/i18n` → Expected: PASS (the 4 new tests plus the existing DataTable tests).

- [ ] **Step 6: Docs** — in `src/component-docs/tables/DataTable.mdx`:

1. Import `createSelectionColumn` with the other `@components/tables` import, and `Button` from `@components/ui` (already imports `Badge`).
2. In `InvoicesDemo`, add `createSelectionColumn({ getRowLabel: (row) => row.id })` as the first column, `getRowId: (row) => row.id` to `useReactTable`, and `<DataTable.BulkActions>{(selected) => <Button size="sm" variant="outline">Export {selected.length}</Button>}</DataTable.BulkActions>` between `Toolbar` and `Content`.
3. Add after the `## Example` section:

````mdx
## Bulk selection

Add `createSelectionColumn()` as the first column and `getRowId` on the table, then render `DataTable.BulkActions`. While rows are selected it replaces the toolbar with the count, a "Select all N results" link (client-side pagination only) and your actions, which receive the selected rows. Escape inside the table clears the selection.

```tsx
const columns = [createSelectionColumn<Invoice>({ getRowLabel: (row) => row.id }), ...rest];
const table = useReactTable({ data, columns, getRowId: (row) => row.id, ... });

<DataTable table={table}>
  <DataTable.Toolbar totalCount={total} />
  <DataTable.BulkActions>{(selected) => <Button onClick={() => exportRows(selected)}>Export</Button>}</DataTable.BulkActions>
  <DataTable.Content />
  <DataTable.Pagination />
</DataTable>
```
````

4. In the `## API` PropsTable add:

```tsx
    { prop: 'BulkActions · children', type: '(rows: Row<TData>[]) => ReactNode', description: 'Action buttons shown while rows are selected.' },
    { prop: 'createSelectionColumn · getRowLabel', type: '(row: TData) => string', description: 'Names each row checkbox ("Select INV-0142").' },
```

5. In `## Accessibility` add: `- Selection checkboxes are labelled per row; the selected count is announced in a polite live region, and Escape clears the selection.`

- [ ] **Step 7: Verify and commit**

Run: `P docs:lint && P exec vp test --run src/components/tables src/component-docs tests/i18n && P exec tsc -b` → Expected: PASS.

```bash
git add src/components/tables src/locales src/component-docs/tables/DataTable.mdx
git commit -m "feat(tables): bulk selection — selection column, BulkActions bar, select all results, Escape to clear

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: PageHeader media and meta

**Files:**
- Modify: `src/components/shared/page-header/PageHeader.tsx`
- Test: `src/components/shared/page-header/PageHeader.test.tsx` (create if absent; otherwise add the tests)
- Modify: `src/component-docs/shared/PageHeader.mdx`

**Interfaces:**
- Produces: `PageHeaderProps` gains `media?: ReactNode; meta?: ReactNode`.

- [ ] **Step 1: Write the failing test** — add to `PageHeader.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Badge } from '@components/ui';
import { PageHeader } from '@components/shared';

import '../../../i18n';

afterEach(cleanup);

describe('PageHeader media and meta', () => {
  it('renders media before the title and meta under it, keeping the h1', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Sara Haddad" media={<span data-testid="avatar" />} meta={<Badge tone="success">Active</Badge>} />
      </MemoryRouter>,
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Sara Haddad' });
    const media = screen.getByTestId('avatar');
    expect(media.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('[data-slot="page-header-meta"]')?.textContent).toBe('Active');
  });

  it('renders neither slot when not given', () => {
    render(<PageHeader title="Patients" />);
    expect(document.querySelector('[data-slot="page-header-media"]')).toBeNull();
    expect(document.querySelector('[data-slot="page-header-meta"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it** — `P exec vp test --run src/components/shared/page-header` → Expected: FAIL (no `media`/`meta` rendered).

- [ ] **Step 3: Implement** — in `PageHeader.tsx`:

Props:

```tsx
  /** Avatar or icon shown before the title. */
  media?: ReactNode;
  /** Badges and key/value items shown under the description. */
  meta?: ReactNode;
```

Destructure `media, meta` and change the title block to:

```tsx
          <Conditional.If condition={!!media}>
            <div data-slot="page-header-media" className="shrink-0">
              {media}
            </div>
          </Conditional.If>

          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{title}</h1>

            <Conditional.If condition={!!description}>
              <p className="text-fg-muted max-w-prose text-sm">{description}</p>
            </Conditional.If>

            <Conditional.If condition={!!meta}>
              <div data-slot="page-header-meta" className="text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
                {meta}
              </div>
            </Conditional.If>
          </div>
```

and change the title row wrapper `className="flex min-w-0 items-start gap-2"` to `className="flex min-w-0 items-start gap-3"`.

- [ ] **Step 4: Run it** — `P exec vp test --run src/components/shared/page-header` → Expected: PASS.

- [ ] **Step 5: Docs** — in `src/component-docs/shared/PageHeader.mdx`, import `Avatar, Badge` from `@components/ui` and add after `## Back link and breadcrumb`:

````mdx
## Media and meta

`media` puts an avatar or icon before the title; `meta` adds badges and key/value items under the description.

<Example title="Patient profile">
  <PageHeader
    className="w-full"
    title="Sara Haddad"
    media={
      <Avatar size="lg">
        <Avatar.Fallback>SH</Avatar.Fallback>
      </Avatar>
    }
    meta={
      <>
        <Badge tone="success">Active</Badge>
        <span dir="ltr" className="font-mono">MRN-20391</span>
        <span>Last visit 12 Oct 2026</span>
      </>
    }
  >
    <PageHeader.Actions>
      <Button variant="outline">Message</Button>
      <Button>Book visit</Button>
    </PageHeader.Actions>
  </PageHeader>
</Example>
````

and add to its PropsTable:

```tsx
    { prop: 'media', type: 'ReactNode', description: 'Avatar or icon before the title.' },
    { prop: 'meta', type: 'ReactNode', description: 'Badges and key/value items under the description.' },
```

- [ ] **Step 6: Verify and commit**

Run: `P docs:lint && P exec vp test --run src/components/shared/page-header src/component-docs && P exec tsc -b` → Expected: PASS.

```bash
git add src/components/shared/page-header src/component-docs/shared/PageHeader.mdx
git commit -m "feat(shared): PageHeader media and meta slots for profile-style headers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Exit — full gate and four-way screenshots

- [ ] **Step 1: Full gate**

```bash
P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && \
P docs:lint && P exec vp test --run src tests && P exec vp build && \
for s in frontmatter DocsLayout "On this page"; do echo "$s $(grep -l "$s" dist/assets/*.js | wc -l)"; done
```

Expected: every command exits 0, baseline `{}`, and each grep count is `0` (docs still absent from `dist`).

- [ ] **Step 2: Screenshots** — with the dev server on `:5199`, capture dark/light × EN/AR at 1440 px of `/docs/components/{money,sheet,stat-card,timeline,data-table,page-header}`, plus the Sheet open (1440 px and 390 px), and DataTable with two rows selected. Read every shot. Fix:
  - anything clipped
  - anything unmirrored in Arabic (the Sheet must open from the left; trend arrows mirror)
  - control heights that don't match Input
  - coloured side stripes

  Ledger each fix with its test.

- [ ] **Step 3: Commit**

```bash
git add -A src tests && git commit -m "test(kit): Plan A exit — gate, build check and four-way screenshots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
