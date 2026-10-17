# UI Kit Primitives — Plan B (Batches 4–6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the overlay, structure and date/number primitives in `src/components/ui/` to Graphite Instrument with the addendum's APIs. The plan also deletes `PrimeDialog`, `PrimeTooltip`, `PrimeDropdown` and `ScrollSelector`, migrates every call site, and finishes SP2 with `src/components/ui/**` at zero forbidden patterns.

**Architecture:**
- **Shared overlay classes:** one floating-surface and floating-motion class constant, exported from the Popover module like Plan A's `checkboxBoxClassName`. Popover, DropdownMenu, Select, Toast and Dialog all use it.
- **Clean-break APIs:** each API change is migrated in the same task. TypeScript (`tsc -b`) is the completeness check.
- **Codemod rules:** literal JSX props (Card `shadow`, Tabs variants) move through new rule sets in the Plan A codemod engine. Object literals (`toast({ variant })`) and MDX prose are fixed by hand from the tables in this plan.
- **Scope:** files outside `ui/` receive only the edit an API change forces. Their legacy-token restyle belongs to SP3 (addendum §2, amendment 1).

**Tech Stack:** React 18, TypeScript 5.9, Tailwind 4.3 + tw-animate-css, CVA, Radix UI (dialog, tooltip, popover, dropdown-menu, toast, tabs, accordion, avatar, scroll-area), react-day-picker 9, react-number-format 5, react-i18next, Vite+ (`vp`: Vitest 5, Oxlint, Oxfmt), happy-dom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-ui-kit-primitives-design.md` (addendum §8–§12) and its parent `docs/superpowers/specs/2026-10-15-ui-kit-design-system-design.md` (§6 conventions). Plan A (`docs/superpowers/plans/2026-10-15-ui-kit-primitives-a.md`) is complete on this branch.

## Global Constraints

- Branch `feat/ui-kit-primitives` (Plan A's commits are already on it). Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Package commands: `P() { corepack pnpm@10.34.7 "$@"; }` (global pnpm is 9.x; the repo pins 10.34.7). **Gate every commit on real exit codes.** Chain with `&&`, never `;`, and never pipe a gate command into `grep`/`tail` before checking its status.
- Tests import from `vite-plus/test`. DOM tests start with `// @vitest-environment happy-dom` and call `cleanup` in `afterEach`. Tests that need real strings import `'<relative>/i18n'` (it has no alias).
- **Component conventions** (parent spec §6 / `forge:create-component`):
  - Structure: kebab-case folder, PascalCase file, `index.ts` default re-export, tier barrel.
  - Every sub-component takes `className`, merges with `cn()`, spreads `...props` and sets `data-slot`.
  - TypeScript: `type`, not `interface`; `import type`; alias imports in group order.
  - JSX: `Conditional.If` / `Conditional` + `Conditional.Else` instead of `&&` or ternaries. Exception: a Radix `Slottable` must be a direct child of `Slot`, so use a plain ternary there with a comment.
  - Naming and exports: `handle*` handlers; default export last; keep the React 18 `forwardRef` bridge where the file already uses it.
- **Styling:**
  - Semantic tokens only. No hex/rgb/oklch in `.tsx`/`.mdx`, and no arbitrary `px`/`rem` values (`p-[24px]`).
  - No colored side-stripe borders, no physical `left-*`/`right-*`/`ml`/`mr`/`pl`/`pr`/`translate-x` centering.
  - Solid fills never use `bg-hover`/`bg-pressed`.
- **Floating surfaces** (addendum §8): `bg-surface-raised text-fg rounded-lg` (10px), `shadow-raised` for popover, menu and toast, `shadow-overlay` for dialog. Enter is fade + `zoom-in-98` with `duration-base`. Reduced motion keeps only the fade (`motion-reduce:zoom-in-100`).
- **Data values** (IDs, amounts, times) rendered as one value are wrapped in `dir="ltr"` (addendum §11).
- **i18n:** every new user-facing string gets EN and AR keys in the same commit. The parity test added in Task 1 enforces it.
- **Baseline:** after every task that removes violations, run `P ds:baseline` (it refuses increases) and commit the baseline file.
- **Deferred to SP3:** legacy classes inside `forms/`, `shared/`, `tables/`, `layouts/`, pages and docs. Touch them only for API migration. **Two exceptions, by the user's direction during Plan B (2026-10-15), take precedence over addendum §2 amendment 1:**
  - **Every field trigger matches Input's size scale.** That covers TimePicker, FormattedNumber, the FormDatePicker/FormDateRange input shells and the Combobox trigger. All use `fieldVariants` (`sm` 28 · `md` 32 · `lg` 40, default `md`) and `invalid`, and none keeps the legacy `h-12` shell (Task 15).
  - **The calendar views get the approved look.** `calendar/` chrome and the CalendarGrid doc demos are restyled with the grids (Task 12).
  - The rest of SP3 (for example DateNavigation, DataTablePagination's wrapper and FileCard) is unchanged.

### Plan decisions not spelled out in the addendum (keep them)

- **`Dialog.Content`:**
  - It renders the header (title + description) and the close button itself, and the body is `children`.
  - The close button is absolutely positioned (`top-3 end-3`), so `hideTitle` with no description costs no space. This is what `Command.Dialog` needs.
  - The panel is centered with `inset-x-4 mx-auto max-w-* top-1/2 -translate-y-1/2` (logical and RTL-safe), not `left-1/2 -translate-x-1/2`.
  - `Dialog.Footer` is `flex justify-end gap-2 pt-2`.
  - The old `Panel`, `Header`, `Title`, `Description`, `Overlay` and `Portal` statics are removed.
- **`Command.Dialog` takes a required `title: string`.** It passes the title to `Dialog.Content` with `hideTitle`. This resolves the Plan A deferral "Command.Dialog accessible name".
- **`ConfirmDialog` (SP3) minimal edit:**
  - It passes its title, or its confirm label, as the hidden `Dialog.Content` title and keeps its centered icon heading.
  - Its always-visible ✕ is removed, so `dismissible={false}` now means no ✕ (addendum §8: "false disables all three").
- **`Tooltip`:**
  - Props: `content`, `side`, `align`, `sideOffset`, `delayDuration`, `disabled`, `className` (applied to the bubble), `open`/`defaultOpen`/`onOpenChange`; the trigger is `children`.
  - It renders only `children` when `disabled` or `content` is empty.
  - The content is portalled, so cards and scroll areas no longer clip it.
- **Info-icon tooltips** (FormLabel, CollapsibleCard, PrimeCard) become a real `<button type="button" aria-label={t('moreInfo')}>`.
  - It calls `preventDefault` on `click` and `pointerdown`, so it neither focuses the labelled input nor closes the tooltip on press.
  - It replaces `PrimeTooltip.Item`, which used a banned side stripe.
- **`PrimeDropdown.Item`** (with `condition`/`permissions` HOCs and an `icon` prop) is replaced by `ComposedDropdownItem = withConditional(withAuth(DropdownMenu.Item))` in `composed-components`, the way Plan A kept `ComposedButton`. Icons become children.
- **`Toast`:**
  - `tone` replaces `variant`.
  - Centered positions use `inset-x-0 mx-auto`, so they stay centered in RTL. The old `inset-s-1/2 -translate-x-1/2` pushed RTL toasts off-center.
  - Toast `role`/`type` stay Radix's defaults.
- **`Tabs`:** `variant` and `fullWidth` live on `Tabs.List`, which exposes `data-variant`/`data-full-width`. Triggers style themselves through `group-data-[…]/tabs-list:` selectors, so no React context is needed. `Tabs.Trigger` loses its `variant` prop.
- **`Table`:**
  - `Table.Head` gets `numeric` as well as `Table.Cell`, so a numeric column's header aligns with its cells.
  - A numeric cell wraps its children in `<span dir="ltr">` instead of setting `dir` on the `<td>`. Setting `dir` on the `<td>` would flip the cell's own `text-end` alignment in RTL.
  - `Table.Loader`'s spinner mode renders a lucide spinner instead of `PrimeLoader`, because `ui/` must not import `Prime*`.
  - `Table.Empty` defaults come from `common.table.emptyTitle` / `emptyDescription`.
- **`Pagination.NavButton`** keeps its name and `isActive` prop and renders a `Button`. It is `solid neutral sm` when active, otherwise `ghost neutral sm`, with a min-width of one control.
- **`Avatar` `size`** maps the call sites as follows: `size-6`/`size-7` → `sm`, `h-8 w-8` → `md`. No caller relied on the old 40px default.
- **`TimePicker`:**
  - The columns are `role="listbox"` lists of `role="option"` buttons, built by pure helpers in `time-picker/timeColumns.ts`.
  - **`ScrollSelector` is deleted.** It selected by scroll position, which cannot be keyboard-driven or tested; the addendum already made it internal.
  - `error` becomes `invalid`, and a `size` prop is added.
  - The clear control moves **outside** the trigger button as an `IconButton`, which fixes nested-interactive for this component.
  - `TimePicker.Content` keeps its string props, because `TimeFilter` drives it directly.
  - The value range is inclusive of `max`.
  - AM/PM labels stay Latin, matching the Western-digits policy and the emitted value format.
- **`FormattedNumber`:**
  - The step buttons render **only when `showStepButtons` is true**. The current code inverts the flag; the docs already pass `showStepButtons` to show them.
  - The step buttons are `IconButton ghost sm` with `−`/`+` icons, labelled `number.decrement`/`number.increment`.
- **`Calendar`** reads `locale`, `dir`, nav `labels` and `numerals="latn"` from the active i18n language. The nav buttons are styled with IconButton's classes through DayPicker `classNames`; DayPicker owns those buttons. Captions are mixed month-name text, so they are not wrapped in `dir="ltr"`.

## Review Focus

1. **Every field is the same height as Input.** A form that mixes Input, Select, TimePicker, FormattedNumber, a date picker and a Combobox at the default size must render all six at `h-control-md` (32px). → Tasks 13, 14 and 15 each assert the `h-control-md` class on their trigger or shell, and Task 17 adds a gallery screenshot row with all six side by side.
2. **A non-dismissible dialog really can't be dismissed.** `Dialog.Content dismissible={false}` must ignore Escape **and** outside pointer-down, and must render no ✕. → Task 2 tests Escape, outside pointer-down and the missing close button.
3. **Centered toasts stay centered in Arabic.** `position="top-center"` must not use `inset-s-1/2` with a physical translate. → Task 5 asserts the viewport classes contain `inset-x-0 mx-auto` and no `translate-x`.
4. **The form-label info button doesn't hijack the field.** Clicking the ⓘ inside a `<label>` must not focus the input, and the tooltip must not close on press. → Task 3 asserts `preventDefault` on click and pointerdown, and an accessible name of "More information".
5. **The TimePicker column logic honors bounds and modes.** A 24h picker must list `00`–`23`. A 12h picker shows `12, 01 … 11`. `max` is inclusive. Changing the hour keeps the minute when that minute is still valid. → Task 13 unit-tests `timeColumns.ts` for each case.
6. **Numeric data stays readable in RTL.** `Table.Cell numeric` and `FormattedNumber` must render digit groups in LTR order inside an RTL page, end-aligned. → Task 8 asserts the `dir="ltr"` wrapper; Task 14 asserts the input's `dir="ltr"`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `tests/i18n/parity.test.ts` (new), `src/locales/{en,ar}/common.json` | EN/AR key parity + every new Plan B key | 1 |
| `src/components/ui/popover/*`, `src/components/ui/select/Select.tsx` | Shared floating surface + motion; Popover restyle | 1 |
| `src/components/ui/dialog/*`, `ui/command/Command.tsx`, `shared/command-palette`, `shared/confirm-dialog`, `shared/prime-dialog` (deleted) | Dialog | 2 |
| `src/components/ui/tooltip/*`, `ui/icon-button`, `shared/{error-tooltip,count-tooltip,grid-card,meta-card,file-card,collapsible-card,prime-card}`, `forms/form-label`, `shared/prime-tooltip` (deleted) | Tooltip | 3 |
| `src/components/ui/dropdown-menu/*`, `shared/composed-components`, `shared/file-card`, `shared/prime-dropdown` (deleted) | DropdownMenu | 4 |
| `src/components/ui/toast/*`, `lib/hooks/shared/useToast.ts`, `shared/toaster` | Toast | 5 |
| `src/components/ui/card/*` | Card | 6 |
| `src/components/ui/tabs/*` | Tabs | 7 |
| `src/components/ui/table/*` | Table | 8 |
| `src/components/ui/pagination/*` | Pagination | 9 |
| `src/components/ui/{accordion,collapsible,scroll-area,avatar}/*` | Small structure primitives | 10 |
| `src/components/ui/calendar/*` | Calendar | 11 |
| `src/components/ui/{calendar-month-grid,calendar-time-grid}/*`, `calendar/calendar-grid/**`, `component-docs/calendar/CalendarGrid.mdx` | Event grids: tone tint blocks, today accent, now line (user direction) | 12 |
| `src/components/ui/time-picker/*` (+ `timeColumns.ts`), `ui/scroll-selector` (deleted), `forms/form-time-picker` | TimePicker | 13 |
| `src/components/ui/formatted-number/*`, `forms/form-number` | FormattedNumber | 14 |
| `forms/{form-date-picker,form-date-range}`, `shared/combobox` | Field-shape triggers for date fields and Combobox (user direction) | 15 |
| `src/components/ui/layout/*`, `src/components/ui/index.ts` | Layout + barrel cleanup | 16 |
| `scripts/design-system/codemods/rules.ts`, `tests/design-system/codemods/migrate-props.test.ts` | `card` and `tabs` rule sets | 6, 7 |
| `tests/design-system/forbidden-patterns.test.ts` | "all of `ui/` is clean" assertion + exit review | 17 |


### Task 1: i18n parity, Plan B keys, shared floating surface, Popover

**Files:**
- Create: `tests/i18n/parity.test.ts`
- Modify: `src/locales/en/common.json`, `src/locales/ar/common.json`
- Modify: `src/components/ui/popover/Popover.tsx`, `src/components/ui/popover/index.ts`
- Modify: `src/components/ui/select/Select.tsx:98-104` (SelectContent className)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS`)
- Test: `src/components/ui/popover/Popover.test.tsx` (new)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `floatingSurfaceClassName: string` and `floatingMotionClassName: string`, exported from `@components/ui` (popover module).
  - i18n keys in `common`:
    - `moreInfo`
    - `pagination.label`, `pagination.morePages`, `pagination.previousPage`, `pagination.nextPage`
    - `calendar.previousMonth`, `calendar.nextMonth`
    - `timePicker.placeholder`, `timePicker.hours`, `timePicker.minutes`, `timePicker.period`
    - `number.increment`, `number.decrement`

- [ ] **Step 1: Write the failing tests**

Create `tests/i18n/parity.test.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const LOCALES = fileURLToPath(new URL('../../src/locales/', import.meta.url));

// Arabic needs more plural forms than English; compare plural keys by their base name.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

const flatKeys = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => flatKeys(child, prefix ? `${prefix}.${key}` : key))
    : [prefix.replace(PLURAL_SUFFIX, '')];

const keysOf = (locale: string, file: string) =>
  [...new Set(flatKeys(JSON.parse(readFileSync(`${LOCALES}${locale}/${file}`, 'utf8'))))].sort();

describe('i18n parity', () => {
  for (const file of readdirSync(`${LOCALES}en`).filter((name) => name.endsWith('.json'))) {
    it(`en and ar ${file} define the same keys`, () => {
      expect(keysOf('ar', file)).toEqual(keysOf('en', file));
    });
  }

  it('common defines every Plan B key', () => {
    expect(keysOf('en', 'common.json')).toEqual(
      expect.arrayContaining([
        'moreInfo',
        'pagination.label',
        'pagination.morePages',
        'pagination.previousPage',
        'pagination.nextPage',
        'calendar.previousMonth',
        'calendar.nextMonth',
        'timePicker.placeholder',
        'timePicker.hours',
        'timePicker.minutes',
        'timePicker.period',
        'number.increment',
        'number.decrement',
      ]),
    );
  });
});
```

Create `src/components/ui/popover/Popover.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Popover } from '@components/ui';

afterEach(cleanup);

describe('Popover', () => {
  it('renders content on the raised floating surface with the shared motion', () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Body</Popover.Content>
      </Popover>,
    );
    const content = screen.getByText('Body').closest('[data-slot="popover-content"]');
    expect(content?.className).toContain('bg-surface-raised');
    expect(content?.className).toContain('zoom-in-98');
    expect(content?.className).not.toContain('bg-popover');
  });
});
```

In `tests/design-system/forbidden-patterns.test.ts`, append `'popover'` to `CLEAN_UI_FOLDERS` (after `'toggle-group'`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run tests/i18n src/components/ui/popover tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. You should see three failures:
- "common defines every Plan B key" (the keys are missing)
- Popover `expected '…bg-popover…' to contain 'bg-surface-raised'`
- "Plan A ui folders contain no forbidden patterns" listing `src/components/ui/popover/Popover.tsx`

The per-file parity tests PASS. That is expected, because the locales are already in parity.

- [ ] **Step 3: Add the keys**

In `src/locales/en/common.json`:
- After `"removeItem"`, add:

```json
  "moreInfo": "More information",
  "calendar": {
    "previousMonth": "Previous month",
    "nextMonth": "Next month"
  },
  "timePicker": {
    "placeholder": "Select time",
    "hours": "Hours",
    "minutes": "Minutes",
    "period": "AM or PM"
  },
  "number": {
    "increment": "Increase",
    "decrement": "Decrease"
  }
```

- Extend `"pagination"` so it reads:

```json
  "pagination": {
    "label": "Pagination",
    "previous": "Previous",
    "next": "Next",
    "previousPage": "Go to previous page",
    "nextPage": "Go to next page",
    "morePages": "More pages",
    "rowsPerPage": "Rows per page",
    "pageOf": "Page {{current}} of {{total}}"
  },
```

In `src/locales/ar/common.json`, make the same structural edits with these values:
- `"moreInfo": "مزيد من المعلومات"`
- `calendar`: `"previousMonth": "الشهر السابق"`, `"nextMonth": "الشهر التالي"`
- `timePicker`: `"placeholder": "اختر الوقت"`, `"hours": "الساعات"`, `"minutes": "الدقائق"`, `"period": "صباحًا أو مساءً"`
- `number`: `"increment": "زيادة"`, `"decrement": "إنقاص"`
- `pagination`: `"label": "التنقل بين الصفحات"`, `"previousPage": "الانتقال إلى الصفحة السابقة"`, `"nextPage": "الانتقال إلى الصفحة التالية"`, `"morePages": "صفحات أخرى"`

Keep the existing Arabic `previous`/`next`/`rowsPerPage`/`pageOf` values.

- [ ] **Step 4: Implement the shared floating surface and Popover**

Replace `src/components/ui/popover/Popover.tsx` with:

```tsx
import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type ReactElement } from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@utils';

/** The raised floating surface shared by Popover, DropdownMenu, Select and Toast (addendum §8). */
export const floatingSurfaceClassName = 'bg-surface-raised text-fg shadow-raised z-50 rounded-lg outline-none';

/** Enter/exit motion for Radix floating layers: fade + 0.98 scale; reduced motion keeps only the fade. */
export const floatingMotionClassName = [
  'duration-base data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
  'data-[state=open]:zoom-in-98 data-[state=closed]:zoom-out-98',
  'motion-reduce:data-[state=open]:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100',
].join(' ');

type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;

type PopoverContentProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

type PopoverProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
  children: Array<ReactElement<PopoverTriggerProps, FC<PopoverTriggerProps>> | ReactElement<PopoverContentProps, FC<PopoverContentProps>>>;
};

type PopoverComponent = FC<PopoverProps> & {
  Trigger: FC<PopoverTriggerProps>;
  Content: FC<PopoverContentProps>;
};

const PopoverTrigger: FC<PopoverTriggerProps> = (props) => <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;

const PopoverContent: FC<PopoverContentProps> = ({ className, align = 'center', sideOffset = 4, ...props }) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(floatingSurfaceClassName, floatingMotionClassName, 'p-3', className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

const Popover: PopoverComponent = (props) => <PopoverPrimitive.Root data-slot="popover" {...props} />;

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Popover.Trigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>((props, ref) => PopoverTrigger({ ...props, ref }));
Popover.Content = PopoverContent;

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export default Popover;
```

Replace `src/components/ui/popover/index.ts` with:

```ts
export { default as Popover, floatingMotionClassName, floatingSurfaceClassName } from './Popover';
```

In `src/components/ui/select/Select.tsx`, add `floatingMotionClassName, floatingSurfaceClassName` to the existing `@components/ui` import. Then replace the three SelectContent class strings (the ones starting `'bg-surface-raised text-fg shadow-raised relative z-50 max-h-96 …'`, `'data-[side=bottom]:slide-in-from-top-2 …'` and `'data-[state=closed]:fade-out-0 … zoom-in-95'`) with:

```tsx
        floatingSurfaceClassName,
        floatingMotionClassName,
        'relative max-h-96 overflow-hidden p-1',
```

Keep any further SelectContent classes (`position === 'popper' && …`) and `className`.

Call sites already pass `p-0` where they want no padding (DateFilter, CalendarPicker, FacetedFilter, FormDatePicker/Range, Combobox). The new default padding `p-3` (it was `p-4`) needs no call-site change.

- [ ] **Step 5: Run tests to verify they pass**

Run: `P exec vp test --run tests/i18n src/components/ui/popover src/components/ui/select tests/design-system/forbidden-patterns.test.ts`
Expected: PASS, including the Select tests from Plan A.

Then run: `P exec tsc -b`
Expected: exit 0.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && \
git add tests/i18n src/locales src/components/ui/popover src/components/ui/select tests/design-system && \
git commit -m "feat(ui): shared floating surface, Popover restyle, i18n parity and Plan B keys

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 2: Dialog (absorbs PrimeDialog), Command.Dialog name, ConfirmDialog minimal edit

**Files:**
- Modify: `src/components/ui/dialog/Dialog.tsx` (rewrite), `src/components/ui/dialog/index.ts`
- Modify: `src/components/ui/command/Command.tsx:26,120-135` (CommandDialog)
- Modify: `src/components/shared/command-palette/CommandPalette.tsx:27-28`
- Modify: `src/components/shared/confirm-dialog/ConfirmDialog.tsx` (the `<Dialog.Panel …>` block)
- Modify: `src/pages/components/components.data.demos.tsx` (`DialogDemo`, delete `PrimeDialogDemo`)
- Modify: `src/components/shared/index.ts` (drop the `./prime-dialog` line)
- Modify: `src/component-docs/ui/Dialog.mdx`
- Delete: `src/components/shared/prime-dialog/`, `src/component-docs/shared/PrimeDialog.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'dialog'`)
- Test: `src/components/ui/dialog/Dialog.test.tsx` (new)

**Interfaces:**
- Consumes: `IconButton` (Plan A), `floatingMotionClassName` (Task 1), `common.close`.
- Produces:
  - `Dialog` (Radix Root) with statics:
    - `Trigger`
    - `Content: FC<DialogContentProps>`
    - `Footer: FC<ComponentPropsWithoutRef<'footer'>>`
    - `Close`
  - `DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> & { title: ReactNode; hideTitle?: boolean; description?: ReactNode; size?: 'sm' | 'md' | 'lg'; dismissible?: boolean }`.
  - `Command.Dialog` requires `title: string`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/dialog/Dialog.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button, Dialog } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const Example = ({ dismissible }: { dismissible?: boolean }) => (
  <Dialog>
    <Dialog.Trigger asChild>
      <Button>Open</Button>
    </Dialog.Trigger>

    <Dialog.Content title="Edit patient" description="Changes save immediately." dismissible={dismissible}>
      <input aria-label="Name" />
    </Dialog.Content>
  </Dialog>
);

describe('Dialog', () => {
  it('requires a title', () => {
    // @ts-expect-error — Dialog.Content without a title must not compile
    const content = <Dialog.Content>Body</Dialog.Content>;
    expect(content).toBeTruthy();
  });

  it('is named by its title and described by its description', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit patient' });
    const describedBy = dialog.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe('Changes save immediately.');
  });

  it('moves focus in on open and back to the trigger on close', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('renders a labelled close button when dismissible (default)', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('dismissible={false} ignores Escape and outside pointer-down and renders no close button', () => {
    render(<Example dismissible={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
```

Append `'dialog'` to `CLEAN_UI_FOLDERS` in `tests/design-system/forbidden-patterns.test.ts`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/dialog tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. The ✕-button and "is named by" tests fail with `Unable to find role="dialog"`, because the old Dialog has no `Content` that renders a portal. The forbidden-pattern guard lists `src/components/ui/dialog/Dialog.tsx`. (The `@ts-expect-error` test passes at runtime; `tsc -b` in Step 5 is what proves it.)

- [ ] **Step 3: Rewrite Dialog**

Replace `src/components/ui/dialog/Dialog.tsx` with:

```tsx
import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { floatingMotionClassName, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { XIcon } from 'lucide-react';

const dialogContentVariants = cva(
  [
    'bg-surface-raised text-fg shadow-overlay fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[85dvh] -translate-y-1/2 flex-col gap-4',
    'overflow-y-auto rounded-lg p-5 outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type DialogProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
type DialogFooterProps = ComponentPropsWithoutRef<'footer'>;

export type DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> &
  VariantProps<typeof dialogContentVariants> & {
    title: ReactNode;
    /** Keeps the title for assistive tech but hides it visually. */
    hideTitle?: boolean;
    description?: ReactNode;
    /** When false: no close button, Escape and outside interaction are ignored. */
    dismissible?: boolean;
  };

type DialogComponent = FC<DialogProps> & {
  Trigger: FC<DialogTriggerProps>;
  Content: FC<DialogContentProps>;
  Footer: FC<DialogFooterProps>;
  Close: FC<DialogCloseProps>;
};

type EscapeKeyDownEvent = Parameters<NonNullable<DialogContentProps['onEscapeKeyDown']>>[0];
type InteractOutsideEvent = Parameters<NonNullable<DialogContentProps['onInteractOutside']>>[0];

const DialogTrigger: FC<DialogTriggerProps> = ({ ref, ...props }) => (
  <DialogPrimitive.Trigger ref={ref} data-slot="dialog-trigger" {...props} />
);

const DialogClose: FC<DialogCloseProps> = ({ ref, ...props }) => <DialogPrimitive.Close ref={ref} data-slot="dialog-close" {...props} />;

const DialogContent: FC<DialogContentProps> = ({
  ref,
  className,
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

  const handleEscapeKeyDown = (event: EscapeKeyDownEvent) => {
    if (!dismissible) event.preventDefault();
    onEscapeKeyDown?.(event);
  };

  const handleInteractOutside = (event: InteractOutsideEvent) => {
    if (!dismissible) event.preventDefault();
    onInteractOutside?.(event);
  };

  // Radix warns unless a dialog without a Description opts out explicitly.
  const describedBy = description ? {} : { 'aria-describedby': undefined };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className={cn(
          'bg-overlay fixed inset-0 z-50 duration-slow',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        )}
      />

      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        data-size={size ?? 'md'}
        className={cn(dialogContentVariants({ size }), floatingMotionClassName, 'duration-slow', className)}
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleInteractOutside}
        {...describedBy}
        {...props}
      >
        <header data-slot="dialog-header" className={cn('flex flex-col gap-1 pe-8', hideTitle && !description && 'sr-only')}>
          <DialogPrimitive.Title data-slot="dialog-title" className={cn('text-fg text-md font-semibold', hideTitle && 'sr-only')}>
            {title}
          </DialogPrimitive.Title>

          <Conditional.If condition={!!description}>
            <DialogPrimitive.Description data-slot="dialog-description" className="text-fg-muted text-sm">
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

const DialogFooter: FC<DialogFooterProps> = ({ className, ...props }) => (
  <footer data-slot="dialog-footer" className={cn('flex justify-end gap-2 pt-2', className)} {...props} />
);

const Dialog = DialogPrimitive.Root as unknown as DialogComponent;

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Trigger = forwardRef<HTMLButtonElement, DialogTriggerProps>((props, ref) => DialogTrigger({ ...props, ref }));
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Content = forwardRef<HTMLDivElement, DialogContentProps>((props, ref) => DialogContent({ ...props, ref }));
// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Dialog.Close = forwardRef<HTMLButtonElement, DialogCloseProps>((props, ref) => DialogClose({ ...props, ref }));
Dialog.Footer = DialogFooter;

Dialog.Trigger.displayName = 'DialogTrigger';
Dialog.Content.displayName = 'DialogContent';
Dialog.Close.displayName = 'DialogClose';
DialogFooter.displayName = 'DialogFooter';

export default Dialog;
```

Replace `src/components/ui/dialog/index.ts` with:

```ts
export { default as Dialog } from './Dialog';
export type { DialogContentProps } from './Dialog';
```

- [ ] **Step 4: Migrate the call sites**

**Command.Dialog** (`src/components/ui/command/Command.tsx`):
- Change line 26 to:

```tsx
type CommandDialogProps = ComponentPropsWithoutRef<typeof Dialog> & { title: string };
```

- Replace `CommandDialog` (lines ~120-135) with:

```tsx
const CommandDialog: FC<CommandDialogProps> = ({ title, children, ...props }) => (
  <Dialog {...props}>
    <Dialog.Content title={title} hideTitle className="gap-0 overflow-hidden p-0">
      <Command
        className={cn(
          '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium',
          '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5',
          '[&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 **:[[cmdk-group]]:px-2',
          '**:[[cmdk-input]]:h-12 **:[[cmdk-item]]:p-3 **:[[cmdk-input-wrapper]]:pe-12',
        )}
      >
        {children}
      </Command>
    </Dialog.Content>
  </Dialog>
);
```

The `pe-12` keeps typed text clear of the absolutely positioned ✕.

**CommandPalette** (`src/components/shared/command-palette/CommandPalette.tsx`):
- Change `<Command.Dialog open={open} onOpenChange={setOpen}>` to `<Command.Dialog title={t('commandPalette')} open={open} onOpenChange={setOpen}>`.
- Delete the `<Dialog.Title className="sr-only">{t('commandPalette')}</Dialog.Title>` line and the blank line after it.
- If `Dialog` is no longer used, remove it from that file's `@components/ui` import.

**ConfirmDialog** (`src/components/shared/confirm-dialog/ConfirmDialog.tsx`):
- Replace everything from `<Dialog.Panel` through `</Dialog.Panel>` with:

```tsx
      <Dialog.Content
        title={title ?? resolvedConfirmLabel}
        hideTitle
        size="sm"
        dismissible={dismissible}
        className={cn(confirmDialogVariants({ variant }), className)}
      >
        <Conditional.If condition={!!title}>
          <div className="flex flex-col items-center gap-y-1.5 text-center">
            <Icon className={confirmDialogIconVariants({ variant })} size={48} />

            <p aria-hidden="true" className="text-fg text-md font-semibold">
              {title}
            </p>

            <Conditional.If condition={!!description}>
              <p className="text-fg-muted text-sm">{description}</p>
            </Conditional.If>
          </div>
        </Conditional.If>

        <Conditional.If condition={!!content}>
          <div className="flex flex-col items-center">{content}</div>
        </Conditional.If>

        <Dialog.Footer className="justify-center">
          <Conditional>
            <Conditional.If condition={!!actions}>{actions}</Conditional.If>

            <Conditional.Else>
              <Conditional.If condition={variant !== 'success' && variant !== 'info'}>
                <Dialog.Close asChild>
                  <Button variant="outline" size="lg">
                    {resolvedCancelLabel}
                  </Button>
                </Dialog.Close>
              </Conditional.If>

              <Button
                tone={primaryTone ?? confirmDialogVariantToButtonToneMapping[variant]}
                size="lg"
                loading={isLoading}
                onClick={handleConfirm}
              >
                {resolvedConfirmLabel}
              </Button>
            </Conditional.Else>
          </Conditional>
        </Dialog.Footer>
      </Dialog.Content>
```

- Remove the now-unused `X` import from `lucide-react`.
- In the JSDoc above the function, change "Built on `Dialog.Panel` (Radix)." to "Built on `Dialog.Content` (Radix)."

**Demos** (`src/pages/components/components.data.demos.tsx`):
- Add `Input` to the `@components/ui` import on line 5.
- Remove `PrimeDialog` from the `@components/shared` import on line 23.
- Delete the whole `PrimeDialogDemo` function.
- Replace `DialogDemo` with:

```tsx
export function DialogDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Dialog>
        <Dialog.Trigger asChild>
          <Button variant="outline">Edit profile</Button>
        </Dialog.Trigger>

        <Dialog.Content title="Edit profile" description="Changes are saved when you press Save.">
          <Input aria-label="Name" defaultValue="Layla Haddad" />

          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>

            <Button tone="accent">Save</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <Dialog>
        <Dialog.Trigger asChild>
          <Button variant="outline">Large</Button>
        </Dialog.Trigger>

        <Dialog.Content title="Visit notes" size="lg">
          <p className="text-fg-muted text-sm">A wider dialog for longer content such as notes or tables.</p>
        </Dialog.Content>
      </Dialog>

      <Dialog>
        <Dialog.Trigger asChild>
          <Button variant="outline">Not dismissible</Button>
        </Dialog.Trigger>

        <Dialog.Content title="Finish this step" description="Escape and outside clicks are ignored." dismissible={false}>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button>Done</Button>
            </Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
```

- If `X` from `lucide-react` is now unused in the demos file, remove it from line 4. `vp check` reports unused imports.

**Delete PrimeDialog:**

```bash
git rm -r src/components/shared/prime-dialog src/component-docs/shared/PrimeDialog.mdx
```

Then delete the line `export * from './prime-dialog';` in `src/components/shared/index.ts`.

**Docs:** replace everything after the frontmatter in `src/component-docs/ui/Dialog.mdx`. Set the frontmatter `description` to `'Modal dialog on the raised surface. Content requires a title; size sm/md/lg; dismissible by default.'`.

````mdx
import { DialogDemo } from '@pages/components/components.data.demos';

## Demo

<DialogDemo />

## Imports

```tsx
import { Dialog, Button } from '@components/ui';
```

## Code

```tsx
<Dialog>
  <Dialog.Trigger asChild>
    <Button variant="outline">Edit profile</Button>
  </Dialog.Trigger>

  <Dialog.Content title="Edit profile" description="Changes are saved when you press Save.">
    <Input aria-label="Name" />

    <Dialog.Footer>
      <Dialog.Close asChild>
        <Button variant="outline">Cancel</Button>
      </Dialog.Close>
      <Button tone="accent">Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

## API

| Prop (`Dialog.Content`) | Type | Default | Notes |
|---|---|---|---|
| `title` | `ReactNode` | — | Required. Names the dialog for assistive tech. |
| `hideTitle` | `boolean` | `false` | Keeps the title for screen readers only. |
| `description` | `ReactNode` | — | Shown under the title; wired to `aria-describedby`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Max width. |
| `dismissible` | `boolean` | `true` | `false` removes the close button and ignores Escape and outside clicks. |
````

Then confirm no old API remains. The grep must print nothing:

```bash
grep -rnE 'Dialog\.(Panel|Header|Title|Description|Overlay|Portal)\b|PrimeDialog' src
```

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/dialog src/components/ui/command tests/design-system/forbidden-patterns.test.ts && P exec tsc -b`
Expected: PASS and exit 0. `tsc -b` proves that the `@ts-expect-error` is consumed and that no importer of the deleted statics remains.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components/ui/dialog src/components/ui/command src/components/shared src/pages/components src/component-docs tests/design-system && \
git commit -m "feat(ui): Dialog.Content with required title, sizes and dismissible; drop PrimeDialog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 3: Tooltip (absorbs PrimeTooltip)

**Files:**
- Modify: `src/components/ui/tooltip/Tooltip.tsx` (rewrite), `src/components/ui/tooltip/index.ts`
- Modify: `src/components/ui/icon-button/IconButton.tsx`
- Modify: `src/components/forms/form-label/FormLabel.tsx`
- Modify: `src/components/shared/error-tooltip/ErrorTooltip.tsx`
- Modify: `src/components/shared/count-tooltip/CountTooltip.tsx`
- Modify: `src/components/shared/collapsible-card/CollapsibleCard.tsx:4,18,147-155`
- Modify: `src/components/shared/prime-card/PrimeCard.tsx:4,15,79-89`
- Modify: `src/components/shared/grid-card/GridCard.tsx:7,112-116`
- Modify: `src/components/shared/meta-card/MetaCard.tsx:4,79-81`
- Modify: `src/components/shared/file-card/FileCard.tsx:14,118-120,342-344`
- Modify: `src/components/shared/index.ts` (drop `./prime-tooltip`)
- Modify: `src/component-docs/ui/Tooltip.mdx`
- Delete: `src/components/shared/prime-tooltip/`, `src/component-docs/shared/PrimeTooltip.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'tooltip'`)
- Test: `src/components/ui/tooltip/Tooltip.test.tsx` (new), `src/components/forms/form-label/FormLabel.test.tsx` (new)

**Interfaces:**
- Consumes: the root `Tooltip.Provider` in `src/bootstrap.tsx` (Plan A), `common.moreInfo` (Task 1).
- Produces:
  - `Tooltip: FC<TooltipProps> & { Provider }`.
  - `TooltipProps = Pick<RootProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'delayDuration' | 'disableHoverableContent'> & Pick<ContentProps, 'side' | 'align' | 'sideOffset' | 'className'> & { content: ReactNode; disabled?: boolean; children: ReactElement }`.
  - `Tooltip.Trigger` and `Tooltip.Content` no longer exist.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/tooltip/Tooltip.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

afterEach(cleanup);

describe('Tooltip', () => {
  it('shows its content when the trigger receives focus', async () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip content="Archive record">
          <button type="button">Archive</button>
        </Tooltip>
      </Tooltip.Provider>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Archive' }));
    expect((await screen.findByRole('tooltip')).textContent).toBe('Archive record');
  });

  it('renders only the trigger when disabled', () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip content="Archive record" disabled>
          <button type="button">Archive</button>
        </Tooltip>
      </Tooltip.Provider>,
    );
    const trigger = screen.getByRole('button', { name: 'Archive' });
    fireEvent.focus(trigger);
    expect(trigger.getAttribute('data-state')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
```

Create `src/components/forms/form-label/FormLabel.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormLabel } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('FormLabel tooltip', () => {
  it('the info button is named and does not hand presses to the label', () => {
    render(
      <Tooltip.Provider>
        <FormLabel htmlFor="email" tooltip="We never share it">
          Email
        </FormLabel>
        <input id="email" />
      </Tooltip.Provider>,
    );
    const info = screen.getByRole('button', { name: 'More information' });
    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.pointerDown(info)).toBe(false);
    expect(fireEvent.click(info)).toBe(false);
  });
});
```

Append `'tooltip'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/tooltip src/components/forms/form-label tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL.
- The Tooltip tests fail because `<Tooltip content>` is the bare Radix Root: it renders no trigger wrapper and no tooltip role.
- FormLabel fails with `Unable to find role="button" and name "More information"`.
- The guard lists `ui/tooltip/Tooltip.tsx`.

- [ ] **Step 3: Rewrite Tooltip**

Replace `src/components/ui/tooltip/Tooltip.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactElement, type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type RootProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>;
type ContentProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;
type ProviderProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;

export type TooltipProps = Pick<RootProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'delayDuration' | 'disableHoverableContent'> &
  Pick<ContentProps, 'side' | 'align' | 'sideOffset' | 'className'> & {
    content: ReactNode;
    /** Renders only the trigger, with no tooltip behaviour. */
    disabled?: boolean;
    /** The trigger. Must accept a ref and spread props (Radix `asChild`). */
    children: ReactElement;
  };

type TooltipComponent = FC<TooltipProps> & {
  Provider: FC<ProviderProps>;
};

const Provider: FC<ProviderProps> = (props) => <TooltipPrimitive.Provider {...props} />;

const Tooltip: TooltipComponent = ({ content, disabled = false, side, align, sideOffset = 4, className, children, ...rootProps }) => {
  const hasContent = content !== null && content !== undefined && content !== false && content !== '';

  return (
    <Conditional>
      <Conditional.If condition={disabled || !hasContent}>{children}</Conditional.If>

      <Conditional.Else>
        <TooltipPrimitive.Root {...rootProps}>
          <TooltipPrimitive.Trigger asChild data-slot="tooltip-trigger">
            {children}
          </TooltipPrimitive.Trigger>

          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              data-slot="tooltip-content"
              side={side}
              align={align}
              sideOffset={sideOffset}
              className={cn(
                'bg-fg text-fg-inverse z-50 max-w-xs rounded-md px-2 py-1 text-xs',
                'animate-in fade-in-0 zoom-in-98 duration-fast motion-reduce:zoom-in-100',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                className,
              )}
            >
              {content}
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </Conditional.Else>
    </Conditional>
  );
};

Tooltip.Provider = Provider;

Provider.displayName = 'TooltipProvider';
Tooltip.displayName = 'Tooltip';

export default Tooltip;
```

Replace `src/components/ui/tooltip/index.ts` with:

```ts
export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';
```

- [ ] **Step 4: Migrate the call sites**

**IconButton** (`src/components/ui/icon-button/IconButton.tsx`). Replace the `return (...)` block with the following, and remove the now-unused `Conditional` import:

```tsx
  return (
    <Tooltip content={props['aria-label']} disabled={!tooltip}>
      {button}
    </Tooltip>
  );
```

**FormLabel** (`src/components/forms/form-label/FormLabel.tsx`):
- Change the imports: replace `import { PrimeTooltip } from '@components/shared';` with `import { Tooltip } from '@components/ui';`, and add `import { useAppTranslation } from '@hooks/shared';` in the hooks group.
- Add `const { t } = useAppTranslation('common');` as the first line of the component body. It must come before `if (hidden) return null;`, because hooks cannot run after an early return.
- Replace the `{tooltip && ( <PrimeTooltip …> … </PrimeTooltip> )}` block with:

```tsx
      {tooltip && (
        <Tooltip content={tooltip} align="start">
          <button
            type="button"
            aria-label={t('moreInfo')}
            className="focus-ring text-fg-muted ms-1 inline-flex cursor-help rounded-sm align-text-top"
            onClick={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
          >
            <Info size={16} aria-hidden="true" />
          </button>
        </Tooltip>
      )}
```

The `{tooltip && …}` form matches the file's existing style for its sibling `required` line. Converting the file to `Conditional` is SP3 work.

**ErrorTooltip** (`src/components/shared/error-tooltip/ErrorTooltip.tsx`). Replace the function with:

```tsx
function ErrorTooltip({ className, message, ...props }: ErrorTooltipProps) {
  return (
    <Tooltip content={<p>{message}</p>} className="bg-danger text-danger-fg text-sm">
      <button
        type="button"
        aria-label={typeof message === 'string' ? message : undefined}
        className={cn(
          'bg-danger text-danger-fg absolute inset-s-2 inset-bs-1/2 z-10 mb-0 flex -translate-y-1/2 cursor-help items-center justify-center rounded-full',
          className,
        )}
        {...props}
      >
        <InfoIcon size={20} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
```

**CollapsibleCard** (`src/components/shared/collapsible-card/CollapsibleCard.tsx`):
- Imports: change line 4 to `import { Tooltip, type TooltipProps } from '@components/ui';`, merging it into the existing `@components/ui` import if there is one. Add `useAppTranslation` to the `@hooks/shared` import, creating the import if needed, and add `type ReactNode` to the `react` import.
- Change line 18 to:

```tsx
type CollapsibleCardTooltipProps = Omit<TooltipProps, 'content' | 'children'> & { children: ReactNode };
```

- Replace `CollapsibleCardTooltip` with:

```tsx
const CollapsibleCardTooltip: FC<CollapsibleCardTooltipProps> = ({ children, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <Tooltip content={children} align="start" {...props}>
      <button
        type="button"
        aria-label={t('moreInfo')}
        className="focus-ring text-fg-muted inline-flex cursor-help rounded-sm"
        onClick={(event) => event.preventDefault()}
        onPointerDown={(event) => event.preventDefault()}
      >
        <Info size={20} aria-hidden="true" />
      </button>
    </Tooltip>
  );
};
```

**PrimeCard** (`src/components/shared/prime-card/PrimeCard.tsx`):
- Make the same import and type changes as CollapsibleCard: `type PrimeCardTooltipProps = Omit<TooltipProps, 'content' | 'children'> & { children: ReactNode };`.
- Replace `PrimeCardTooltip` with the same body as `CollapsibleCardTooltip` above, renamed, so that `className` now reaches the bubble:

```tsx
const PrimeCardTooltip: FC<PrimeCardTooltipProps> = ({ children, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <Tooltip content={children} align="start" {...props}>
      <button
        type="button"
        aria-label={t('moreInfo')}
        className="focus-ring text-fg-muted inline-flex cursor-help rounded-sm"
        onClick={(event) => event.preventDefault()}
        onPointerDown={(event) => event.preventDefault()}
      >
        <Info size={20} aria-hidden="true" />
      </button>
    </Tooltip>
  );
};
```

**GridCard, MetaCard, FileCard (truncated-text tooltips):**
- In each file, replace `PrimeTooltip` with `Tooltip`, imported from `@components/ui`. Remove `PrimeTooltip` from the `@components/shared` import, and in FileCard keep the other names on that line.
- The JSX keeps its shape. For example, `<PrimeTooltip content={children}>…</PrimeTooltip>` becomes `<Tooltip content={children}>…</Tooltip>`. These triggers are hover-only `div`/`span` text, as before.

**CountTooltip** (`src/components/shared/count-tooltip/CountTooltip.tsx`):
- Replace line 12 with `import { Tooltip, type TooltipProps } from '@components/ui';`. Add `type ReactElement, type ReactNode` to the `react` import.
- Replace the type lines 23-28 with:

```tsx
type CountTooltipItemProps = ComponentPropsWithoutRef<'div'> & { icon?: ReactNode };

type CountTooltipProps = Omit<TooltipProps, 'content' | 'children'> & {
  count: number;
  condition?: boolean;
  children: ReactNode;
};
```

- In `Trigger`, change the class string to `'bg-hover text-fg-muted inline-flex items-center justify-center rounded-full px-1.5 text-xs'` and add `tabIndex={0}`, so keyboard users can open it.
- Replace `Item` and the `CountTooltip` component with:

```tsx
const Item: FC<CountTooltipItemProps> = ({ className, icon, children, ...props }) => (
  <div data-slot="count-tooltip-item" className={cn('flex items-center gap-2', className)} {...props}>
    <Conditional.If condition={!!icon}>
      <span className="flex items-center">{icon}</span>
    </Conditional.If>

    <span className="flex-1">{children}</span>
  </div>
);

const CountTooltip: CountTooltipComponent = ({ count, condition = true, children, ...props }) => {
  const childArray = Children.toArray(children);

  const triggerChild = childArray.find((child) => isValidElement(child) && child.type === CountTooltip.Trigger);

  // Without an explicit Trigger, the first child is the trigger and the rest is content (unchanged behaviour).
  const trigger = (triggerChild ?? childArray[0]) as ReactElement;
  const items = triggerChild ? childArray.filter((child) => child !== triggerChild) : childArray.slice(1);

  if (!condition) return null;

  return (
    <CountTooltipContext.Provider value={{ count }}>
      <Tooltip content={items.length > 0 ? <div className="grid gap-1">{items}</div> : null} {...props}>
        {trigger}
      </Tooltip>
    </CountTooltipContext.Provider>
  );
};
```

**Delete PrimeTooltip:**

```bash
git rm -r src/components/shared/prime-tooltip src/component-docs/shared/PrimeTooltip.mdx
```

Then delete the `./prime-tooltip` export line in `src/components/shared/index.ts`.

**Docs:**
- Replace the body of `src/component-docs/ui/Tooltip.mdx` after its frontmatter with a Demo / Imports / Code / API structure like Dialog.mdx.
- The Code block shows `<Tooltip content="Archive record"><IconButton …/></Tooltip>` and `<Tooltip content="…" side="bottom" align="start">`.
- The API table rows are `content`, `side`, `align`, `delayDuration`, `disabled` and `className` (the bubble).
- It notes that one `Tooltip.Provider` is mounted at the app root.
- If `CountTooltip.mdx` or `ErrorTooltip.mdx` use `PrimeTooltip` props that no longer exist, update them to `TooltipProps` names.

Then confirm the old API is gone. The grep must print nothing:

```bash
grep -rnE 'PrimeTooltip|Tooltip\.(Trigger|Content)\b' src
```

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components/ui src/components/forms tests/design-system src/bootstrap.test.tsx && P exec tsc -b`
Expected: PASS and exit 0.

`src/bootstrap.test.tsx` mocks `Tooltip: { Provider }`. If it now fails because the mocked module lacks a export it renders, add the missing name to the mock rather than unmocking.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components src/component-docs tests/design-system && \
git commit -m "feat(ui): Tooltip content API with portalled inverse bubble; drop PrimeTooltip

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 4: DropdownMenu (replaces PrimeDropdown)

**Files:**
- Modify: `src/components/ui/dropdown-menu/DropdownMenu.tsx`
- Modify: `src/components/shared/composed-components/index.ts`
- Modify: `src/components/shared/file-card/FileCard.tsx:14,39,80-81,131-139,427-428`
- Modify: `src/components/shared/index.ts` (drop `./prime-dropdown`)
- Modify: `src/component-docs/ui/DropdownMenu.mdx`, `src/component-docs/shared/FileCard.mdx`, `src/component-docs/tables/DataTable.mdx:276-283,304`
- Delete: `src/components/shared/prime-dropdown/`, `src/component-docs/shared/PrimeDropdown.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'dropdown-menu'`)
- Test: `src/components/ui/dropdown-menu/DropdownMenu.test.tsx` (new)

**Interfaces:**
- Consumes: `floatingSurfaceClassName`, `floatingMotionClassName` (Task 1), `withConditional`, `withAuth` (`@hoc`).
- Produces:
  - `DropdownMenu.Item` gains a `tone?: 'neutral' | 'danger'` prop (default `'neutral'`) and exposes `data-tone`.
  - `DropdownMenu.Shortcut` renders in the mono font.
  - `ComposedDropdownItem = withConditional(withAuth(DropdownMenu.Item))`, exported from `@components/shared`.
  - `FileCard.Item = ComposedDropdownItem` and `FileCard.Separator = DropdownMenu.Separator`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/dropdown-menu/DropdownMenu.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DropdownMenu } from '@components/ui';

afterEach(cleanup);

const renderMenu = () =>
  render(
    <DropdownMenu defaultOpen>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>
          Edit
          <DropdownMenu.Shortcut>⌘E</DropdownMenu.Shortcut>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item tone="danger">Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>,
  );

describe('DropdownMenu', () => {
  it('exposes the item tone', () => {
    renderMenu();
    expect(screen.getByRole('menuitem', { name: 'Delete' }).dataset.tone).toBe('danger');
    expect(screen.getByRole('menuitem', { name: /Edit/ }).dataset.tone).toBe('neutral');
  });

  it('renders shortcuts in the mono face on the raised surface', () => {
    renderMenu();
    expect(screen.getByText('⌘E').className).toContain('font-mono');
    expect(screen.getByRole('menu').className).toContain('bg-surface-raised');
  });
});
```

Append `'dropdown-menu'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/dropdown-menu tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL:
- `expected undefined to be 'danger'`
- `expected '…opacity-60' to contain 'font-mono'`
- the guard lists `ui/dropdown-menu/DropdownMenu.tsx`

- [ ] **Step 3: Restyle DropdownMenu**

In `src/components/ui/dropdown-menu/DropdownMenu.tsx`:

1. **Imports.** Add `import { floatingMotionClassName, floatingSurfaceClassName } from '@components/ui';` after the Radix import, and `import { cva, type VariantProps } from 'class-variance-authority';` before `import { cn } from '@utils';`.

2. **Item variants.** Add above the sub-components:

```tsx
const menuItemBase =
  'relative flex h-7 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none select-none transition-colors focus:bg-hover data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

const menuItemVariants = cva(menuItemBase, {
  variants: {
    tone: {
      neutral: 'text-fg',
      danger: 'text-danger',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});
```

3. **Item type.** Change `DropdownMenuItemProps` to:

```tsx
type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> &
  VariantProps<typeof menuItemVariants> & { inset?: boolean };
```

4. **Replace these components:**

```tsx
const DropdownMenuPortal: FC<DropdownMenuPortalProps> = (props) => <DropdownMenuPrimitive.Portal {...props} />;

const SubTrigger: FC<DropdownMenuSubTriggerProps> = ({ className, inset, children, ...props }) => (
  <DropdownMenuPrimitive.SubTrigger
    data-slot="dropdown-subtrigger"
    className={cn(menuItemBase, 'text-fg data-[state=open]:bg-hover cursor-default', inset && 'ps-8', className)}
    {...props}
  >
    {children}
    <ChevronRight className="ms-auto rtl:rotate-180" />
  </DropdownMenuPrimitive.SubTrigger>
);

const SubContent: FC<DropdownMenuSubContentProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.SubContent
    data-slot="dropdown-subcontent"
    className={cn(floatingSurfaceClassName, floatingMotionClassName, 'min-w-32 overflow-hidden p-1', className)}
    {...props}
  />
);

const Content: FC<DropdownMenuContentProps> = ({ className, sideOffset = 4, ...props }) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      data-slot="dropdown-content"
      sideOffset={sideOffset}
      className={cn(floatingSurfaceClassName, floatingMotionClassName, 'min-w-32 overflow-hidden p-1', className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

const Item: FC<DropdownMenuItemProps> = ({ className, inset, tone, ...props }) => (
  <DropdownMenuPrimitive.Item
    data-slot="dropdown-item"
    data-tone={tone ?? 'neutral'}
    className={cn(menuItemVariants({ tone }), inset && 'ps-8', className)}
    {...props}
  />
);
```

5. **CheckboxItem and RadioItem.** Replace their two class-string lines with `menuItemBase, 'text-fg cursor-default ps-8 pe-2'`. Keep their indicator spans unchanged.

6. **Label, Separator and Shortcut:**

```tsx
const Label: FC<DropdownMenuLabelProps & { inset?: boolean }> = ({ className, inset, ...props }) => (
  <DropdownMenuPrimitive.Label
    data-slot="dropdown-label"
    className={cn('text-fg-muted px-2 py-1.5 text-xs font-medium', inset && 'ps-8', className)}
    {...props}
  />
);

const Separator: FC<DropdownMenuSeparatorProps> = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Separator data-slot="dropdown-separator" className={cn('bg-border-subtle -mx-1 my-1 h-px', className)} {...props} />
);

const Shortcut: FC<DropdownMenuShortcutProps> = ({ className, ...props }) => (
  <span data-slot="dropdown-shortcut" className={cn('text-fg-subtle ms-auto font-mono text-xs', className)} {...props} />
);
```

7. **Trigger.** Change its class string to `'focus-ring flex items-center justify-center rounded-md text-sm font-medium'`.

- [ ] **Step 4: Replace PrimeDropdown**

**`src/components/shared/composed-components/index.ts`.** Add below the Button import and export:

```ts
// !Direct import is required and not by mistake to avoid circular dependencies
import DropdownMenu from '@components/ui/dropdown-menu/DropdownMenu';

export const ComposedDropdownItem = withConditional(withAuth(DropdownMenu.Item));
```

**FileCard** (`src/components/shared/file-card/FileCard.tsx`):
- On line 14, drop `PrimeDropdown` from the `@components/shared` import and add `ComposedDropdownItem`. Add `DropdownMenu` to the file's `@components/ui` import.
- Change line 39's `Pick<ComponentProps<typeof PrimeDropdown>, 'align'>` to `Pick<ComponentProps<typeof DropdownMenu.Content>, 'align'>`.
- Change lines 80-81 to `Item: typeof ComposedDropdownItem;` and `Separator: typeof DropdownMenu.Separator;`.
- Replace the `Actions` JSX with:

```tsx
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton size="sm" type="button" aria-label={t('actions')}>
          <MoreHorizontal size={16} />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align={align}>{children(entry)}</DropdownMenu.Content>
    </DropdownMenu>
  );
```

- Change lines 427-428 to `FileCard.Item = ComposedDropdownItem;` and `FileCard.Separator = DropdownMenu.Separator;`.

**Delete PrimeDropdown:**

```bash
git rm -r src/components/shared/prime-dropdown src/component-docs/shared/PrimeDropdown.mdx
```

Then delete the `./prime-dropdown` export line in `src/components/shared/index.ts`.

**MDX hand edits:**

| File | Find | Replace |
|---|---|---|
| `component-docs/shared/FileCard.mdx` (6 items) | `<FileCard.Item … icon={<X size={16} />} …>Label` | `<FileCard.Item …><X />Label` (move the icon to the first child; drop `size`, since the item sizes svgs to 16) |
| same | `variant="destructive"` on `FileCard.Item` | `tone="danger"` |
| same, lines 339-340 | `alias of \`PrimeDropdown.Item\`` / `alias of \`PrimeDropdown.Separator\`` | `alias of \`DropdownMenu.Item\` (composed)` / `alias of \`DropdownMenu.Separator\`` |
| `component-docs/tables/DataTable.mdx:276-283` | the `<PrimeDropdown>` row-actions example | the `<DropdownMenu>` block below |
| `component-docs/tables/DataTable.mdx:304` | `` `PrimeDropdown`, `PrimeTooltip` `` | `` `DropdownMenu`, `Tooltip` `` |

The DataTable.mdx replacement block:

```tsx
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton size="sm" aria-label="Row actions">
          <More size={20} />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item onSelect={() => navigate(`/profile/${row.original.id}`)}>
          <Eye />
          View Profile
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
```

**DropdownMenu.mdx.**
- Add an example with `tone="danger"` and `<DropdownMenu.Shortcut>⌘E</DropdownMenu.Shortcut>`.
- Add an API table:

| Prop | On | Values |
|---|---|---|
| `tone` | `Item` | `neutral` (default), `danger` |
| `inset` | `Item`, `Label`, `SubTrigger` | aligns with checkbox/radio items |
| `Shortcut` | slot | mono hint at the inline end |

Confirm nothing remains. The grep must print nothing:

```bash
grep -rnE 'PrimeDropdown|FileCard\.Item[^>]*(icon=|variant=)' src
```

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components src/component-docs tests/design-system && \
git commit -m "feat(ui): DropdownMenu on the raised surface with item tone and mono shortcuts; drop PrimeDropdown

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 5: Toast (`tone` replaces `variant`)

**Files:**
- Modify: `src/components/ui/toast/Toast.tsx` (rewrite)
- Modify: `src/components/shared/toaster/Toaster.tsx`
- Modify: `src/pages/components/components.data.demos.tsx:844-898` (7 `toast()` calls)
- Modify: `src/component-docs/ui/Toast.mdx:36-50`, `src/component-docs/shared/Toaster.mdx:39`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'toast'`)
- Test: `src/components/ui/toast/Toast.test.tsx` (new), `src/components/shared/toaster/Toaster.test.tsx` (new)

**Interfaces:**
- Consumes: `floatingSurfaceClassName` (Task 1) and `common.close`.
- Produces:
  - `ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'`.
  - `ToastProps = Radix Root props & { tone?: ToastTone; position?: ToastPosition }`. The `variant` key is gone, so `toast({ variant })` is a type error.
  - `ToastPosition` keeps all six values.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/toast/Toast.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Toast } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('Toast', () => {
  it('centers a top-center viewport with logical insets, not a physical translate', () => {
    render(
      <Toast.Provider>
        <Toast.Viewport position="top-center" />
      </Toast.Provider>,
    );
    const viewport = document.querySelector('[data-slot="toast-viewport"]');
    expect(viewport?.className).toContain('inset-x-0');
    expect(viewport?.className).toContain('mx-auto');
    expect(viewport?.className).not.toMatch(/translate-x/);
  });

  it('keeps every tone on the raised surface and names its close button', () => {
    render(
      <Toast.Provider>
        <Toast open tone="success">
          <Toast.Title>Saved</Toast.Title>
          <Toast.Close />
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const toast = screen.getByText('Saved').closest('[data-slot="toast"]');
    expect(toast?.getAttribute('data-tone')).toBe('success');
    expect(toast?.className).toContain('bg-surface-raised');
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
});
```

Create `src/components/shared/toaster/Toaster.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Toaster } from '@components/shared';

import { toast } from '@hooks/shared';

import '../../../i18n';

afterEach(cleanup);

describe('Toaster', () => {
  it('passes the tone of toast() through to the rendered toast', async () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Record deleted', tone: 'danger' });
    });
    const rendered = (await screen.findByText('Record deleted')).closest('[data-slot="toast"]');
    expect(rendered?.getAttribute('data-tone')).toBe('danger');
  });

  it('rejects the removed variant key at compile time', () => {
    // @ts-expect-error — `variant` was replaced by `tone`
    const call = () => toast({ title: 'x', variant: 'destructive' });
    expect(call).toBeTypeOf('function');
  });
});
```

Append `'toast'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/toast src/components/shared/toaster tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. The viewport has `inset-s-1/2 -translate-x-1/2`, `data-tone` is null, and the guard lists `ui/toast/Toast.tsx`. The `@ts-expect-error` test is checked by `tsc -b` in Step 5.

- [ ] **Step 3: Rewrite Toast**

Replace `src/components/ui/toast/Toast.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, createContext, type FC, useContext } from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';

import { floatingSurfaceClassName } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const viewportVariants = cva('fixed z-100 flex w-full flex-col gap-2 p-3 md:max-w-max', {
  variants: {
    position: {
      'top-start': 'top-16 inset-s-0',
      'top-center': 'top-16 inset-x-0 mx-auto',
      'top-end': 'top-16 inset-e-0',
      'bottom-start': 'bottom-0 inset-s-0',
      'bottom-center': 'bottom-0 inset-x-0 mx-auto',
      'bottom-end': 'bottom-0 inset-e-0',
    },
  },
  defaultVariants: {
    position: 'top-end',
  },
});

const toastVariants = cva(
  [
    floatingSurfaceClassName,
    'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden p-3 pe-10 md:w-96',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)',
    'data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out',
    'duration-base data-[state=closed]:fade-out-0 motion-reduce:data-[state=open]:slide-in-from-top-0 motion-reduce:data-[state=open]:slide-in-from-bottom-0',
  ],
  {
    variants: {
      position: {
        'top-start': 'data-[state=open]:slide-in-from-top-2',
        'top-center': 'data-[state=open]:slide-in-from-top-2',
        'top-end': 'data-[state=open]:slide-in-from-top-2',
        'bottom-start': 'data-[state=open]:slide-in-from-bottom-2',
        'bottom-center': 'data-[state=open]:slide-in-from-bottom-2',
        'bottom-end': 'data-[state=open]:slide-in-from-bottom-2',
      },
    },
    defaultVariants: {
      position: 'top-end',
    },
  },
);

export type ToastPosition = VariantProps<typeof viewportVariants>['position'];

export type ToastProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
  tone?: ToastTone;
  position?: ToastPosition;
};

type ToastViewportProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & VariantProps<typeof viewportVariants>;
type ToastTitleProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Title>;
type ToastDescriptionProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Description>;
type ToastCloseProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Close>;
type ToastIconProps = { tone?: ToastTone };
type ToastActionProps = ComponentPropsWithoutRef<typeof ToastPrimitives.Action>;

type ToastComponent = FC<ToastProps> & {
  Provider: typeof ToastPrimitives.Provider;
  Viewport: FC<ToastViewportProps>;
  Title: FC<ToastTitleProps>;
  Description: FC<ToastDescriptionProps>;
  Close: FC<ToastCloseProps>;
  Icon: FC<ToastIconProps>;
  Action: FC<ToastActionProps>;
};

const ToastContext = createContext<{ tone: ToastTone }>({ tone: 'neutral' });

const TONE_ICON: Record<ToastTone, { Icon: typeof Info; className: string }> = {
  neutral: { Icon: Info, className: 'text-fg-muted' },
  info: { Icon: Info, className: 'text-info' },
  success: { Icon: CheckCircle2, className: 'text-success' },
  warning: { Icon: AlertTriangle, className: 'text-warning' },
  danger: { Icon: XCircle, className: 'text-danger' },
};

const ToastViewport: FC<ToastViewportProps> = ({ className, position, ...props }) => (
  <ToastPrimitives.Viewport data-slot="toast-viewport" className={cn(viewportVariants({ position }), className)} {...props} />
);

const ToastTitle: FC<ToastTitleProps> = ({ className, ...props }) => (
  <ToastPrimitives.Title data-slot="toast-title" className={cn('text-fg text-sm font-semibold', className)} {...props} />
);

const ToastDescription: FC<ToastDescriptionProps> = ({ className, ...props }) => (
  <ToastPrimitives.Description
    data-slot="toast-description"
    className={cn('text-fg-muted text-sm whitespace-pre-line select-text', className)}
    {...props}
  />
);

const ToastClose: FC<ToastCloseProps> = ({ className, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <ToastPrimitives.Close
      aria-label={t('close')}
      data-slot="toast-close"
      className={cn(
        'focus-ring text-fg-muted hover:text-fg absolute end-2 top-2 cursor-pointer rounded-sm p-1',
        'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
        className,
      )}
      toast-close=""
      {...props}
    >
      <X size={16} aria-hidden="true" />
    </ToastPrimitives.Close>
  );
};

const ToastIcon: FC<ToastIconProps> = ({ tone }) => {
  const context = useContext(ToastContext);
  const { Icon, className } = TONE_ICON[tone ?? context.tone];

  return <Icon data-slot="toast-icon" aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', className)} />;
};

const ToastAction: FC<ToastActionProps> = ({ className, ...props }) => (
  <ToastPrimitives.Action data-slot="toast-action" className={cn('ms-auto shrink-0', className)} {...props} />
);

const Toast: ToastComponent = ({ className, tone = 'neutral', position, children, ...props }) => (
  <ToastContext.Provider value={{ tone }}>
    <ToastPrimitives.Root data-slot="toast" data-tone={tone} className={cn(toastVariants({ position }), className)} {...props}>
      {children}
    </ToastPrimitives.Root>
  </ToastContext.Provider>
);

Toast.Provider = ToastPrimitives.Provider;
Toast.Viewport = ToastViewport;
Toast.Title = ToastTitle;
Toast.Description = ToastDescription;
Toast.Close = ToastClose;
Toast.Icon = ToastIcon;
Toast.Action = ToastAction;

Toast.displayName = ToastPrimitives.Root.displayName;
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
ToastTitle.displayName = ToastPrimitives.Title.displayName;
ToastDescription.displayName = ToastPrimitives.Description.displayName;
ToastClose.displayName = ToastPrimitives.Close.displayName;
ToastIcon.displayName = 'ToastIcon';
ToastAction.displayName = ToastPrimitives.Action.displayName;

export default Toast;
```

Check that `src/components/ui/toast/index.ts` exports `ToastTone` as well. If it uses `export * from './Toast'` it does already; otherwise add `export type { ToastPosition, ToastProps, ToastTone } from './Toast';`.

- [ ] **Step 4: Migrate Toaster and the `toast()` calls**

Replace the `toasts.map(...)` body in `src/components/shared/toaster/Toaster.tsx` with:

```tsx
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <Toast.Icon />

          <div className="grid min-w-0 flex-1 gap-0.5">
            {title && <Toast.Title>{title}</Toast.Title>}

            {description && <Toast.Description>{description}</Toast.Description>}
          </div>

          {action && (
            <Toast.Action asChild altText={typeof title === 'string' ? title : 'Toast action'}>
              {action}
            </Toast.Action>
          )}

          <Toast.Close />
        </Toast>
      ))}
```

In the demos, `Toast.mdx` and `Toaster.mdx`, rewrite every `variant:` key inside `toast({...})` objects as follows:

| Old | New |
|---|---|
| `variant: 'default',` | *(delete the line; `neutral` is the default)* |
| `variant: 'success',` | `tone: 'success',` |
| `variant: 'warning',` | `tone: 'warning',` |
| `variant: 'info',` | `tone: 'info',` |
| `variant: 'destructive',` | `tone: 'danger',` |

Also update the prose in `Toast.mdx` that mentions "variant". It should describe `tone`, and state that tone colors only the icon (no tinted backgrounds). The grep must print nothing:

```bash
grep -rnE "variant: '(default|success|warning|info|destructive)'" src/pages/components src/component-docs/ui/Toast.mdx src/component-docs/shared/Toaster.mdx
```

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/toast src/components/shared/toaster tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components src/pages/components src/component-docs tests/design-system && \
git commit -m "feat(ui): Toast tone on the raised surface, RTL-safe centered positions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 6: Card (+ `.Actions`, no resting shadow)

**Files:**
- Modify: `src/components/ui/card/Card.tsx` (rewrite), `src/components/ui/card/index.ts`
- Modify: `scripts/design-system/codemods/rules.ts` (add the `card` rule set)
- Modify: call sites rewritten by `P ds:migrate card` (`DocPanel.tsx:18`, `SidebarPanel.tsx:91`, `GridCard.tsx:72`, `MetaCard.tsx:70`)
- Modify: `src/component-docs/ui/Card.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'card'`)
- Test: `src/components/ui/card/Card.test.tsx` (new), `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: the codemod engine (`migrateSource`, `TagRule`, `RULE_SETS`) from Plan A.
- Produces:
  - `Card` with no `shadow` prop.
  - Statics `Header`, `Title`, `Description`, `Content`, `Footer`, and a new `Actions` (header trailing slot, `data-slot="card-actions"`).
  - `RULE_SETS.card`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/card/Card.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Card } from '@components/ui';

afterEach(cleanup);

describe('Card', () => {
  it('places Actions in the header trailing slot', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Patients</Card.Title>
          <Card.Description>Seen this week</Card.Description>
          <Card.Actions>
            <button type="button">Export</button>
          </Card.Actions>
        </Card.Header>
      </Card>,
    );
    const actions = screen.getByRole('button', { name: 'Export' }).parentElement!;
    expect(actions.dataset.slot).toBe('card-actions');
    expect(actions.closest('[data-slot="card-header"]')).not.toBeNull();
  });

  it('rests flat on the surface with a hairline border and no shadow', () => {
    render(<Card data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('bg-surface');
    expect(card.className).toContain('border-border');
    expect(card.className).not.toMatch(/\bshadow/);
  });
});
```

In `tests/design-system/codemods/migrate-props.test.ts`, append:

```ts
describe('card rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.card, 'x.tsx').output;

  it.each([
    ['<Card shadow="sm" className="x">', '<Card className="x">'],
    ['<Card shadow="none">', '<Card>'],
    ['<Card>', '<Card>'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});
```

Append `'card'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/card tests/design-system`
Expected: FAIL:
- `Card.Actions` is undefined (React error: element type is invalid)
- the card class contains `bg-background` and `shadow`
- `RULE_SETS.card` is undefined
- the guard lists `ui/card/Card.tsx`

- [ ] **Step 3: Implement**

Replace `src/components/ui/card/Card.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cn } from '@utils';

export type CardProps = ComponentPropsWithoutRef<'article'>;

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

// The header gains a trailing column only when it holds Card.Actions.
const Header: FC<CardHeaderProps> = ({ className, ...props }) => (
  <header
    data-slot="card-header"
    className={cn('grid auto-rows-min items-start gap-1 px-5 pt-4 has-data-[slot=card-actions]:grid-cols-[1fr_auto]', className)}
    {...props}
  />
);

const Title: FC<CardTitleProps> = ({ className, ...props }) => (
  <h3 data-slot="card-title" className={cn('text-fg text-md leading-tight font-semibold', className)} {...props} />
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

const Card: CardComponent = ({ className, ...props }) => (
  <article data-slot="card" className={cn('bg-surface border-border text-fg rounded-lg border', className)} {...props} />
);

Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Actions = Actions;
Card.Content = Content;
Card.Footer = Footer;

export default Card;
```

Make sure `src/components/ui/card/index.ts` reads `export { default as Card } from './Card';` plus `export type { CardProps } from './Card';`. `cardVariants`/`CardVariants` no longer exist. A `tsc -b` failure here means an importer needs to drop them; remove that import and its usage.

In `scripts/design-system/codemods/rules.ts`, add the rule and register it:

```ts
const cardRule: TagRule = {
  tag: 'Card',
  keys: ['shadow'],
  // Cards no longer have a resting shadow (addendum §9); every value is dropped.
  transform: () => ({}),
};
```

```ts
  card: [cardRule],
```

- [ ] **Step 4: Migrate the call sites**

Run: `P ds:migrate card`
Expected: it reports 4 changed tags (DocPanel, SidebarPanel, GridCard, MetaCard) and 0 manual items.

The `Card` content padding moves from `px-6 py-4` to `px-5 py-4`. Call sites that override padding (`DocPanel`, `SidebarPanel`, `GridCard`, `MetaCard`, `CollapsibleCard`, `PrimeCard`) keep their own classes. Their legacy borders and shadows are SP3.

**Card.mdx:**
- Remove the `shadow` examples.
- Add a header example with `<Card.Actions><Button size="sm" variant="outline">Export</Button></Card.Actions>`.
- Update the API table so it lists `Header`, `Title`, `Description`, `Actions`, `Content` and `Footer`, and notes that there is no resting shadow.

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/card tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src scripts tests && \
git commit -m "feat(ui): flat Card with header Actions slot; drop the shadow prop

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Tabs (`underline` · `contained`, `fullWidth`)

**Files:**
- Modify: `src/components/ui/tabs/Tabs.tsx` (rewrite)
- Modify: `scripts/design-system/codemods/rules.ts` (add the `tabs` rule set)
- Modify: call sites rewritten by `P ds:migrate tabs`:
  - `ComponentsGalleryPage.tsx:151`
  - `CalendarGridChrome.tsx:65`
  - `component-docs/ui/Tabs.mdx` (List variants and Trigger `variant="fitContent"`)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'tabs'`)
- Test: `src/components/ui/tabs/Tabs.test.tsx` (new), `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: the codemod engine.
- Produces:
  - `Tabs.List` props add `variant?: 'underline' | 'contained'` (default `'underline'`) and `fullWidth?: boolean` (default `false`), exposed as `data-variant` and `data-full-width`.
  - `Tabs.Trigger` has no `variant` prop.
  - `RULE_SETS.tabs`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/tabs/Tabs.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tabs } from '@components/ui';

afterEach(cleanup);

const renderTabs = (listProps: { variant?: 'underline' | 'contained'; fullWidth?: boolean } = {}) =>
  render(
    <Tabs defaultValue="notes">
      <Tabs.List {...listProps}>
        <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
        <Tabs.Trigger value="files">Files</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="notes">Notes body</Tabs.Content>
      <Tabs.Content value="files">Files body</Tabs.Content>
    </Tabs>,
  );

describe('Tabs', () => {
  it('defaults to underline, not full width', () => {
    renderTabs();
    const list = screen.getByRole('tablist');
    expect(list.dataset.variant).toBe('underline');
    expect(list.dataset.fullWidth).toBe('false');
  });

  it('exposes contained + fullWidth for styling', () => {
    renderTabs({ variant: 'contained', fullWidth: true });
    const list = screen.getByRole('tablist');
    expect(list.dataset.variant).toBe('contained');
    expect(list.dataset.fullWidth).toBe('true');
  });

  it('switches panels with the keyboard', () => {
    renderTabs();
    const notes = screen.getByRole('tab', { name: 'Notes' });
    notes.focus();
    fireEvent.keyDown(notes, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Files' }).getAttribute('data-state')).toBe('active');
  });
});
```

The keyboard case documents existing Radix behavior and passes before the change. The other two fail.

In `tests/design-system/codemods/migrate-props.test.ts`, append:

```ts
describe('tabs rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.tabs, 'x.tsx').output;

  it.each([
    ['<Tabs.List>', '<Tabs.List variant="contained" fullWidth>'],
    ['<Tabs.List variant="default" className="x">', '<Tabs.List variant="contained" fullWidth className="x">'],
    ['<Tabs.List variant="compact">', '<Tabs.List variant="contained">'],
    ['<Tabs.List variant="plain">', '<Tabs.List fullWidth>'],
    ['<Tabs.List variant="compactPlain">', '<Tabs.List>'],
    ['<Tabs.Trigger value="a" variant="fitContent">', '<Tabs.Trigger value="a">'],
    ['<Tabs.Trigger value="a">', '<Tabs.Trigger value="a">'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});
```

Append `'tabs'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/tabs tests/design-system`
Expected: FAIL. `data-variant` is undefined, `RULE_SETS.tabs` is undefined, and the guard lists `ui/tabs/Tabs.tsx`.

- [ ] **Step 3: Implement**

Replace `src/components/ui/tabs/Tabs.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const tabsListVariants = cva('group/tabs-list flex min-w-0 items-center overflow-x-auto', {
  variants: {
    variant: {
      underline: 'border-border-subtle gap-4 border-b',
      contained: 'bg-surface-sunken gap-1 rounded-md p-1',
    },
    fullWidth: {
      true: 'w-full',
      false: 'w-fit',
    },
  },
  defaultVariants: {
    variant: 'underline',
    fullWidth: false,
  },
});

// Triggers read the list's data attributes, so the list's variant needs no React context.
const triggerClassName = [
  'focus-ring text-fg-muted hover:text-fg inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors',
  'disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-fg [&_svg]:size-4',
  'group-data-[full-width=true]/tabs-list:flex-1',
  'group-data-[variant=underline]/tabs-list:relative group-data-[variant=underline]/tabs-list:h-9 group-data-[variant=underline]/tabs-list:px-1',
  'group-data-[variant=underline]/tabs-list:after:absolute group-data-[variant=underline]/tabs-list:after:inset-x-0 group-data-[variant=underline]/tabs-list:after:-bottom-px group-data-[variant=underline]/tabs-list:after:h-0.5',
  'group-data-[variant=underline]/tabs-list:data-[state=active]:after:bg-accent',
  'group-data-[variant=contained]/tabs-list:h-7 group-data-[variant=contained]/tabs-list:rounded-sm group-data-[variant=contained]/tabs-list:px-3',
  'group-data-[variant=contained]/tabs-list:data-[state=active]:bg-surface group-data-[variant=contained]/tabs-list:data-[state=active]:ring-border group-data-[variant=contained]/tabs-list:data-[state=active]:ring-1',
].join(' ');

type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;
type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>;
type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;
type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

type TabsComponent = FC<TabsProps> & {
  List: FC<TabsListProps>;
  Trigger: FC<TabsTriggerProps>;
  Content: FC<TabsContentProps>;
};

const List: FC<TabsListProps> = ({ className, variant, fullWidth, ...props }) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    data-variant={variant ?? 'underline'}
    data-full-width={String(fullWidth ?? false)}
    className={cn(tabsListVariants({ variant, fullWidth }), className)}
    {...props}
  />
);

const Trigger: FC<TabsTriggerProps> = ({ className, ...props }) => (
  <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn(triggerClassName, className)} {...props} />
);

const Content: FC<TabsContentProps> = ({ className, ...props }) => (
  <TabsPrimitive.Content data-slot="tabs-content" className={cn('focus-ring mt-4 rounded-sm', className)} {...props} />
);

const Tabs: TabsComponent = ({ className, ...props }) => (
  <TabsPrimitive.Root data-slot="tabs" className={cn('min-w-0', className)} {...props} />
);

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Content = Content;

export default Tabs;
```

In `scripts/design-system/codemods/rules.ts`, add the rules and register them:

```ts
const TABS_LIST: Readonly<Record<string, { variant?: 'contained'; fullWidth?: true }>> = {
  default: { variant: 'contained', fullWidth: true },
  compact: { variant: 'contained' },
  plain: { fullWidth: true },
  compactPlain: {},
};

const tabsListRule: TagRule = {
  tag: 'Tabs.List',
  keys: ['variant'],
  // A list without a variant used the old default, so it maps like `default`.
  transform: (attrs) => {
    const mapped = lookup(TABS_LIST, attrs.variant ?? 'default', 'Tabs.List variant');
    const out: Record<string, AttrValue> = {};
    if (mapped.variant) out.variant = mapped.variant;
    if (mapped.fullWidth) out.fullWidth = true;
    return out;
  },
};

const tabsTriggerRule: TagRule = {
  tag: 'Tabs.Trigger',
  keys: ['variant'],
  transform: () => ({}),
};
```

```ts
  tabs: [tabsListRule, tabsTriggerRule],
```

- [ ] **Step 4: Migrate the call sites**

Run: `P ds:migrate tabs` **exactly once**.

The rule is not idempotent. A bare `<Tabs.List>` means the *old* default and maps to `contained fullWidth`, but `compactPlain` migrates *to* a bare list. A second run would turn those into contained lists. If you need to re-run, `git checkout` the touched files first.

Expected: changes in `ComponentsGalleryPage.tsx`, `CalendarGridChrome.tsx` and `Tabs.mdx`, with 0 manual items.

Then update the `Tabs.mdx` prose:
- Remove the `text-muted-foreground` doc text classes at lines 16 and 57 (use `text-fg-muted`).
- Describe the four combinations: `underline`, `underline fullWidth`, `contained`, `contained fullWidth`.
- Remove the mention of `fitContent`.

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/tabs tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src scripts tests && \
git commit -m "feat(ui): Tabs underline/contained with fullWidth; drop trigger variant

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 8: Table (`numeric`, i18n empty state, no PrimeLoader)

**Files:**
- Modify: `src/components/ui/table/Table.tsx` (rewrite)
- Modify: `src/component-docs/ui/Table.mdx:14,99` (doc classes) and add a numeric example
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'table'`)
- Test: `src/components/ui/table/Table.test.tsx` (new)

**Interfaces:**
- Consumes: `Skeleton` (Plan A), `common.table.emptyTitle`, `common.table.emptyDescription`, `common.loading`.
- Produces:
  - `Table.Head` and `Table.Cell` accept `numeric?: boolean`, which renders `data-numeric`, end alignment and mono tabular digits. A numeric cell wraps its value in `<span dir="ltr">`.
  - `Table.Empty`'s `title`/`description` default to i18n.
  - `Table.Loader` `loaderType="spinner"` renders a spinner row.
  - `Table` `isLoading` becomes `aria-busy` instead of leaking to the DOM.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/table/Table.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Table } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('Table', () => {
  it('end-aligns numeric cells in mono and keeps their digits in LTR order', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell numeric>+962-79-555-0142</Table.Cell>
          </tr>
        </tbody>
      </table>,
    );
    const value = screen.getByText('+962-79-555-0142');
    const cell = value.closest('td')!;
    expect(cell.dataset.numeric).toBe('true');
    expect(cell.className).toContain('text-end');
    expect(cell.className).toContain('tabular-nums');
    expect(value.getAttribute('dir')).toBe('ltr');
    expect(cell.getAttribute('dir')).toBeNull();
  });

  it('marks selected rows with the accent tint', () => {
    render(
      <table>
        <tbody>
          <Table.Row data-state="selected" data-testid="row" />
        </tbody>
      </table>,
    );
    expect(screen.getByTestId('row').className).toContain('data-[state=selected]:bg-accent-subtle');
  });

  it('falls back to translated empty-state copy', () => {
    render(
      <table>
        <tbody>
          <Table.Empty when colSpan={3} />
        </tbody>
      </table>,
    );
    expect(screen.getByText('No Results Found')).toBeTruthy();
  });

  it('reports loading through aria-busy, not a stray DOM attribute', () => {
    render(<Table isLoading data-testid="table" />);
    const table = screen.getByTestId('table');
    expect(table.getAttribute('aria-busy')).toBe('true');
    expect(table.hasAttribute('isloading')).toBe(false);
  });
});
```

Append `'table'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/table tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL:
- `data-numeric` is undefined
- the selected class is `bg-primary-15`
- `aria-busy` is null
- the guard lists `ui/table/Table.tsx`, which contains `PrimeLoader` and legacy colors

The empty-copy test passes before the change, because the hard-coded English matches. It is kept as the i18n regression pin.

- [ ] **Step 3: Rewrite Table**

Replace `src/components/ui/table/Table.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Skeleton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Loader2Icon, Search } from 'lucide-react';

type TableProps = ComponentPropsWithoutRef<'table'> & {
  isLoading?: boolean;
};

type TableHeaderProps = ComponentPropsWithoutRef<'thead'>;
type TableBodyProps = ComponentPropsWithoutRef<'tbody'>;
type TableFooterProps = ComponentPropsWithoutRef<'tfoot'>;
type TableRowProps = ComponentPropsWithoutRef<'tr'>;
type TableHeadProps = ComponentPropsWithoutRef<'th'> & { numeric?: boolean };
type TableCellProps = ComponentPropsWithoutRef<'td'> & { numeric?: boolean };
type TableCaptionProps = ComponentPropsWithoutRef<'caption'>;
type TableEmptyProps = ComponentPropsWithoutRef<'tr'> & {
  colSpan?: number;
  title?: ReactNode;
  description?: ReactNode;
  when: boolean;
};
type TableLoaderProps = {
  colSpan: number;
  rows?: number;
  isLoading?: boolean;
  loaderType?: 'skeleton' | 'spinner';
};

type TableComponents = FC<TableProps> & {
  Header: FC<TableHeaderProps>;
  Body: FC<TableBodyProps>;
  Footer: FC<TableFooterProps>;
  Row: FC<TableRowProps>;
  Head: FC<TableHeadProps>;
  Cell: FC<TableCellProps>;
  Caption: FC<TableCaptionProps>;
  Empty: FC<TableEmptyProps>;
  Loader: FC<TableLoaderProps>;
};

const Header: FC<TableHeaderProps> = ({ className, ...props }) => (
  <thead data-slot="table-header" className={cn('bg-surface-sunken [&_tr]:border-border-subtle [&_tr]:border-b', className)} {...props} />
);

const Body: FC<TableBodyProps> = ({ className, ...props }) => (
  <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

const Footer: FC<TableFooterProps> = ({ className, ...props }) => (
  <tfoot data-slot="table-footer" className={cn('bg-surface-sunken text-fg border-border-subtle border-t font-medium', className)} {...props} />
);

const Row: FC<TableRowProps> = ({ className, ...props }) => (
  <tr
    data-slot="table-row"
    className={cn('border-border-subtle hover:bg-hover data-[state=selected]:bg-accent-subtle border-b transition-colors', className)}
    {...props}
  />
);

const Head: FC<TableHeadProps> = ({ className, numeric = false, ...props }) => (
  <th
    data-slot="table-head"
    data-numeric={numeric || undefined}
    className={cn(
      'text-fg-muted h-9 px-4 text-start align-middle text-xs font-medium whitespace-nowrap [&:has([role=checkbox])]:pe-0',
      numeric && 'text-end',
      className,
    )}
    {...props}
  />
);

// Numeric values keep `dir="ltr"` on an inner span so the cell itself still aligns to the table's inline end.
const Cell: FC<TableCellProps> = ({ className, numeric = false, children, ...props }) => (
  <td
    data-slot="table-cell"
    data-numeric={numeric || undefined}
    className={cn(
      'text-fg h-11 px-4 py-2 text-start align-middle text-sm [&:has([role=checkbox])]:pe-0',
      numeric && 'text-end font-mono tabular-nums',
      className,
    )}
    {...props}
  >
    <Conditional>
      <Conditional.If condition={numeric}>
        <span dir="ltr">{children}</span>
      </Conditional.If>

      <Conditional.Else>{children}</Conditional.Else>
    </Conditional>
  </td>
);

const Caption: FC<TableCaptionProps> = ({ className, ...props }) => (
  <caption data-slot="table-caption" className={cn('text-fg-muted mt-4 text-sm', className)} {...props} />
);

const Empty: FC<TableEmptyProps> = ({ className, colSpan = 1, title, description, when, ...props }) => {
  const { t } = useAppTranslation('common');

  if (!when) return null;

  return (
    <tr data-slot="table-empty" className={cn('h-full hover:bg-transparent', className)} {...props}>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="inline-flex flex-col items-center gap-2">
          <Search aria-hidden="true" strokeWidth={1.5} className="text-fg-subtle size-8" />

          <span className="text-fg text-md font-medium">{title ?? t('table.emptyTitle')}</span>

          <span className="text-fg-muted text-sm">{description ?? t('table.emptyDescription')}</span>
        </div>
      </td>
    </tr>
  );
};

const Loader: FC<TableLoaderProps> = ({ colSpan, loaderType = 'skeleton', isLoading = false, rows = 10 }) => {
  const { t } = useAppTranslation('common');

  if (!isLoading) return null;

  return (
    <Conditional>
      <Conditional.If condition={loaderType === 'spinner'}>
        <tr data-slot="table-loader">
          <td colSpan={colSpan} className="py-12 text-center">
            <Loader2Icon aria-label={t('loading')} className="text-fg-muted inline size-6 animate-spin motion-reduce:animate-none" />
          </td>
        </tr>
      </Conditional.If>

      <Conditional.Else>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <Row key={`skeleton-row-${rowIndex}`} data-slot="table-loader">
            {Array.from({ length: colSpan }, (_, colIndex) => (
              <Cell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                <Skeleton />
              </Cell>
            ))}
          </Row>
        ))}
      </Conditional.Else>
    </Conditional>
  );
};

const Table: TableComponents = ({ className, isLoading = false, ...props }) => (
  <table data-slot="table" aria-busy={isLoading || undefined} className={cn('w-full caption-bottom text-sm', className)} {...props} />
);

Table.Header = Header;
Table.Body = Body;
Table.Footer = Footer;
Table.Row = Row;
Table.Head = Head;
Table.Cell = Cell;
Table.Caption = Caption;
Table.Empty = Empty;
Table.Loader = Loader;

export default Table;
```

The only app consumer is `DataTableContent.tsx`. It passes no props that were removed, so it needs no edit; its wrapper's legacy classes are SP3.

**Table.mdx.** Replace the doc-only `border-muted-200` (lines 14 and 99) with `border-border`. Add a "Numeric columns" example:

```tsx
<Table.Row>
  <Table.Cell>Invoice INV-2026-0142</Table.Cell>
  <Table.Cell numeric>1,240.50</Table.Cell>
</Table.Row>
```

Include the matching `<Table.Head numeric>Amount</Table.Head>`.

- [ ] **Step 4: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/table tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components/ui/table src/component-docs/ui/Table.mdx tests/design-system && \
git commit -m "feat(ui): Table numeric cells, accent selection, translated empty state, no PrimeLoader

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Pagination

**Files:**
- Modify: `src/components/ui/pagination/Pagination.tsx` (rewrite)
- Modify: `src/component-docs/ui/Pagination.mdx` (doc text classes on lines 16, 45 and 74: `text-muted-foreground` → `text-fg-muted`)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'pagination'`)
- Test: `src/components/ui/pagination/Pagination.test.tsx` (new)

**Interfaces:**
- Consumes: `Button`, `IconButton`, `IconButtonProps` (Plan A), and `common.pagination.{label,previousPage,nextPage,morePages}` (Task 1).
- Produces: the same statics (`List`, `Item`, `NavButton`, `Previous`, `Next`, `Ellipsis`).
  - `NavButton` takes `ButtonProps` minus `variant`/`tone`/`size`, plus `isActive`.
  - `Previous` and `Next` take `IconButtonProps` minus `children`, with `aria-label` optional (it defaults to i18n).

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/pagination/Pagination.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Pagination, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderPagination = () =>
  render(
    <Tooltip.Provider>
      <Pagination>
        <Pagination.List>
          <Pagination.Item>
            <Pagination.Previous />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.NavButton isActive>01</Pagination.NavButton>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.NavButton>02</Pagination.NavButton>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next />
          </Pagination.Item>
        </Pagination.List>
      </Pagination>
    </Tooltip.Provider>,
  );

describe('Pagination', () => {
  it('names the landmark and the previous/next controls', () => {
    renderPagination();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeTruthy();
    expect(screen.getByText('More pages').className).toContain('sr-only');
  });

  it('marks the current page solid with aria-current and the others ghost', () => {
    renderPagination();
    const current = screen.getByRole('button', { name: '01' });
    const other = screen.getByRole('button', { name: '02' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.dataset.variant).toBe('solid');
    expect(other.getAttribute('aria-current')).toBeNull();
    expect(other.dataset.variant).toBe('ghost');
  });
});
```

Append `'pagination'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/pagination tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. The landmark name is `pagination` (lowercase), so the name `Pagination` is not found. `data-variant` is undefined, and the guard lists the file.

- [ ] **Step 3: Rewrite Pagination**

Replace `src/components/ui/pagination/Pagination.tsx` with:

```tsx
import { type ComponentProps, type FC } from 'react';

import { Button, type ButtonProps, IconButton, type IconButtonProps } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

type PaginationProps = ComponentProps<'nav'>;
type PaginationListProps = ComponentProps<'ol'>;
type PaginationItemProps = ComponentProps<'li'>;
type PaginationNavButtonProps = Omit<ButtonProps, 'variant' | 'tone' | 'size'> & { isActive?: boolean };
type PaginationStepProps = Omit<IconButtonProps, 'children' | 'aria-label'> & { 'aria-label'?: string };
type PaginationEllipsisProps = ComponentProps<'span'>;

type PaginationComponents = FC<PaginationProps> & {
  List: FC<PaginationListProps>;
  Item: FC<PaginationItemProps>;
  NavButton: FC<PaginationNavButtonProps>;
  Previous: FC<PaginationStepProps>;
  Next: FC<PaginationStepProps>;
  Ellipsis: FC<PaginationEllipsisProps>;
};

const List: FC<PaginationListProps> = ({ className, ...props }) => (
  <ol data-slot="pagination-content" className={cn('flex items-center gap-1', className)} {...props} />
);

const Item: FC<PaginationItemProps> = (props) => <li data-slot="pagination-item" {...props} />;

const NavButton: FC<PaginationNavButtonProps> = ({ className, isActive = false, ...props }) => (
  <Button
    type="button"
    data-slot="pagination-link"
    data-active={isActive}
    aria-current={isActive ? 'page' : undefined}
    variant={isActive ? 'solid' : 'ghost'}
    size="sm"
    className={cn('min-w-control-sm px-1.5 font-mono tabular-nums', className)}
    {...props}
  />
);

const Previous: FC<PaginationStepProps> = ({ 'aria-label': ariaLabel, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <IconButton data-slot="pagination-previous" size="sm" tooltip={false} aria-label={ariaLabel ?? t('pagination.previousPage')} {...props}>
      <ChevronLeftIcon className="rtl:rotate-180" />
    </IconButton>
  );
};

const Next: FC<PaginationStepProps> = ({ 'aria-label': ariaLabel, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <IconButton data-slot="pagination-next" size="sm" tooltip={false} aria-label={ariaLabel ?? t('pagination.nextPage')} {...props}>
      <ChevronRightIcon className="rtl:rotate-180" />
    </IconButton>
  );
};

const Ellipsis: FC<PaginationEllipsisProps> = ({ className, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <span data-slot="pagination-ellipsis" className={cn('text-fg-subtle flex size-7 items-center justify-center', className)} {...props}>
      <MoreHorizontalIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">{t('pagination.morePages')}</span>
    </span>
  );
};

const Pagination: PaginationComponents = ({ className, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <nav
      aria-label={t('pagination.label')}
      data-slot="pagination"
      className={cn('flex w-full items-center justify-end gap-3', className)}
      {...props}
    />
  );
};

Pagination.List = List;
Pagination.Item = Item;
Pagination.NavButton = NavButton;
Pagination.Previous = Previous;
Pagination.Next = Next;
Pagination.Ellipsis = Ellipsis;

export default Pagination;
```

Its consumer, `DataTablePagination.tsx`, passes `className="size-8.5"` to `NavButton`. That fixed size would override the 28px control and is also a non-scale size. Delete that `className` prop (lines 98-104) as part of this API migration, and leave the rest of that file to SP3.

- [ ] **Step 4: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/pagination tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components/ui/pagination src/components/tables src/component-docs/ui/Pagination.mdx tests/design-system && \
git commit -m "feat(ui): Pagination on Button/IconButton with translated labels and RTL chevrons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Accordion, Collapsible, ScrollArea, Avatar

**Files:**
- Modify: `src/components/ui/accordion/Accordion.tsx:18-47`
- Modify: `src/components/ui/scroll-area/ScrollArea.tsx:24-30`
- Modify: `src/components/ui/avatar/Avatar.tsx` (rewrite)
- Modify: Avatar call sites:
  - `src/components/shared/file-card/FileCard.tsx:336,371`
  - `src/layouts/dashboard-header/DashboardHeader.tsx:63`
  - `src/layouts/dashboard-sidebar/DashboardSidebar.tsx:147`
  - `src/component-docs/ui/Avatar.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'accordion'`, `'collapsible'`, `'scroll-area'`, `'avatar'`)
- Test: `src/components/ui/accordion/Accordion.test.tsx` (new), `src/components/ui/avatar/Avatar.test.tsx` (new)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `Avatar` `size?: 'sm' | 'md' | 'lg'` (24/32/40, default `md`), exposed as `data-size`.
  - The slot typo is fixed: `data-slot="avatar-image"`.
  - Accordion, Collapsible and ScrollArea APIs are unchanged.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/accordion/Accordion.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Accordion } from '@components/ui';

afterEach(cleanup);

describe('Accordion', () => {
  it('uses 44px triggers and hairline-separated items, and toggles', () => {
    render(
      <Accordion type="single" collapsible>
        <Accordion.Item value="a" data-testid="item">
          <Accordion.Trigger>Allergies</Accordion.Trigger>
          <Accordion.Content>Penicillin</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const trigger = screen.getByRole('button', { name: 'Allergies' });
    expect(trigger.className).toContain('min-h-11');
    expect(screen.getByTestId('item').className).toContain('border-border-subtle');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
```

Create `src/components/ui/avatar/Avatar.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Avatar } from '@components/ui';

afterEach(cleanup);

const renderAvatar = (size?: 'sm' | 'md' | 'lg') =>
  render(
    <Avatar size={size} data-testid="avatar">
      <Avatar.Image src="/missing.png" alt="" />
      <Avatar.Fallback>LH</Avatar.Fallback>
    </Avatar>,
  );

describe('Avatar', () => {
  it('defaults to md (32px)', () => {
    renderAvatar();
    const avatar = screen.getByTestId('avatar');
    expect(avatar.dataset.size).toBe('md');
    expect(avatar.className).toContain('size-8');
  });

  it('sizes sm to 24px and lg to 40px', () => {
    renderAvatar('sm');
    expect(screen.getByTestId('avatar').className).toContain('size-6');
    cleanup();
    renderAvatar('lg');
    expect(screen.getByTestId('avatar').className).toContain('size-10');
  });

  it('renders muted initials on the hover tint', async () => {
    renderAvatar();
    const fallback = await screen.findByText('LH');
    expect(fallback.className).toContain('bg-hover');
    expect(fallback.className).toContain('text-fg-muted');
  });
});
```

Append `'accordion'`, `'collapsible'`, `'scroll-area'` and `'avatar'` to `CLEAN_UI_FOLDERS`. Collapsible is already clean; listing it locks it.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/accordion src/components/ui/avatar tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. `min-h-11` is missing, `data-size` is undefined, the fallback has `bg-background`, and the guard lists the accordion, scroll-area and avatar files.

- [ ] **Step 3: Implement**

**Accordion** (`src/components/ui/accordion/Accordion.tsx`):
- Replace the Trigger's class string with:

```tsx
        'focus-ring text-fg flex min-h-11 flex-1 cursor-pointer items-center justify-between gap-2 rounded-sm py-2 text-start text-sm font-medium [&[data-state=open]>svg]:rotate-180',
```

- Replace the chevron with:

```tsx
      <ChevronDown aria-hidden="true" className="text-fg-muted duration-base size-4 shrink-0 transition-transform motion-reduce:transition-none" />
```

- Replace the Item class string with `'border-border-subtle border-b'`.
- Replace the Content's inner `div` class with `cn('text-fg-muted pb-4 text-sm', className)`.

**ScrollArea** (`src/components/ui/scroll-area/ScrollArea.tsx`):
- In `Bar`, change `'h-full w-2 border-s border-s-transparent p-px'` to `'h-full w-1.5 border-s border-s-transparent p-px'`.
- Change `'h-2 flex-col border-t border-t-transparent p-px'` to `'h-1.5 flex-col border-t border-t-transparent p-px'`.
- Change the thumb class to `'bg-border-strong relative flex-1 rounded-full'`.

**Avatar.** Replace `src/components/ui/avatar/Avatar.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactElement } from 'react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'size-6 text-2xs',
      md: 'size-8 text-xs',
      lg: 'size-10 text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type ImageProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

type FallbackProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

type AvatarProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants> & {
    children: Array<ReactElement<ImageProps, FC<ImageProps>> | ReactElement<FallbackProps, FC<FallbackProps>>>;
  };

type AvatarComponent = FC<AvatarProps> & {
  Image: FC<ImageProps>;
  Fallback: FC<FallbackProps>;
};

const Image: FC<ImageProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Image data-slot="avatar-image" className={cn('aspect-square size-full object-cover', className)} {...props} />
);

const Fallback: FC<FallbackProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn('bg-hover text-fg-muted flex size-full items-center justify-center rounded-full font-medium', className)}
    {...props}
  />
);

const Avatar: AvatarComponent = ({ className, size, ...props }) => (
  <AvatarPrimitive.Root data-slot="avatar" data-size={size ?? 'md'} className={cn(avatarVariants({ size }), className)} {...props} />
);

Avatar.Image = Image;
Avatar.Fallback = Fallback;

export default Avatar;
```

**Avatar call sites.** Change only the size; the other legacy classes are SP3:

| File:line | Old `className` part | New |
|---|---|---|
| `FileCard.tsx:336` | `size-7` | remove; add `size="sm"` |
| `FileCard.tsx:371` | `size-6` | remove; add `size="sm"` |
| `DashboardHeader.tsx:63` | `h-8 w-8` | remove; add `size="md"` |
| `DashboardSidebar.tsx:147` | `h-8 w-8` | remove; add `size="md"` |

**Avatar.mdx.** Replace the `h-8 w-8` / `h-12 w-12` examples with `size="sm" | "md" | "lg"`, replace the doc text `text-muted-foreground` with `text-fg-muted`, and add an API row for `size`.

- [ ] **Step 4: Run tests and the type check**

Run: `P exec vp test --run src/components/ui tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components src/layouts src/component-docs tests/design-system && \
git commit -m "feat(ui): quiet Accordion, 6px ScrollArea thumb, Avatar sizes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 11: Calendar

**Files:**
- Modify: `src/components/ui/calendar/Calendar.tsx`
  - imports
  - `CalendarDayButton` (lines 13-54)
  - the two dropdown `Select.Trigger`s (lines 74 and 113)
  - `Calendar` (lines 135-241)
- Modify: `src/component-docs/ui/Calendar.mdx` (describe the look and the i18n behaviour)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'calendar'`)
- Test: `src/components/ui/calendar/Calendar.test.tsx` (new)

**Interfaces:**
- Consumes: `buttonVariants` (Plan A), `useAppTranslation` (`t`, `isRTL`, `direction`), and `common.calendar.{previousMonth,nextMonth}` (Task 1).
- Produces:
  - `Calendar`'s API is unchanged (`CalendarProps`, `CalendarRange`).
  - It now defaults `locale` (`ar`/`enUS`), `dir`, nav `labels` and `numerals="latn"` from the app language. Consumers can still override each one.
  - Day buttons expose `data-today`, `data-selected-single`, `data-range-start`/`-middle`/`-end`, `data-outside` and `data-disabled`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/calendar/Calendar.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Calendar } from '@components/ui';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const OCTOBER_2026 = new Date(2026, 9, 1);

const dayButton = (day: number) =>
  screen.getAllByRole('button').find((button) => button.textContent === String(day) && button.dataset.outside !== 'true')!;

describe('Calendar', () => {
  it('marks the range ends and middle', () => {
    render(
      <Calendar
        mode="range"
        defaultMonth={OCTOBER_2026}
        selected={{ from: new Date(2026, 9, 12), to: new Date(2026, 9, 16) }}
      />,
    );
    expect(dayButton(12).dataset.rangeStart).toBe('true');
    expect(dayButton(14).dataset.rangeMiddle).toBe('true');
    expect(dayButton(16).dataset.rangeEnd).toBe('true');
  });

  it('styles range ends with the accent fill and today with a hairline ring, not a fill', () => {
    render(<Calendar mode="single" defaultMonth={OCTOBER_2026} />);
    const className = dayButton(12).className;
    expect(className).toContain('data-[range-start=true]:bg-accent');
    expect(className).toContain('data-[today=true]:ring-border-strong');
    expect(className).not.toContain('data-[today=true]:bg-');
  });

  it('translates the navigation labels and keeps Western digits in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Calendar mode="single" defaultMonth={OCTOBER_2026} />);
    expect(screen.getByRole('button', { name: 'الشهر السابق' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'الشهر التالي' })).toBeTruthy();
    const digits = screen
      .getAllByRole('gridcell')
      .map((cell) => cell.textContent)
      .join('');
    expect(digits).toMatch(/^[0-9]+$/);
  });
});
```

Append `'calendar'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/calendar tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL.
- The range test passes: the attributes already exist, and it pins them.
- The class test fails, because there is no `data-[range-start=true]:bg-accent` (the code uses `bg-primary`).
- The Arabic test fails, because the labels are DayPicker's English defaults.
- The guard lists `ui/calendar/Calendar.tsx`.

- [ ] **Step 3: Implement**

In `src/components/ui/calendar/Calendar.tsx`:

1. **Imports.** Replace the import block (lines 1-5) with:

```tsx
import { type ChangeEvent, type ComponentProps, useEffect, useRef } from 'react';
import { type DateRange, DayButton, DayPicker, type DropdownProps, getDefaultClassNames } from 'react-day-picker';
import { ar, enUS } from 'react-day-picker/locale';

import { buttonVariants, type ButtonVariants, Select } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
```

(`ChangeEvent` stays if the dropdowns use it; `vp check` flags it if not.)

2. **Day button.** Replace `CalendarDayButton` with:

```tsx
function CalendarDayButton({ className, day, modifiers, ...props }: ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isSelectedSingle = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-today={modifiers.today}
      data-selected-single={isSelectedSingle}
      data-range-start={modifiers.range_start}
      data-range-middle={modifiers.range_middle}
      data-range-end={modifiers.range_end}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      className={cn(
        'focus-ring text-fg hover:bg-hover inline-flex size-(--cell-size) cursor-pointer items-center justify-center rounded-md text-sm tabular-nums transition-colors',
        'data-[today=true]:ring-border-strong data-[today=true]:font-semibold data-[today=true]:ring-1 data-[today=true]:ring-inset',
        'data-[selected-single=true]:bg-accent data-[selected-single=true]:text-accent-fg data-[selected-single=true]:ring-0',
        'data-[range-start=true]:bg-accent data-[range-start=true]:text-accent-fg data-[range-end=true]:bg-accent data-[range-end=true]:text-accent-fg',
        'data-[range-middle=true]:text-fg data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-transparent',
        'data-[outside=true]:text-fg-subtle data-[disabled=true]:text-fg-subtle data-[disabled=true]:pointer-events-none data-[disabled=true]:line-through',
        '[&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}
```

3. **Dropdown triggers.** In both `CalendarMonthsDropdown` and `CalendarYearsDropdown`, change `<Select.Trigger className="h-8 justify-center text-xs">` to `<Select.Trigger size="sm" className="justify-center">`.

4. **Calendar.** Replace the whole `Calendar` function with:

```tsx
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  labels,
  ...props
}: CalendarProps) {
  const { t, isRTL, direction } = useAppTranslation('common');
  const defaultClassNames = getDefaultClassNames();

  const navButtonClassName = cn(buttonVariants({ variant: buttonVariant, size: 'sm' }), 'w-control-sm px-0 aria-disabled:opacity-50');

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={isRTL ? ar : enUS}
      dir={direction}
      numerals="latn"
      labels={{
        labelPrevious: () => t('calendar.previousMonth'),
        labelNext: () => t('calendar.nextMonth'),
        ...labels,
      }}
      className={cn(
        'bg-surface group/calendar p-3 [--cell-size:--spacing(8)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(isRTL ? 'ar' : 'en', { month: 'short', numberingSystem: 'latn' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-3', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(navButtonClassName, defaultClassNames.button_previous),
        button_next: cn(navButtonClassName, defaultClassNames.button_next),
        month_caption: cn('flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)', defaultClassNames.month_caption),
        dropdowns: cn('flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium', defaultClassNames.dropdowns),
        dropdown_root: cn('relative', defaultClassNames.dropdown_root),
        dropdown: cn('absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'text-fg font-semibold select-none',
          captionLayout === 'label' ? 'text-sm' : 'flex h-8 items-center gap-1 rounded-md ps-2 pe-1 text-sm [&>svg]:text-fg-muted [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn('text-fg-muted flex-1 text-xs font-normal select-none', defaultClassNames.weekday),
        week: cn('mt-1 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-(--cell-size) select-none', defaultClassNames.week_number_header),
        week_number: cn('text-fg-muted text-xs select-none', defaultClassNames.week_number),
        day: cn('group/day relative size-(--cell-size) p-0 text-center select-none', defaultClassNames.day),
        range_start: cn('bg-accent-subtle rounded-s-md', defaultClassNames.range_start),
        range_middle: cn('bg-accent-subtle', defaultClassNames.range_middle),
        range_end: cn('bg-accent-subtle rounded-e-md', defaultClassNames.range_end),
        today: defaultClassNames.today,
        outside: cn('text-fg-subtle', defaultClassNames.outside),
        disabled: cn('text-fg-subtle', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === 'left') return <ChevronLeftIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
          if (orientation === 'right') return <ChevronRightIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
          return <ChevronDownIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => (
          <td {...weekProps}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
          </td>
        ),
        MonthsDropdown: CalendarMonthsDropdown,
        YearsDropdown: CalendarYearsDropdown,
        ...components,
      }}
      {...props}
    />
  );
}
```

Before replacing, check the current file's `components` map after `WeekNumber`. If it registers the dropdowns under different keys than `MonthsDropdown`/`YearsDropdown`, keep the existing keys. The `{...props}` spread comes last, so a consumer's own `locale`, `dir` or `numerals` still wins.

**Calendar.mdx.**
- Describe today (hairline ring), selected and range ends (accent), the range middle (accent tint), outside days (subtle), and disabled days (struck through).
- Note that the navigation labels, locale and direction follow the app language, while digits stay Western.

- [ ] **Step 4: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/calendar tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src/components/ui/calendar src/component-docs/ui/Calendar.mdx tests/design-system && \
git commit -m "feat(ui): Calendar 32px cells, hairline today, accent range, localized nav with Western digits

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 12: Event grids, `CalendarEvent` block, calendar views (user direction)

The user flagged the calendar look during Plan B. In the CalendarTimeGrid docs, "Patient A" rendered white on light grey because event visuals came only from legacy-colored doc templates, and today was a filled pink circle. This task gives the grids the approved look (`date-family.html` mockup):
- quiet `border-subtle` grid lines
- today's header in accent text
- events as soft tone tints with a status dot and `text-fg`, with no side stripe
- the "now" line in accent

It also adds a small `CalendarEvent` block so templates can't drift again.

**Files:**
- Create: `src/components/ui/calendar-event/CalendarEvent.tsx`, `src/components/ui/calendar-event/index.ts`
- Modify: `src/components/ui/index.ts` (export `./calendar-event` after `./calendar-month-grid`)
- Modify: `src/components/ui/calendar-month-grid/CalendarMonthGrid.tsx:33,42,66,70-75,89-92,103`
- Modify: `src/components/ui/calendar-time-grid/CalendarTimeGrid.tsx:54,63,68,71-74,84,89-90,100,110-115,130,134`
- Modify: legacy tokens in `src/components/calendar/calendar-grid/**`:
  - `CalendarGrid.tsx:328,345`
  - `CalendarGridChrome.tsx:28,41-48,126,128`
  - `CalendarGridMonthView.tsx:113`
  - `CalendarGridTimeView.tsx:322,331,365,378,383`
- Modify: the event templates and legends in `src/component-docs/calendar/CalendarGrid.mdx`, `src/component-docs/ui/CalendarTimeGrid.mdx` and `src/component-docs/ui/CalendarMonthGrid.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'calendar-month-grid'`, `'calendar-time-grid'`, `'calendar-event'`; new assertion for `src/components/calendar/`)
- Test: `src/components/ui/calendar-event/CalendarEvent.test.tsx`, `src/components/ui/calendar-time-grid/CalendarTimeGrid.test.tsx` (new)

**Interfaces:**
- Consumes: the `-subtle` status tints (SP1, with contrast tests from Plan A Task 1).
- Produces:
  - `CalendarEvent: FC<CalendarEventProps>`, where `CalendarEventProps = ComponentPropsWithoutRef<'div'> & { tone?: 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'; past?: boolean }`. It renders `data-slot="calendar-event"` and `data-tone`.
  - The grid APIs are unchanged. `EventCard` positions with `inset-inline-start` instead of `left`, so the same `left` percentage mirrors in RTL.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/calendar-event/CalendarEvent.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarEvent } from '@components/ui';

afterEach(cleanup);

describe('CalendarEvent', () => {
  it('is a soft tone tint with a status dot and readable text, never a side stripe', () => {
    render(<CalendarEvent tone="danger">11:30 · Patient B</CalendarEvent>);
    const block = screen.getByText('11:30 · Patient B').closest('[data-slot="calendar-event"]') as HTMLElement;
    expect(block.dataset.tone).toBe('danger');
    expect(block.className).toContain('bg-danger-subtle');
    expect(block.className).toContain('text-fg');
    expect(block.className).not.toMatch(/border-s/);
    expect(block.querySelector('[aria-hidden="true"]')?.className).toContain('bg-danger');
  });

  it('defaults to the neutral tone and mutes past events', () => {
    render(<CalendarEvent past>09:00 · Patient A</CalendarEvent>);
    const block = screen.getByText('09:00 · Patient A').closest('[data-slot="calendar-event"]') as HTMLElement;
    expect(block.dataset.tone).toBe('neutral');
    expect(block.dataset.past).toBe('true');
  });
});
```

Create `src/components/ui/calendar-time-grid/CalendarTimeGrid.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarTimeGrid } from '@components/ui';

afterEach(cleanup);

describe('CalendarTimeGrid', () => {
  it('positions events with inset-inline-start so they mirror in RTL', () => {
    render(
      <CalendarTimeGrid.EventCard top={10} height={20} left={25} width={50}>
        Visit
      </CalendarTimeGrid.EventCard>,
    );
    const card = screen.getByRole('button', { name: 'Visit' });
    expect(card.style.insetInlineStart).toBe('25%');
    expect(card.style.left).toBe('');
  });

  it("marks today's header with accent text, not a filled circle", () => {
    render(<CalendarTimeGrid.Header dayName="Mon" dayNumber={28} isToday />);
    const number = screen.getByText('28');
    expect(number.className).toContain('text-accent');
    expect(number.className).not.toMatch(/\bbg-/);
  });

  it('draws the now line in accent', () => {
    render(<CalendarTimeGrid.NowLine percent={40} mode="always" data-testid="now" />);
    expect(screen.getByTestId('now').className).toContain('bg-accent');
  });
});
```

In `tests/design-system/forbidden-patterns.test.ts`:
- Append `'calendar-month-grid'`, `'calendar-time-grid'` and `'calendar-event'` to `CLEAN_UI_FOLDERS`.
- Add inside `describe('clean primitives', …)`:

```ts
  it('calendar views (user direction, Plan B) contain no forbidden patterns', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/calendar/'));
    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/calendar-event src/components/ui/calendar-time-grid tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL:
- `CalendarEvent` is not exported
- `insetInlineStart` is `''`
- the today number has `bg-primary-400`
- the now line is `bg-destructive`
- both guards list files

- [ ] **Step 3: Create CalendarEvent**

`src/components/ui/calendar-event/CalendarEvent.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type CalendarEventTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

/** Soft tint + status dot (addendum §10). Text stays `fg` on every tone; tone is never a side stripe. */
const calendarEventVariants = cva(
  'text-fg flex size-full min-w-0 items-start gap-1.5 overflow-hidden rounded-md px-1.5 py-1 text-start text-xs leading-tight',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-sunken',
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
  },
);

const DOT: Record<CalendarEventTone, string> = {
  neutral: 'bg-fg-muted',
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export type CalendarEventProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof calendarEventVariants> & {
    /** Mutes an event that has already ended. */
    past?: boolean;
  };

const CalendarEvent: FC<CalendarEventProps> = ({ className, tone, past = false, children, ...props }) => {
  const resolvedTone = tone ?? 'neutral';

  return (
    <div
      data-slot="calendar-event"
      data-tone={resolvedTone}
      data-past={past || undefined}
      className={cn(calendarEventVariants({ tone: resolvedTone }), past && 'text-fg-muted', className)}
      {...props}
    >
      <span aria-hidden="true" className={cn('mt-1 size-1.5 shrink-0 rounded-full', DOT[resolvedTone])} />

      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
};

export default CalendarEvent;
```

`src/components/ui/calendar-event/index.ts`:

```ts
export { default as CalendarEvent } from './CalendarEvent';
export type { CalendarEventProps } from './CalendarEvent';
```

Add `export * from './calendar-event';` to `src/components/ui/index.ts` right after the `./calendar-month-grid` line.

- [ ] **Step 4: Restyle the grids**

**`CalendarMonthGrid.tsx`:**

| Line | Old | New |
|---|---|---|
| 33 | `'border-muted-200 bg-muted-50 grid grid-cols-7 border-b'` | `'border-border-subtle bg-surface grid grid-cols-7 border-b'` |
| 42 | `'text-muted-foreground border-muted-200 border-e border-t py-2 text-center text-sm font-semibold last:border-e-0'` | `'text-fg-muted border-border-subtle border-e py-2 text-center text-xs font-medium last:border-e-0'` |
| 66 | `'border-muted-200 flex min-h-25 …'`, `!available && 'bg-muted-100'` | `'border-border-subtle flex min-h-25 flex-col overflow-hidden border-e border-b p-1'`, `!available && 'bg-surface-sunken'` |
| 71 | `'mb-1 flex size-7 items-center justify-center rounded-full text-xs'` | `'mb-1 flex size-6 items-center justify-center rounded-md text-xs tabular-nums'` |
| 72 | `isToday && 'bg-primary-400 text-primary-foreground font-bold'` | `isToday && 'text-accent font-semibold'` |
| 73 | `… 'text-foreground'` | `… 'text-fg'` |
| 74 | `… 'text-muted-400'` | `… 'text-fg-subtle'` |
| 90-91 | `'ring-offset-background block w-full cursor-pointer overflow-hidden rounded-md'`, `'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'` | `'focus-ring block w-full cursor-pointer overflow-hidden rounded-md text-start'` (one string) |
| 103 | `'[scrollbar-color:var(--color-muted-200)_transparent] [scrollbar-width:thin]'` | `'[scrollbar-color:var(--color-border-strong)_transparent] [scrollbar-width:thin]'` |

**`CalendarTimeGrid.tsx`:**

| Line | Old | New |
|---|---|---|
| 54 | `'bg-muted-50 border-muted-200 w-16 …'` | `'bg-surface border-border-subtle w-16 shrink-0 border-y border-e'` |
| 63 | `'border-muted-200 bg-muted-50 flex flex-1 …'` | `'border-border-subtle bg-surface flex flex-1 items-center justify-center gap-1.5 border-y border-e px-2 py-2 last:border-e-0'` |
| 68 | `<span className="text-muted-foreground text-sm font-semibold">` | `<span className={cn('text-xs font-medium uppercase', isToday ? 'text-accent' : 'text-fg-muted')}>` |
| 72 | `'flex size-7 items-center justify-center rounded-full text-sm'` | `'flex size-7 items-center justify-center text-sm tabular-nums'` |
| 73 | `isToday ? 'bg-primary-400 text-primary-foreground font-bold' : 'text-foreground'` | `isToday ? 'text-accent font-semibold' : 'text-fg'` |
| 84 | `'border-muted-200 bg-muted-50 grid …'` | `'border-border-subtle bg-surface grid w-16 shrink-0 border-e'` |
| 89 | `"border-muted-200 flex …"` | `"border-border-subtle flex items-start justify-end pe-2 pt-0.5 not-last:border-b"` |
| 90 | `"text-foreground text-2xs"` | `"text-fg-muted text-2xs tabular-nums"` |
| 100 | `'border-muted-200 …', available ? 'bg-background' : 'bg-muted-100'` | `'border-border-subtle border-b last:border-b-0', available ? 'bg-surface' : 'bg-surface-sunken'` |
| 111-112 | `'ring-offset-background absolute z-20 …'`, `'focus-visible:ring-ring …'` | `'focus-ring absolute z-20 flex cursor-pointer overflow-hidden rounded-md p-0.5 text-start'` (one string) |
| 115 | `left: \`${left}%\`` | `insetInlineStart: \`${left}%\`` |
| 130 | `'bg-destructive pointer-events-none …'` | `'bg-accent pointer-events-none absolute inset-x-0 z-30 h-px'` |
| 134 | `"bg-destructive absolute -inset-s-1 …"` | `"bg-accent absolute -inset-s-1 -inset-bs-1 size-2 rounded-full"` |

Note on line 68: in the Header, the `isToday` prop is already destructured, so using it for the day name is fine.

**Calendar views** (`src/components/calendar/calendar-grid/**`). Replace the tokens only; the structure and strings are SP3:

| Old token | New token |
|---|---|
| `border-muted-200` | `border-border-subtle` (or `border-border` on outer containers: `CalendarGrid.tsx:328,345`) |
| `bg-background` | `bg-surface` |
| `bg-muted-50` | `bg-surface` |
| `bg-muted-100` | `bg-surface-sunken` |
| `text-foreground` | `text-fg` |
| `text-muted-foreground`, `text-muted-400` | `text-fg-muted` |
| `var(--color-muted-200)` | `var(--color-border-strong)` |
| `var(--color-muted-50)` | `var(--color-surface)` |

Two more edits in these files:
- In `CalendarGridChrome.tsx:41-48`, add `rtl:rotate-180` to both chevron icons, so previous and next point the right way in Arabic.
- In `CalendarGridMonthView.tsx:113`, the overflow popover's `className` becomes `"w-60 p-2"`, because Popover now supplies the raised surface.

**Docs templates.** In all three MDX files:
- Import `CalendarEvent` from `@components/ui`.
- Replace each event template body with a `CalendarEvent`. For example, in `CalendarGrid.mdx`:

```jsx
export const TONES = { initial: 'info', 're-eval': 'accent', deposition: 'danger' };
```

```jsx
<CalendarGrid.EventTemplate>
  {(event, status) => (
    <CalendarEvent tone={TONES[event.type]} past={status === 'past'}>
      {formatTime(event.start)} · {event.patient}
    </CalendarEvent>
  )}
</CalendarGrid.EventTemplate>
```

- Wherever the popover template or the second template reads `tone.dotClass`, use `<span className={cn('size-1.5 rounded-full', { info: 'bg-info', accent: 'bg-accent', danger: 'bg-danger' }[TONES[event.type]])} />`.
- Change the legend items to:

```jsx
{ label: 'Available', colorClass: 'bg-surface' },
{ label: 'Not Available', colorClass: 'bg-surface-sunken' },
{ label: 'Initial Evaluation', colorClass: 'bg-info-subtle' },
{ label: 'Re Evaluation', colorClass: 'bg-accent-subtle' },
{ label: 'Deposition', colorClass: 'bg-danger-subtle' },
```

- In `CalendarTimeGrid.mdx` and `CalendarMonthGrid.mdx`, replace each `EventCard`/`EventChip` child's hand-colored `div` with `<CalendarEvent tone="…">…</CalendarEvent>`. Use `neutral` for an "Available"/unclassified event and `accent` for a highlighted one, so no doc example uses white or legacy-colored text.
- Replace other `*-muted-*`/`bg-background`/`primary-*` classes in these three MDX files with the token table above.
- Add a "CalendarEvent" section to `CalendarTimeGrid.mdx` that shows all six tones.

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run src/components/ui tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 6: Look at it**

Start `P exec vp dev --open false --port 3123` in the background and open `/components/calendar-time-grid` and `/components/calendar-grid` in dark and light (`playwright-cli`).

Check each of these:
- no white-on-grey text
- today's header is accent text
- the now line is accent
- events are soft tints with a dot

Save screenshots to `.superpowers/screens/sp2b-calendar-*.png`. Stop the server afterwards (`pkill -f "vp dev --open false --port 3123"`).

- [ ] **Step 7: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests/design-system && \
git commit -m "feat(ui): calendar grids with quiet lines, accent today and now line, CalendarEvent tint blocks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 13: TimePicker (field shape, listbox columns, ScrollSelector removed)

**Files:**
- Create: `src/components/ui/time-picker/timeColumns.ts`
- Modify: `src/components/ui/time-picker/TimePicker.tsx` (rewrite), `src/components/ui/time-picker/index.ts`
- Modify: `src/components/forms/form-time-picker/FormTimePicker.tsx:62-72` (`error` → `invalid`, drop the legacy error classes)
- Delete: `src/components/ui/scroll-selector/`, `src/component-docs/ui/ScrollSelector.mdx`
- Modify: `src/components/ui/index.ts` (delete line 33 `export * from './scroll-selector';`)
- Modify: `src/component-docs/ui/TimePicker.mdx` (add an API table)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'time-picker'`)
- Test: `tests/ui/timeColumns.test.ts` (new), `src/components/ui/time-picker/TimePicker.test.tsx` (new)

**Interfaces:**
- Consumes: `fieldVariants`, `FieldVariants`, `IconButton`, `Button`, `Popover` (Plan A / Task 1), and `common.timePicker.*`, `common.clear`, `common.confirm`.
- Produces:
  - `timeColumns.ts`: `parseTime`, `formatTime`, `availableTimes`, `nearestTime`, `buildTimeColumns`, `selectHour`, `selectMinute`, `selectPeriod`, `TimePeriod`, `TimeOption`, `TimeColumns`.
  - `TimePickerProps`:
    - drops `error`
    - adds `invalid?: boolean`, `size?: 'sm' | 'md' | 'lg'` and `id?: string`
    - `placeholder` defaults to i18n
  - `TimePicker.Content` keeps its props (`value`, `tempValue`, `onTempValueChange`, `onConfirm`, `use24hFormat`, `min`, `max`, `step`), because `TimeFilter` uses it directly.
  - `TimePicker.Trigger` props: `FieldVariants & { invalid?; placeholder?; displayValue? }` plus button props.

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/timeColumns.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import {
  availableTimes,
  buildTimeColumns,
  formatTime,
  nearestTime,
  parseTime,
  selectHour,
  selectMinute,
  selectPeriod,
} from '../../src/components/ui/time-picker/timeColumns';

describe('parseTime / formatTime', () => {
  it.each([
    ['10:30', 630],
    ['00:05', 5],
    ['12:30 AM', 30],
    ['12:30 PM', 750],
    ['01:00 pm', 780],
  ])('parses %s as %i minutes', (input, minutes) => {
    expect(parseTime(input)).toBe(minutes);
  });

  it.each(['', '24:00', '13:00 PM', '9', 'noon'])('rejects %j', (input) => {
    expect(parseTime(input)).toBeNull();
  });

  it('formats 24h and 12h values', () => {
    expect(formatTime(630, true)).toBe('10:30');
    expect(formatTime(0, false)).toBe('12:00 AM');
    expect(formatTime(750, false)).toBe('12:30 PM');
  });
});

describe('availableTimes', () => {
  it('includes max', () => {
    expect(availableTimes('09:00', '10:00', 30)).toEqual([540, 570, 600]);
  });

  it('anchors the step grid at min', () => {
    expect(availableTimes('09:10', '10:00', 25)).toEqual([550, 575]);
  });
});

describe('buildTimeColumns', () => {
  const allDay = availableTimes('00:00', '23:59', 30);

  it('lists 00–23 in 24h mode', () => {
    const { hours, periods } = buildTimeColumns(allDay, 630, true);
    expect(hours.map((hour) => hour.label)).toEqual(Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')));
    expect(periods).toEqual([]);
  });

  it('lists 12, 01 … 11 for the selected period in 12h mode', () => {
    const { hours, periods } = buildTimeColumns(allDay, 630, false);
    expect(hours.map((hour) => hour.label)).toEqual(['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
    expect(hours[0].value).toBe(0);
    expect(periods).toEqual(['AM', 'PM']);
  });

  it('offers only the periods inside the range', () => {
    expect(buildTimeColumns(availableTimes('13:00', '18:00', 60), 780, false).periods).toEqual(['PM']);
  });

  it("lists the selected hour's minutes", () => {
    expect(buildTimeColumns(allDay, 630, true).minutes.map((minute) => minute.label)).toEqual(['00', '30']);
  });
});

describe('selection', () => {
  const quarterHours = availableTimes('09:15', '17:00', 15);

  it('keeps the minute when the new hour has it', () => {
    expect(selectHour(quarterHours, 9 * 60 + 30, 11)).toBe(11 * 60 + 30);
  });

  it("falls back to the hour's first minute otherwise", () => {
    expect(selectHour(quarterHours, 10 * 60, 9)).toBe(9 * 60 + 15);
  });

  it('ignores a minute the hour does not offer', () => {
    expect(selectMinute(quarterHours, 9 * 60 + 15, 0)).toBe(9 * 60 + 15);
  });

  it('moves between periods by twelve hours when possible', () => {
    const allDay = availableTimes('00:00', '23:59', 30);
    expect(selectPeriod(allDay, 9 * 60 + 30, 'PM')).toBe(21 * 60 + 30);
    expect(selectPeriod(allDay, 21 * 60 + 30, 'AM')).toBe(9 * 60 + 30);
  });

  it('nearestTime snaps an off-grid value to the closest slot', () => {
    expect(nearestTime(quarterHours, 9 * 60 + 20)).toBe(9 * 60 + 15);
    expect(nearestTime(quarterHours, null)).toBe(9 * 60 + 15);
    expect(nearestTime([], 10)).toBeNull();
  });
});
```

Create `src/components/ui/time-picker/TimePicker.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TimePicker, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderPicker = (props: Partial<Parameters<typeof TimePicker>[0]> = {}) =>
  render(
    <Tooltip.Provider>
      <TimePicker name="time" {...props} />
    </Tooltip.Provider>,
  );

describe('TimePicker', () => {
  it('emits "10:30" after picking 10 and 30 in 24h mode', async () => {
    const handleChange = vi.fn();
    renderPicker({ use24hFormat: true, onChange: handleChange });
    fireEvent.click(screen.getByRole('button', { name: /Select time/ }));
    fireEvent.click(within(await screen.findByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '10' }));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: '30' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(handleChange).toHaveBeenCalledWith('10:30');
  });

  it('marks the chosen option selected', async () => {
    renderPicker({ use24hFormat: true, value: '14:45', step: 15 });
    fireEvent.click(screen.getByRole('button', { name: /14:45/ }));
    const hours = await screen.findByRole('listbox', { name: 'Hours' });
    expect(within(hours).getByRole('option', { name: '14' }).getAttribute('aria-selected')).toBe('true');
  });

  it('has the same field shape and height as Input, and exposes invalid', () => {
    renderPicker({ invalid: true });
    const trigger = screen.getByRole('button', { name: /Select time/ });
    expect(trigger.className).toContain('h-control-md');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });

  it('renders the clear control outside the trigger with a translated name', () => {
    const handleChange = vi.fn();
    renderPicker({ value: '09:00', use24hFormat: true, onChange: handleChange });
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(screen.getByRole('button', { name: /09:00/ }).contains(clear)).toBe(false);
    fireEvent.click(clear);
    expect(handleChange).toHaveBeenCalledWith(undefined);
  });
});
```

Append `'time-picker'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run tests/ui src/components/ui/time-picker tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL:
- `timeColumns` cannot be resolved
- there is no listbox named "Hours"
- the trigger lacks `h-control-md` (it is `h-12`)
- the clear control is nested in the trigger and named "Clear" only by a hard-coded English label

- [ ] **Step 3: Create the column helpers**

`src/components/ui/time-picker/timeColumns.ts`:

```ts
/** Pure helpers behind the TimePicker columns. Times are minutes since midnight. */

export type TimePeriod = 'AM' | 'PM';

export type TimeOption = { label: string; value: number };

export type TimeColumns = { hours: TimeOption[]; minutes: TimeOption[]; periods: TimePeriod[] };

const MINUTES_PER_DAY = 24 * 60;
const NOON = 12 * 60;

const pad = (value: number) => value.toString().padStart(2, '0');

const hourOf = (time: number) => Math.floor(time / 60);

/** Parses "HH:MM" (24h) or "hh:MM AM|PM" (12h). Returns null for anything else. */
export function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;

  const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(value.trim());
  if (!match) return null;

  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  let hours = Number(match[1]);

  if (minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === 'PM' ? 12 : 0);
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

export function formatTime(time: number, use24h: boolean): string {
  const hours = hourOf(time);
  const minutes = time % 60;

  if (use24h) return `${pad(hours)}:${pad(minutes)}`;

  return `${pad(hours % 12 === 0 ? 12 : hours % 12)}:${pad(minutes)} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** Every selectable time from min to max inclusive, on a step grid anchored at min. */
export function availableTimes(min: string, max: string, step: number): number[] {
  const start = parseTime(min) ?? 0;
  const end = parseTime(max) ?? MINUTES_PER_DAY - 1;
  const increment = Math.max(1, Math.floor(step));

  const times: number[] = [];
  for (let time = start; time <= end; time += increment) times.push(time);

  return times;
}

/** The available time closest to target (earlier wins ties); the first slot when target is null. */
export function nearestTime(available: number[], target: number | null): number | null {
  if (available.length === 0) return null;
  if (target === null) return available[0];

  return available.reduce((best, time) => (Math.abs(time - target) < Math.abs(best - target) ? time : best), available[0]);
}

export function buildTimeColumns(available: number[], selected: number, use24h: boolean): TimeColumns {
  const selectedHour = hourOf(selected);
  const isPm = selectedHour >= 12;
  const allHours = [...new Set(available.map(hourOf))];

  // In 12h mode the hour column shows only the selected period; ascending 0…11 renders as 12, 01 … 11.
  const visibleHours = use24h ? allHours : allHours.filter((hour) => hour >= 12 === isPm);

  const hours = visibleHours.map((hour) => ({
    value: hour,
    label: use24h ? pad(hour) : pad(hour % 12 === 0 ? 12 : hour % 12),
  }));

  const minutes = available.filter((time) => hourOf(time) === selectedHour).map((time) => ({ value: time % 60, label: pad(time % 60) }));

  const periods: TimePeriod[] = use24h
    ? []
    : (['AM', 'PM'] as const).filter((period) => allHours.some((hour) => hour >= 12 === (period === 'PM')));

  return { hours, minutes, periods };
}

/** Moves to `hour`, keeping the minute when that hour offers it. */
export function selectHour(available: number[], selected: number, hour: number): number {
  const sameMinute = hour * 60 + (selected % 60);
  if (available.includes(sameMinute)) return sameMinute;

  return available.find((time) => hourOf(time) === hour) ?? selected;
}

export function selectMinute(available: number[], selected: number, minute: number): number {
  const candidate = hourOf(selected) * 60 + minute;

  return available.includes(candidate) ? candidate : selected;
}

/** Shifts by twelve hours into `period`, or to the nearest slot inside it. */
export function selectPeriod(available: number[], selected: number, period: TimePeriod): number {
  const wantsPm = period === 'PM';
  if (selected >= NOON === wantsPm) return selected;

  const shifted = selected + (wantsPm ? NOON : -NOON);
  if (available.includes(shifted)) return shifted;

  return nearestTime(available.filter((time) => time >= NOON === wantsPm), shifted) ?? selected;
}
```

- [ ] **Step 4: Rewrite TimePicker**

Replace `src/components/ui/time-picker/TimePicker.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type ComponentPropsWithRef, type FC, forwardRef, useEffect, useMemo, useState } from 'react';

import { Button, fieldVariants, type FieldVariants, IconButton, Popover } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation, useDebounce } from '@hooks/shared';

import { cn } from '@utils';

import { Clock4Icon, XIcon } from 'lucide-react';

import {
  availableTimes,
  buildTimeColumns,
  formatTime,
  nearestTime,
  parseTime,
  selectHour,
  selectMinute,
  selectPeriod,
  type TimePeriod,
} from './timeColumns';

export type TimePickerClearProps = {
  onClear?: () => void;
  disabled?: boolean;
  hasValue?: boolean;
};

export type TimePickerTriggerProps = Omit<ComponentPropsWithRef<'button'>, 'value'> &
  FieldVariants & {
    invalid?: boolean;
    placeholder?: string;
    displayValue?: string | null;
  };

export type TimePickerContentProps = ComponentPropsWithoutRef<typeof Popover.Content> & {
  /** Accepted for compatibility (TimeFilter passes it); the columns follow `tempValue`. */
  value?: string | null;
  tempValue: string;
  onTempValueChange: (value: string) => void;
  onConfirm: () => void;
  use24hFormat?: boolean;
  min?: string;
  max?: string;
  step?: number;
};

export type TimePickerRootProps = ComponentPropsWithoutRef<typeof Popover>;

export type TimePickerProps = FieldVariants & {
  name: string;
  id?: string;
  value?: string | null;
  onChange?: (value?: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  clearButton?: boolean;
  use24hFormat?: boolean;
  min?: string;
  max?: string;
  step?: number;
  startAt?: string;
  invalid?: boolean;
};

type TimeColumnProps<TValue extends number | string> = {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  selected: TValue;
  onSelect: (value: TValue) => void;
};

const scrollSelectedIntoView = (node: HTMLButtonElement | null) => node?.scrollIntoView?.({ block: 'nearest' });

function TimeColumn<TValue extends number | string>({ label, options, selected, onSelect }: TimeColumnProps<TValue>) {
  return (
    <div
      role="listbox"
      aria-label={label}
      data-slot="time-picker-column"
      className="flex max-h-48 w-12 flex-col gap-0.5 overflow-y-auto font-mono text-sm [scrollbar-width:thin]"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={option.value === selected}
          ref={option.value === selected ? scrollSelectedIntoView : undefined}
          className={cn(
            'focus-ring text-fg-muted hover:bg-hover hover:text-fg h-7 shrink-0 cursor-pointer rounded-md tabular-nums transition-colors',
            'aria-selected:bg-accent aria-selected:text-accent-fg aria-selected:hover:bg-accent aria-selected:hover:text-accent-fg',
          )}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const TimePickerClear: FC<TimePickerClearProps> = ({ onClear, disabled, hasValue }) => {
  const { t } = useAppTranslation('common');

  if (!hasValue || !onClear || disabled) return null;

  return (
    <IconButton
      data-slot="time-picker-clear"
      size="sm"
      tooltip={false}
      aria-label={t('clear')}
      className="absolute inset-y-0 end-1 my-auto"
      onClick={onClear}
    >
      <XIcon />
    </IconButton>
  );
};

const TimePickerTrigger = forwardRef<HTMLButtonElement, TimePickerTriggerProps>(
  ({ className, size, invalid, placeholder, displayValue, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      data-slot="time-picker-trigger"
      aria-invalid={invalid || undefined}
      className={cn(fieldVariants({ size }), 'group cursor-pointer gap-2 text-start', className)}
      {...props}
    >
      <Clock4Icon aria-hidden="true" className="text-fg-muted group-data-[state=open]:text-accent size-4 shrink-0" />

      <Conditional>
        <Conditional.If condition={!!displayValue}>
          <span className="text-fg min-w-0 flex-1 truncate font-mono tabular-nums">
            <bdi dir="ltr">{displayValue}</bdi>
          </span>
        </Conditional.If>

        <Conditional.Else>
          <span className="text-fg-muted min-w-0 flex-1 truncate">{placeholder}</span>
        </Conditional.Else>
      </Conditional>
    </button>
  ),
);

const TimePickerContent: FC<TimePickerContentProps> = ({
  className,
  value: _value,
  tempValue,
  onTempValueChange,
  onConfirm,
  use24hFormat = false,
  min = '00:00',
  max = '23:59',
  step = 1,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const available = useMemo(() => availableTimes(min, max, step), [min, max, step]);
  const selected = nearestTime(available, parseTime(tempValue));

  const handleSelect = (next: number) => onTempValueChange(formatTime(next, use24hFormat));

  return (
    <Popover.Content data-slot="time-picker-content" side="bottom" align="start" className={cn('w-fit p-2', className)} {...props}>
      <Conditional.If condition={selected !== null}>
        <TimePickerColumns
          available={available}
          selected={selected ?? 0}
          use24hFormat={use24hFormat}
          labels={{ hours: t('timePicker.hours'), minutes: t('timePicker.minutes'), period: t('timePicker.period') }}
          onSelect={handleSelect}
        />
      </Conditional.If>

      <div className="border-border-subtle mt-2 flex justify-end border-t pt-2">
        <Button size="sm" tone="accent" onClick={onConfirm}>
          {t('confirm')}
        </Button>
      </div>
    </Popover.Content>
  );
};

type TimePickerColumnsProps = {
  available: number[];
  selected: number;
  use24hFormat: boolean;
  labels: { hours: string; minutes: string; period: string };
  onSelect: (time: number) => void;
};

const TimePickerColumns: FC<TimePickerColumnsProps> = ({ available, selected, use24hFormat, labels, onSelect }) => {
  const columns = buildTimeColumns(available, selected, use24hFormat);
  const periodOptions = columns.periods.map((period) => ({ label: period, value: period }));

  return (
    <div className="flex gap-1">
      <TimeColumn
        label={labels.hours}
        options={columns.hours}
        selected={Math.floor(selected / 60)}
        onSelect={(hour) => onSelect(selectHour(available, selected, hour))}
      />

      <TimeColumn
        label={labels.minutes}
        options={columns.minutes}
        selected={selected % 60}
        onSelect={(minute) => onSelect(selectMinute(available, selected, minute))}
      />

      <Conditional.If condition={!use24hFormat}>
        <TimeColumn<TimePeriod>
          label={labels.period}
          options={periodOptions}
          selected={selected >= 12 * 60 ? 'PM' : 'AM'}
          onSelect={(period) => onSelect(selectPeriod(available, selected, period))}
        />
      </Conditional.If>
    </div>
  );
};

const TimePickerRoot: FC<TimePickerRootProps> = ({ children, ...props }) => (
  <Popover data-slot="time-picker-root" modal {...props}>
    {children}
  </Popover>
);

type TimePickerComponent = FC<TimePickerProps> & {
  Root: typeof TimePickerRoot;
  Trigger: typeof TimePickerTrigger;
  Content: typeof TimePickerContent;
  Clear: typeof TimePickerClear;
};

const TimePicker: TimePickerComponent = ({
  name,
  id,
  className,
  disabled,
  placeholder,
  clearButton = true,
  min = '00:00',
  startAt,
  max = '23:59',
  step = 1,
  use24hFormat = false,
  size,
  value,
  onChange,
  invalid = false,
}) => {
  const { t } = useAppTranslation('common');

  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const display = useDebounce(tempValue || value, 200);

  const available = useMemo(() => availableTimes(min, max, step), [min, max, step]);

  useEffect(() => {
    if (!isOpen) {
      setTempValue('');
      return;
    }

    // Seed on the step grid in the picker's own format, so confirming untouched never emits a 12h string in 24h mode.
    const seed = nearestTime(available, parseTime(value) ?? parseTime(startAt) ?? parseTime(use24hFormat ? '08:00' : '08:00 AM'));
    setTempValue(seed === null ? '' : formatTime(seed, use24hFormat));
  }, [isOpen, value, startAt, available, use24hFormat]);

  const handleConfirm = () => {
    onChange?.(tempValue || undefined);
    setIsOpen(false);
  };

  const handleClear = () => onChange?.(undefined);

  const showClear = clearButton && !!value && !disabled;

  return (
    <div data-slot="time-picker" className="relative w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <Popover.Trigger id={id ?? name} asChild>
          <TimePickerTrigger
            size={size}
            invalid={invalid}
            disabled={disabled}
            placeholder={placeholder ?? t('timePicker.placeholder')}
            displayValue={display}
            className={cn(showClear && 'pe-9', className)}
          />
        </Popover.Trigger>

        <TimePickerContent
          tempValue={tempValue}
          onTempValueChange={setTempValue}
          onConfirm={handleConfirm}
          use24hFormat={use24hFormat}
          min={min}
          max={max}
          step={step}
        />
      </Popover>

      <Conditional.If condition={clearButton}>
        <TimePickerClear onClear={handleClear} disabled={disabled} hasValue={!!value} />
      </Conditional.If>
    </div>
  );
};

TimePicker.Root = TimePickerRoot;
TimePicker.Trigger = TimePickerTrigger;
TimePicker.Content = TimePickerContent;
TimePicker.Clear = TimePickerClear;

TimePickerTrigger.displayName = 'TimePickerTrigger';
TimePickerContent.displayName = 'TimePickerContent';
TimePickerClear.displayName = 'TimePickerClear';

export default TimePicker;
```

Keep the statics assignment block if the current file assigns them differently, but the four names must stay. Ensure `src/components/ui/time-picker/index.ts` still exports `TimePicker` and the prop types (`export * from './TimePicker';`). Do not re-export `timeColumns` from the barrel; it is internal.

If `vp check` flags `_value` as unused, add the repo's oxlint ignore comment for that line rather than spreading `value` into `Popover.Content`.

**Remove ScrollSelector:**

```bash
git rm -r src/components/ui/scroll-selector src/component-docs/ui/ScrollSelector.mdx
```

Then delete `export * from './scroll-selector';` from `src/components/ui/index.ts`.

**FormTimePicker** (`src/components/forms/form-time-picker/FormTimePicker.tsx`). Replace the `className={cn(error && '…legacy…', className)}` and `error={!!error}` props with:

```tsx
                className={cn(error && 'ps-8', className)}
                invalid={!!error}
```

**TimePicker.mdx.** Add an API table with these rows:
- `use24hFormat` — emits `"HH:MM"`, otherwise `"hh:MM AM|PM"`
- `min`/`max` — inclusive, `"HH:MM"`
- `step` (minutes)
- `size` (`sm`/`md`/`lg`)
- `invalid`
- `clearButton`
- `startAt` (seed when empty)

Also add a sentence that `TimePicker.Content` can be used inside your own `Popover`, as `TimeFilter` does.

Confirm `ScrollSelector` is gone. The grep must print nothing:

```bash
grep -rn 'ScrollSelector\|scroll-selector' src
```

- [ ] **Step 5: Run tests and the type check**

Run: `P exec vp test --run tests/ui src/components tests/design-system && P exec tsc -b`
Expected: PASS and exit 0. `TimeFilter.tsx` compiles unchanged.

- [ ] **Step 6: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && \
git commit -m "feat(ui): TimePicker field shape and listbox columns; remove ScrollSelector

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 14: FormattedNumber (field shape, step buttons)

**Files:**
- Modify: `src/components/ui/formatted-number/FormattedNumber.tsx` (rewrite)
- Modify: `src/components/forms/form-number/FormNumber.tsx:50-56` (drop the legacy error classes, pass `invalid`)
- Modify: `src/component-docs/ui/FormattedNumber.mdx` (API table and RTL note)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'formatted-number'`)
- Test: `src/components/ui/formatted-number/FormattedNumber.test.tsx` (new)

**Interfaces:**
- Consumes: `fieldVariants`, `FieldVariants`, `IconButton`, and `common.number.{increment,decrement}` (Task 1).
- Produces:
  - `FormattedNumberProps` adds `size?: 'sm' | 'md' | 'lg'` and `invalid?: boolean`. All existing props are kept.
  - Step buttons render only when `showStepButtons` is true. They are disabled at `min`/`max`.
  - The value renders end-aligned in mono tabular digits, inside a `dir="ltr"` island.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/formatted-number/FormattedNumber.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FormattedNumber, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderNumber = (props: Partial<Parameters<typeof FormattedNumber>[0]> = {}) =>
  render(
    <Tooltip.Provider>
      <FormattedNumber aria-label="Quantity" {...props} />
    </Tooltip.Provider>,
  );

describe('FormattedNumber', () => {
  it('has no step buttons unless showStepButtons is set', () => {
    renderNumber({ value: 3 });
    expect(screen.queryByRole('button', { name: 'Increase' })).toBeNull();
  });

  it('disables step-down at min and steps up by stepper', () => {
    const handleChange = vi.fn();
    renderNumber({ value: 0, min: 0, max: 10, stepper: 5, showStepButtons: true, onChange: handleChange });
    expect((screen.getByRole('button', { name: 'Decrease' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('disables step-up at max', () => {
    renderNumber({ value: 10, min: 0, max: 10, showStepButtons: true });
    expect((screen.getByRole('button', { name: 'Increase' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('has the same field shape and height as Input, in an LTR island, and exposes invalid', () => {
    renderNumber({ invalid: true });
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(input.className).toContain('h-control-md');
    expect(input.className).toContain('tabular-nums');
    expect(input.getAttribute('dir')).toBe('ltr');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
```

Append `'formatted-number'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/formatted-number tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL.
- "Decrease"/"Increase" are not found: the step buttons are unlabeled, and the inverted flag hides them when `showStepButtons` is set.
- There is no `h-control-md` or `dir`.
- The guard lists the file.

The first test passes before the change, because the buttons that render by default have no name. It pins the corrected default.

- [ ] **Step 3: Rewrite FormattedNumber**

Replace `src/components/ui/formatted-number/FormattedNumber.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC, forwardRef, type KeyboardEvent, type Ref } from 'react';
import { type NumberFormatValues, NumericFormat } from 'react-number-format';

import { fieldVariants, type FieldVariants, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { MinusIcon, PlusIcon } from 'lucide-react';

const clampValue = (value: number, min?: number, max?: number) => {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;

  return value;
};

export type FormattedNumberProps = Omit<ComponentPropsWithoutRef<typeof NumericFormat>, 'value' | 'onChange' | 'onValueChange' | 'size'> &
  FieldVariants & {
    ref?: Ref<HTMLInputElement>;
    value?: number | null;
    min?: number;
    max?: number;
    decimalScale?: number;
    stepper?: number;
    prefix?: string;
    suffix?: string;
    thousandSeparator?: string;
    showStepButtons?: boolean;
    isDecimal?: boolean;
    invalid?: boolean;
    onChange?: (value: number | null) => void;
  };

const FormattedNumber: FC<FormattedNumberProps> = ({
  ref,
  className,
  onChange,
  min = 0,
  max,
  stepper = 1,
  prefix,
  suffix,
  thousandSeparator = '',
  decimalScale,
  isDecimal = true,
  showStepButtons = false,
  size,
  invalid = false,
  disabled,
  value,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const isIncrementDisabled = max !== undefined && (value ?? 0) >= max;
  const isDecrementDisabled = min !== undefined && (value ?? 0) <= min;

  const handleValueChange = ({ floatValue }: NumberFormatValues) => onChange?.(floatValue ?? null);

  const handleIncrement = () => onChange?.(clampValue((value ?? 0) + stepper, min, max));

  const handleDecrement = () => onChange?.(clampValue((value ?? 0) - stepper, min, max));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' && !isIncrementDisabled) handleIncrement();

    if (event.key === 'ArrowDown' && !isDecrementDisabled) handleDecrement();
  };

  // The whole control is an LTR island: a signed or grouped number must not be reordered by the bidi algorithm (addendum §11).
  return (
    <div data-slot="formatted-number" dir="ltr" className="relative w-full">
      <NumericFormat
        data-slot="formatted-number-input"
        dir="ltr"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={cn(fieldVariants({ size }), 'text-end font-mono tabular-nums', showStepButtons && 'pe-16', className)}
        getInputRef={ref}
        value={value}
        thousandSeparator={thousandSeparator}
        decimalScale={isDecimal ? decimalScale : 0}
        prefix={prefix ? `${prefix} ` : undefined}
        suffix={suffix ? ` ${suffix}` : undefined}
        allowNegative={min < 0}
        onValueChange={handleValueChange}
        onKeyDown={handleKeyDown}
        isAllowed={({ floatValue }) => {
          if (floatValue === undefined) return true;

          return (min === undefined || floatValue >= min) && (max === undefined || floatValue <= max);
        }}
        {...props}
      />

      <Conditional.If condition={showStepButtons}>
        <div data-slot="formatted-number-steps" className="absolute inset-y-0 end-1 my-auto flex h-fit items-center gap-0.5">
          <IconButton
            type="button"
            size="sm"
            tooltip={false}
            aria-label={t('number.decrement')}
            disabled={disabled || isDecrementDisabled}
            onClick={handleDecrement}
          >
            <MinusIcon />
          </IconButton>

          <IconButton
            type="button"
            size="sm"
            tooltip={false}
            aria-label={t('number.increment')}
            disabled={disabled || isIncrementDisabled}
            onClick={handleIncrement}
          >
            <PlusIcon />
          </IconButton>
        </div>
      </Conditional.If>
    </div>
  );
};

FormattedNumber.displayName = 'FormattedNumber';

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLInputElement, FormattedNumberProps>((props, ref) => FormattedNumber({ ...props, ref }));
```

The suffix spacing changes from three spaces to one. Three spaces were only needed while the old step buttons covered the end of the field.

**FormNumber** (`src/components/forms/form-number/FormNumber.tsx`). Replace the `className={cn(error && '…legacy…', className)}` prop with:

```tsx
                className={cn(error && 'ps-8', className)}
                invalid={!!error}
```

**Demos and docs.** Check whether any `FormNumber`/`FormattedNumber` usage relied on the inverted default to show buttons (`components.data.demos.tsx:258-266,293`). Where a demo is meant to show steppers, add `showStepButtons`.

Update `FormattedNumber.mdx`:
- API rows for `size`, `invalid` and `showStepButtons` (default `false`)
- a note that the control stays LTR in Arabic so signs and groups keep their order

- [ ] **Step 4: Run tests and the type check**

Run: `P exec vp test --run src/components tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests/design-system && \
git commit -m "feat(ui): FormattedNumber field shape, labelled step buttons, LTR number island

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Date fields and Combobox use the field shape (user direction)

The user asked during Plan B that **every field follow Input's sizes**. The FormDatePicker and FormDateRange shells and the Combobox trigger still use the legacy 48px `h-12` shell. This task moves them to `fieldVariants`, which gives 32px by default, Input's focus ring, and the invalid state. It changes no behavior.

**Files:**
- Modify: `src/components/forms/form-date-picker/FormDatePicker.tsx:180-238`
- Modify: `src/components/forms/form-date-range/FormDateRange.tsx` (the same shell, around lines 199-256)
- Modify: `src/components/shared/combobox/Combobox.tsx:9,58-115,134-137`
- Modify: `src/components/forms/form-combobox/FormCombobox.tsx:141-159`, `src/components/forms/form-multi-combobox/FormMultiCombobox.tsx:147-192`
- Test: `src/components/forms/form-date-picker/FormDatePicker.test.tsx` (new), `src/components/shared/combobox/Combobox.test.tsx` (new)

**Interfaces:**
- Consumes: `fieldVariants`, `FieldVariants` (Plan A), and `common.openCalendar`, `common.clear`.
- Produces:
  - `Combobox.Trigger` accepts `size` and `invalid`.
  - The date shells render `data-slot="date-picker-container"` with the field shape, and carry `aria-invalid` when the field has an error. The attribute goes on the shell (so `fieldVariants`' invalid and hover rules apply) **and** on the input (for assistive tech).

- [ ] **Step 1: Write the failing tests**

Create `src/components/forms/form-date-picker/FormDatePicker.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { type ReactNode, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormDatePicker, FormDateRange } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const WithError = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: { visit: null, stay: null } });
  useEffect(() => {
    methods.setError('visit', { message: 'Required' });
    methods.setError('stay', { message: 'Required' });
  }, [methods]);
  return (
    <Tooltip.Provider>
      <FormProvider {...methods}>{children}</FormProvider>
    </Tooltip.Provider>
  );
};

const shells = () => [...document.querySelectorAll<HTMLElement>('[data-slot="date-picker-container"]')];

describe('date field shells', () => {
  it('match the Input field height and expose the error on the shell and the input', async () => {
    render(
      <WithError>
        <FormDatePicker name="visit" label="Visit" />
        <FormDateRange name="stay" label="Stay" />
      </WithError>,
    );
    await waitFor(() => expect(shells().every((shell) => shell.getAttribute('aria-invalid') === 'true')).toBe(true));
    for (const shell of shells()) {
      expect(shell.className).toContain('h-control-md');
      expect(shell.className).not.toMatch(/h-12|border-destructive|bg-background/);
      expect(shell.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
    }
    expect(screen.getAllByRole('button', { name: 'Open calendar' }).length).toBe(2);
  });
});
```

Before relying on the `name`/`label`-only props in this test, read FormDatePicker's and FormDateRange's prop types. If either requires `control` or another prop, pass it from `methods`. Keep the assertions unchanged.

Create `src/components/shared/combobox/Combobox.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Combobox } from '@components/shared';

afterEach(cleanup);

describe('Combobox.Trigger', () => {
  it('uses the field shape at md and exposes invalid', () => {
    render(
      <Combobox>
        <Combobox.Trigger invalid>
          <Combobox.Value placeholder="Choose a doctor" />
        </Combobox.Trigger>
      </Combobox>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('h-control-md');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.className).not.toMatch(/bg-background|border-muted-200/);
  });
});
```

If `Combobox`'s root requires props (`open`, a value), add the minimum the type demands. The assertions stay as written.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/forms/form-date-picker src/components/shared/combobox`
Expected: FAIL. The shells are `h-12` with `border-destructive`, the shell has no `aria-invalid`, the label is the English literal "Open calendar" (the test still matches it, so this assertion passes), and the trigger has no `invalid` prop.

- [ ] **Step 3: Implement**

**FormDatePicker shell** (`FormDatePicker.tsx`):

1. Add `fieldVariants` to the file's `@components/ui` import, and `useAppTranslation` to `@hooks/shared` (the `t` hook from Plan A's i18n fix is already there).

2. Replace the shell `div`'s `className={cn(…)}` with:

```tsx
            aria-invalid={!!error || undefined}
            className={cn(fieldVariants(), 'group gap-2 pe-1', error && 'ps-8', disabled && 'pointer-events-none opacity-50', className)}
```

3. Replace the calendar-icon button and the input classes with:

```tsx
              <Popover.Trigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleIconClick}
                  className="focus-ring shrink-0 rounded-sm"
                  aria-label={t('openCalendar')}
                  tabIndex={-1}
                >
                  <CalendarIcon
                    aria-hidden="true"
                    className={cn(
                      'text-fg-muted hover:text-fg size-4 cursor-pointer transition-colors',
                      isOpen && 'text-accent',
                      !!error && 'text-danger',
                    )}
                  />
                </button>
              </Popover.Trigger>
```

and, on the `<input …>`:

```tsx
                aria-invalid={!!error || undefined}
                className={cn('text-fg placeholder:text-fg-muted min-w-0 flex-1 bg-transparent outline-none', !!inputValue && !isValidInput && 'text-danger')}
```

4. Change the outer flex wrapper `<div className="flex min-w-0 flex-1 items-center gap-2">` so the input inherits the field's text size; leave it as is if it carries no text classes.

5. Keep the clear `IconButton` with `size="sm"`. It fits the 32px field.

**FormDateRange shell.** Make exactly the same four edits on its shell (same structure, same legacy classes).

**Combobox** (`src/components/shared/combobox/Combobox.tsx`):
- Change line 9 to:

```tsx
type ComboboxTriggerProps = ComponentProps<typeof Popover.Trigger> & FieldVariants & { invalid?: boolean };
```

- Add `fieldVariants, type FieldVariants` to the `@components/ui` import, and `useAppTranslation` from `@hooks/shared`.
- Replace `ComboboxTrigger`, `ComboboxValue`, `ComboboxClear` and `ComboboxIcon` with:

```tsx
const ComboboxTrigger: FC<ComboboxTriggerProps> = ({ className, size, invalid, children, ...props }) => (
  <Popover.Trigger
    data-slot="combobox-trigger"
    role="combobox"
    aria-invalid={invalid || undefined}
    className={cn(
      fieldVariants({ size }),
      'group/combobox-trigger data-[state=open]:border-accent cursor-pointer gap-2 text-start',
      className,
    )}
    {...props}
  >
    {children}
  </Popover.Trigger>
);

const ComboboxValue: FC<ComboboxValueProps> = ({ placeholder, children, className, ...props }) => (
  <span data-slot="combobox-value" className={cn('flex-1 truncate text-start', !children && 'text-fg-muted', className)} {...props}>
    {children ?? placeholder}
  </span>
);

const ComboboxClear: FC<ComboboxClearProps> = ({ when, title, onClear }) => {
  const { t } = useAppTranslation('common');

  if (!when) return null;

  return (
    <XIcon
      size={16}
      role="button"
      aria-label={title ?? t('clear')}
      className="text-fg-muted hover:text-danger shrink-0 cursor-pointer"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onClear();
      }}
    />
  );
};

const ComboboxIcon: FC<ComboboxIconProps> = ({ className, children, ...props }) => (
  <span data-slot="combobox-icon" {...props}>
    {children ?? (
      <ChevronsUpDownIcon
        aria-hidden="true"
        className={cn(
          'text-fg-muted size-4 shrink-0 transition-colors',
          'group-data-[state=open]/combobox-trigger:text-accent group-disabled/combobox-trigger:text-fg-subtle',
          className,
        )}
      />
    )}
  </span>
);
```

- On lines 134 and 137 (`ComboboxLoader`), replace `text-muted-400` with `text-fg-muted`.

The clear icon stays the Plan A Ruling-15 pattern (`role="button"` inside the trigger). Its keyboard access and the nested-interactive fix remain a deferred minor. This task only translates its default label.

**FormCombobox / FormMultiCombobox.** Replace each trigger's error `className` expression with `invalid={!!error}` plus `className={cn(error && 'ps-8', className)}`.

FormMultiCombobox's trigger also holds wrapping tags, so add `h-auto min-h-control-md flex-wrap py-1` to its `className`. The `cn` merge lets `h-auto` override the fixed field height, so the trigger grows with the tags while starting at the Input height.

Confirm there are no legacy shells left. The grep must print nothing:

```bash
grep -nE 'h-12|border-destructive|bg-background' src/components/forms/form-date-picker/FormDatePicker.tsx src/components/forms/form-date-range/FormDateRange.tsx src/components/shared/combobox/Combobox.tsx src/components/forms/form-combobox/FormCombobox.tsx src/components/forms/form-multi-combobox/FormMultiCombobox.tsx
```

- [ ] **Step 4: Run tests and the type check**

Run: `P exec vp test --run src/components tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests/design-system && \
git commit -m "feat(forms): date fields and Combobox share Input's field shape and invalid state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


### Task 16: Layout tokens and the field-family demo

**Files:**
- Modify: `src/components/ui/layout/Layout.tsx:53,70`
- Modify: `src/pages/components/components.data.demos.tsx` (add `FieldFamilyDemo`)
- Modify: `src/component-docs/ui/Input.mdx` (add a "Field family" section)
- Modify: `tests/design-system/forbidden-patterns.test.ts` (`CLEAN_UI_FOLDERS` += `'layout'`)
- Test: `src/components/ui/layout/Layout.test.tsx` (new), `src/pages/components/FieldFamilyDemo.test.tsx` (new)

**Interfaces:**
- Consumes: every field from Tasks 13-15 and Plan A (`Input`, `Select`).
- Produces: `FieldFamilyDemo`, a gallery row with all six field kinds side by side at the default size. Task 17 screenshots it.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/layout/Layout.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Layout } from '@components/ui';

afterEach(cleanup);

describe('Layout', () => {
  it('paints its header and sidebar on the surface token', () => {
    render(
      <Layout>
        <Layout.Header data-testid="header">Top</Layout.Header>
        <Layout.Sidebar data-testid="sidebar">Nav</Layout.Sidebar>
      </Layout>,
    );
    expect(screen.getByTestId('header').className).toContain('bg-surface');
    expect(screen.getByTestId('sidebar').className).toContain('bg-surface');
  });
});
```

Create `src/pages/components/FieldFamilyDemo.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { FieldFamilyDemo } from './components.data.demos';

import '../../i18n';

afterEach(cleanup);

describe('FieldFamilyDemo', () => {
  it('renders all six field kinds at the Input height', () => {
    render(
      <Tooltip.Provider>
        <FieldFamilyDemo />
      </Tooltip.Provider>,
    );
    const fields = [
      '[data-slot="input"]',
      '[data-slot="select-trigger"]',
      '[data-slot="time-picker-trigger"]',
      '[data-slot="formatted-number-input"]',
      '[data-slot="date-picker-container"]',
      '[data-slot="combobox-trigger"]',
    ].map((selector) => document.querySelector(selector));

    expect(fields.every(Boolean)).toBe(true);
    for (const field of fields) expect(field!.className).toContain('h-control-md');
  });
});
```

If Select's trigger uses a different `data-slot` (check `Select.tsx`), use that value; the assertion is about height.

Append `'layout'` to `CLEAN_UI_FOLDERS`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/layout src/pages/components tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. The header has `bg-background`, `FieldFamilyDemo` is not exported, and the guard lists `ui/layout/Layout.tsx`.

- [ ] **Step 3: Implement**

**`Layout.tsx`:**
- Line 53: change `bg-background` to `bg-surface`.
- Line 70: change `bg-background` to `bg-surface`.
- `md:grid-cols-[auto_1fr]` is allowed (it is not a length value) and stays.

**`FieldFamilyDemo`.** Append to `components.data.demos.tsx`. Use the existing `useForm`, `FormContainer` and `Form*` imports at the top of the file, and add any that are missing.

```tsx
export function FieldFamilyDemo() {
  const form = useForm({ defaultValues: { name: '', role: '', time: null, amount: null, visit: null, doctor: null } });

  return (
    <FormContainer form={form} onSubmit={() => undefined}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormInput name="name" label="Name" placeholder="Layla Haddad" />
        <FormSelect
          name="role"
          label="Role"
          options={[{ label: 'Admin', value: 'admin' }]}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
        />
        <FormTimePicker name="time" label="Time" control={form.control} />
        <FormNumber name="amount" label="Amount" control={form.control} showStepButtons />
        <FormDatePicker name="visit" label="Visit" control={form.control} />
        <FormCombobox name="doctor" label="Doctor" control={form.control} options={[{ label: 'Dr. Haddad', value: 'haddad' }]} />
      </div>
    </FormContainer>
  );
}
```

Match each `Form*` component's real required props as the neighbouring demos in this file use them. FormCombobox, for instance, may need `getOptionLabel`/`getOptionValue` like FormSelect. If `tsc` reports a missing prop, add it as the existing demos do.

**`Input.mdx`.** Add after its Demo section:

````mdx
## Field family

Every field shares Input's shape: `sm` 28px · `md` 32px (default) · `lg` 40px, the same border, focus ring and invalid state.

<FieldFamilyDemo />
````

Then add `FieldFamilyDemo` to that file's import from `@pages/components/components.data.demos`.

- [ ] **Step 4: Run tests and the type check**

Run: `P exec vp test --run src/components/ui/layout src/pages/components tests/design-system && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Update the baseline and commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests/design-system && \
git commit -m "feat(ui): Layout surface tokens; field-family demo pins one height for every field

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: SP2 exit — all of `ui/` clean, deleted folders gone, visual review

**Files:**
- Modify: `tests/design-system/forbidden-patterns.test.ts` (replace `CLEAN_UI_FOLDERS` with an all-of-`ui/` assertion, and add a deleted-folders assertion)
- Possibly modify: whatever the assertions surface

**Interfaces:**
- Consumes: everything above.
- Produces: the SP2 exit criteria from addendum §12, plus the user's two Plan B directions verified on screen.

- [ ] **Step 1: Write the exit assertions**

In `tests/design-system/forbidden-patterns.test.ts`:
- Delete `CLEAN_UI_FOLDERS` and its test.
- Add `existsSync` and `readdirSync` to the `node:fs` import.
- Add:

```ts
/** Folders SP2 replaced (addendum §1, §8, §10). None may come back under src/components. */
const DELETED_COMPONENT_FOLDERS = [
  'prime-dialog',
  'prime-tooltip',
  'prime-dropdown',
  'scroll-selector',
  'chip',
  'radio-dot',
  'loading-button',
  'link-button',
  'tooltip-button',
] as const;

const componentFolders = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => [entry.name, ...componentFolders(`${dir}/${entry.name}`)]);

describe('SP2 exit', () => {
  it('src/components/ui contains no forbidden patterns', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/ui/'));
    expect(offenders).toEqual([]);
  });

  it('the baseline records nothing under src/components/ui', () => {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
    expect(Object.keys(baseline).filter((file) => file.startsWith('src/components/ui/'))).toEqual([]);
  });

  it('the replaced component folders are gone', () => {
    const present = componentFolders(`${REPO_ROOT}src/components`).filter((name) =>
      (DELETED_COMPONENT_FOLDERS as readonly string[]).includes(name),
    );
    expect(present).toEqual([]);
  });
});
```

Keep the existing `describe('clean primitives')` test for `src/components/calendar/` from Task 12. Delete only its `CLEAN_UI_FOLDERS` case.

Plan A deleted `LoadingButton`, `LinkButton` and `TooltipButton` as components. If any of them lived in a file rather than a folder of that name, the folder check above passes trivially for that name, which is fine. `tsc -b` already proves that they have no importers.

If the baseline JSON's top-level shape is not `Record<file, counts>` (check `forbidden-patterns.ts`'s `Baseline` type), adapt the second test to its shape.

- [ ] **Step 2: Run them**

Run: `P exec vp test --run tests/design-system`
Expected: PASS.
- If the first test lists a `ui/` file, an earlier task missed a class. Fix it with semantic tokens, re-run, and ledger which task's guard should have caught it.
- If the third test lists a folder, delete that folder and its barrel line. `tsc -b` must stay green.

- [ ] **Step 3: Full gate**

```bash
P exec vp check && P exec vp test --run && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && P exec vp build && P docs:lint && P ds:baseline
```

Expected: every command exits 0, and `ds:baseline` reports no increase. Record the test count.

- [ ] **Step 4: Audits**

Run the `forge:audit-rtl`, `forge:audit-dark-mode` and `forge:audit-a11y` skills on `src/components/ui/`, if they are available in this session; otherwise dispatch one general-purpose subagent with those three checklists.
- Fix **behavioral** findings in `ui/` with a test first.
- Ledger the rest as deferred minors, with file:line.

- [ ] **Step 5: Visual review (dark/light × en/ar)**

1. Start `P exec vp dev --open false --port 3123` in the background.
2. With `playwright-cli`, capture these pages in all four combinations:
   - `/components/input` (the field-family row from Task 16)
   - `/components/dialog`
   - `/components/dropdown-menu`
   - `/components/toast`
   - `/components/tabs`
   - `/components/table`
   - `/components/calendar`
   - `/components/calendar-time-grid`
   - `/components/calendar-grid`
   - `/components/time-picker`
   - `/components/formatted-number`
   - the dashboard
3. Save them to `.superpowers/screens/sp2b-<page>-<theme>-<lang>.png`. Open each dialog, menu, picker and toast before capturing.
4. Compare them against the mockups in `.superpowers/brainstorm/*/content/{structure-family,date-family}.html`.

Check specifically:
- **Field family:** all six fields are the same height in every combination (the user's direction).
- **Calendar views:** no white-on-grey text; today is accent text or a hairline ring; events are soft tints with a dot; the now line is accent (the user's direction).
- **Arabic:** the centered toast is centered; chevrons in Pagination, Calendar and CalendarGrid point the right way; times and numbers keep their LTR order.

5. Smoke-render every `/components/*` page and record any page that shows the error boundary. Match on the error-boundary element, not on the text "Something went wrong", because demos contain that copy.
6. Stop the server and the browser: `pkill -f "vp dev --open false --port 3123"; playwright-cli close; rm -rf .playwright-cli`.

- [ ] **Step 6: Commit**

```bash
git add -A tests/design-system src && \
git commit -m "test(design-system): SP2 exit — ui/ clean, replaced folders gone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

