# UI Kit Composites — SP3 Plan B (new shared components + app screens) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the six components the parent consolidation map marks "3 / 4": Spinner, EmptyState, PageHeader, AppShell + Sidebar, DescriptionList and CardGrid. Rebuild the app shell, tables, calendar views and app pages on them. Delete PrimeLoader, BlankSlate, ActionPanel, MetaCard, GridCard, `ui/layout` and the four dashboard layout folders. Finish with `layouts/`, `shared/`, `tables/`, `calendar/`, `routes/`, `App.tsx` and the app pages clean.

**Architecture:**
- **New components.** Each one goes through parent §6: API, then build, then test, then MDX, then EN/AR keys.
- **Shell.** It is split into a presentational `shared/Sidebar`, a stateful `shared/AppShell` (collapsed state persisted in `localStorage`, mobile drawer) and a thin app-specific `layouts/AppLayout`. AppLayout wires `APP_MENU`, the auth user, the command palette and `layouts/AppHeader`.
- **Migrations.** Pages and composites move by hand from the tables in each task. Deleted components are proven gone by `tsc -b` plus a guard test.

**Tech Stack:** React 18, TypeScript 5.9, react-router 6 (data router), TanStack Table, Tailwind 4.3, CVA, Radix, react-i18next, date-fns (via `useDate`), Vite+ (`vp`), happy-dom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-ui-kit-composites-design.md` §4 (Plan B), §2 and §6. Its parent spec and the SP2 addendum are binding.

## Global Constraints

Everything in SP3 Plan A's Global Constraints carries over unchanged. In particular:
- Gate commits on real exit codes.
- Commit trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Semantic tokens only, `Conditional` in JSX, `data-slot` on every part, EN/AR keys in the same commit.
- A module-load barrel read must use a direct import.
- `P ds:baseline` after each task that removes violations.

Two additions:
- **Test helpers** live in `src/test-utils/` (Plan A ruling). Router-dependent tests wrap in `MemoryRouter`.
- **Persisted UI state** uses `localStorage` keys prefixed `rsk:`. Every read and write is wrapped in try/catch, so a blocked storage never breaks rendering.

### Plan decisions not spelled out in the spec (keep them)

- **The shell split:**
  - `shared/Sidebar` knows nothing about routes or auth.
  - `layouts/AppLayout` maps `APP_MENU` (grouped by `item.group`) to `Sidebar.Group` and `Sidebar.Item`, and puts the auth user in `Sidebar.Footer`.
  - `layouts/AppHeader` holds the old `DashboardHeader` content: the command-palette trigger, notifications, theme, language and the user menu.
  - **Deleted:** `layouts/{dashboard-layout,dashboard-sidebar,dashboard-sidebar-drawer,dashboard-sidebar-link,dashboard-header}` and `ui/layout`.
- **The mobile sidebar** is a fixed drawer with a scrim, not a Radix Dialog: SP4 brings the Sheet. It closes on scrim click, on Escape, and when an item is chosen, and focus returns to the menu button.
- **The collapsed sidebar** shows icons only. Every item gets a Tooltip with its label, group labels become `sr-only`, and a SubMenu clicked while collapsed expands the sidebar first, matching today's `onExpandSidebar`.
- **The active item** is styled `bg-hover text-fg font-medium` with `aria-current="page"`. There is no stripe and no solid fill. AppLayout decides `active` with `useRouteUtils().isActiveLink`.
- **Spinner `overlay`** covers the nearest positioned ancestor (`absolute inset-0` + scrim). App-level fallbacks use `<Spinner overlay fixed />` (`fixed` widens it to the viewport).
- **EmptyState inside `Table.Empty`.** `Table.Empty` keeps its props and renders `<EmptyState size="sm" kind="no-results" …/>`. EmptyState lives in `shared/` while Table lives in `ui/`, which normally must not import `shared/`. The ruling: EmptyState is built in `ui/empty-state` and re-exported from `@components/shared`, so the tier rule holds. The spec's "shared/EmptyState" names the import surface, not the folder.
- **MetaCard and GridCard leave the code.** Their docs examples (CalendarGrid.mdx, DataTable.mdx) are rewritten with `Card` + `DescriptionList` and `CardGrid` + `Card`.
- **Breadcrumb** (used by PageHeader) gets tokens, `t('breadcrumb.root')` in place of the hard-coded "Dashboard", and an RTL-mirrored separator.
- **Components gallery pages** (`ComponentsGalleryPage`, `ComponentDetailPage`) move in Plan C with the rest of the docs chrome (spec §5 "Page chrome"). They are docs surfaces, and Plan C restyles DocPanel and SidebarPanel, which they are built from.
- **Arabic plurals.** `common.table.total` becomes `common.table.total_{zero,one,two,few,many,other}` in AR (EN `_one/_other`), and `common.selectedCount` likewise. Code passes `count` to `t()`.

## Review Focus

1. **The mobile drawer traps nothing and leaks nothing.** Opening it from the menu button, then pressing Escape, closes it and returns focus to the button. Choosing an item closes it. → Task 6 tests all three.
2. **A persisted collapse survives reload and a broken storage.** A `localStorage` that throws must not crash the shell. → Task 6 tests `rsk:sidebar-collapsed` round-trip and a throwing `setItem`.
3. **A collapsed sidebar stays usable.** Every icon-only item has an accessible name and a tooltip. → Task 6 asserts `getByRole('link', { name })` while collapsed.
4. **Plurals read correctly in Arabic.** "الإجمالي" with count 2 and count 11 uses different plural forms. → Task 9 asserts the `two` and `many` forms render.
5. **Calendar labels follow the language.** The week headers and the Day/Week/Month tabs render in Arabic under `ar`, and axis hours keep Western digits. → Task 10 tests both.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `ui/spinner/*` (new); delete `shared/prime-loader` | Spinner + PrimeLoader removal | 1 |
| `ui/empty-state/*` (new, re-exported by shared); `ui/table/Table.tsx`; delete `shared/blank-slate` | EmptyState | 2 |
| `shared/page-header/*` (new), `shared/breadcrumb/*`; delete `shared/action-panel` | PageHeader + Breadcrumb | 3 |
| `shared/description-list/*` (new); delete `shared/meta-card` | DescriptionList | 4 |
| `shared/card-grid/*` (new); delete `shared/grid-card` | CardGrid | 5 |
| `shared/sidebar/*`, `shared/app-shell/*` (new) | Sidebar + AppShell | 6 |
| `layouts/app-layout/*`, `layouts/app-header/*` (new); `routes/router.tsx`; deletes of the dashboard layouts + `ui/layout` | App shell wiring | 7 |
| `layouts/{auth-layout,auth-guard,error-boundary}`, `routes/RoutePlaceholders.tsx`, `App.tsx` | Auth/error/placeholder screens | 8 |
| `tables/data-table/**`, `types/DataTable.ts`, locales | Tables | 9 |
| `calendar/**`, `shared/date-navigation`, locales | Calendar views | 10 |
| `shared/{file-card,file-icon,file-uploader,stepper,faceted-filter,toaster}` | Remaining shared migration | 11 |
| `pages/{dashboard,members}/*` | App pages | 12 |
| `tests/design-system/forbidden-patterns.test.ts` | Plan B exit | 13 |

### Task 1: `ui/Spinner` (replaces PrimeLoader)

**Files:**
- Create: `src/components/ui/spinner/Spinner.tsx`, `index.ts`, `Spinner.test.tsx`; `src/component-docs/ui/Spinner.mdx`
- Modify: `src/components/ui/index.ts` (export `./spinner` after `./skeleton`)
- Modify: `src/App.tsx` (fallback), `src/layouts/dashboard-layout/DashboardLayout.tsx:4,20` (fallback; this file is deleted in Task 7 but must compile until then), `src/layouts/auth-guard/AuthGuard.tsx:4` (drop the unused import), `src/components/ui/table/Table.tsx` (`Loader` spinner branch)
- Delete: `src/components/shared/prime-loader/`, `src/component-docs/shared/PrimeLoader.mdx`; drop the `./prime-loader` line from `src/components/shared/index.ts`

**Interfaces:**
- Produces: `Spinner: FC<SpinnerProps>`, where `SpinnerProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & { size?: 'sm' | 'md' | 'lg'; label?: string; overlay?: boolean; fixed?: boolean }`.
  - It renders `role="status"` with sr-only `label ?? t('loading')`.
  - `overlay` covers the nearest positioned ancestor; `overlay fixed` covers the viewport.

- [ ] **Step 1: Write the failing test**

`src/components/ui/spinner/Spinner.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Spinner } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('Spinner', () => {
  it('is a status with translated hidden text and stops spinning under reduced motion', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Loading…');
    expect(status.querySelector('svg')?.getAttribute('class')).toContain('motion-reduce:animate-none');
  });

  it('accepts a custom label and sizes', () => {
    render(<Spinner size="lg" label="Saving visit" />);
    expect(screen.getByRole('status').textContent).toBe('Saving visit');
    expect(screen.getByRole('status').querySelector('svg')?.getAttribute('class')).toContain('size-8');
  });

  it('overlays its parent, or the viewport when fixed', () => {
    render(
      <>
        <Spinner overlay data-testid="local" />
        <Spinner overlay fixed data-testid="page" />
      </>,
    );
    expect(screen.getByTestId('local').className).toMatch(/(^|\s)absolute(\s|$)/);
    expect(screen.getByTestId('local').className).toContain('inset-0');
    expect(screen.getByTestId('page').className).toMatch(/(^|\s)fixed(\s|$)/);
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/components/ui/spinner`
Expected: FAIL. `Spinner` is not exported.

- [ ] **Step 3: Implement**

`src/components/ui/spinner/Spinner.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Loader2Icon } from 'lucide-react';

const spinnerVariants = cva('text-fg-muted animate-spin motion-reduce:animate-none', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type SpinnerProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  VariantProps<typeof spinnerVariants> & {
    /** Screen-reader text. @default t('loading') */
    label?: string;
    /** Cover the nearest positioned ancestor with a scrim. */
    overlay?: boolean;
    /** With `overlay`: cover the viewport instead. */
    fixed?: boolean;
  };

const Spinner: FC<SpinnerProps> = ({ className, size, label, overlay = false, fixed = false, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <div
      role="status"
      data-slot="spinner"
      data-overlay={overlay || undefined}
      className={cn(
        'inline-flex items-center justify-center',
        overlay && 'bg-canvas/70 inset-0 z-50 flex',
        overlay && (fixed ? 'fixed' : 'absolute'),
        className,
      )}
      {...props}
    >
      <Loader2Icon aria-hidden="true" className={spinnerVariants({ size })} />

      <span className="sr-only">{label ?? t('loading')}</span>
    </div>
  );
};

Spinner.displayName = 'Spinner';

export default Spinner;
```

`index.ts`: `export { default as Spinner } from './Spinner'; export type { SpinnerProps } from './Spinner';`

- [ ] **Step 4: Replace PrimeLoader**

| File | Old | New |
|---|---|---|
| `src/App.tsx` | `import { PrimeLoader } from '@components/shared';` | `import { Spinner } from '@components/ui';` |
| `src/App.tsx` | `fallback={<PrimeLoader displayLogo={false} />}` | `fallback={<Spinner overlay fixed size="lg" />}` |
| `DashboardLayout.tsx` | the `PrimeLoader` import | `Spinner` from `@components/ui` (merge into the existing ui import) |
| `DashboardLayout.tsx` | `fallback={<PrimeLoader />}` | `fallback={<Spinner overlay size="lg" />}` |
| `AuthGuard.tsx` | `import { PrimeLoader } from '@components/shared';` | delete the line (it is unused) |

In `Table.tsx` `Loader`, replace the `<Loader2Icon aria-label=… />` cell content with `<Spinner />`. Import `Spinner` with `import Spinner from '@components/ui/spinner/Spinner';` (a direct path, because Table is in the same barrel). Remove `Loader2Icon` from Table's lucide import if it becomes unused. Then wrap the skeleton branch in a status:

```tsx
      <Conditional.Else>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <Row key={`skeleton-row-${rowIndex}`} data-slot="table-loader" aria-hidden="true">
            {Array.from({ length: colSpan }, (_, colIndex) => (
              <Cell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                <Skeleton />
              </Cell>
            ))}
          </Row>
        ))}
        <tr className="sr-only">
          <td colSpan={colSpan} role="status">
            {t('loading')}
          </td>
        </tr>
      </Conditional.Else>
```

This closes the SP2 deferred minor "skeleton announces nothing".

Delete PrimeLoader:

```bash
git rm -rq src/components/shared/prime-loader src/component-docs/shared/PrimeLoader.mdx
```

Remove the barrel line. Then create `Spinner.mdx` (`id: spinner`, `category: UI`):
- a demo of the three sizes and an `overlay` inside a `relative h-32 rounded-lg border` box
- an API table: `size`, `label`, `overlay`, `fixed`

The grep must print nothing: `grep -rn 'PrimeLoader' src`.

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/components && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 6: Commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && git commit -m "feat(ui): Spinner with overlay mode; retire PrimeLoader

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: EmptyState (replaces BlankSlate; renders inside `Table.Empty`)

**Files:**
- Create: `src/components/ui/empty-state/EmptyState.tsx`, `index.ts`, `EmptyState.test.tsx`; `src/component-docs/shared/EmptyState.mdx`
- Modify: `src/components/ui/index.ts` (export `./empty-state`); `src/components/shared/index.ts` (add `export { EmptyState, type EmptyStateProps } from '@components/ui/empty-state';`)
- Modify: `src/components/ui/table/Table.tsx` (`Empty` renders EmptyState)
- Modify: `src/locales/{en,ar}/common.json` (`emptyState.*`)
- Delete: `src/components/shared/blank-slate/`, `src/component-docs/shared/BlankSlate.mdx`

**Interfaces:**
- Produces: `EmptyState: FC<EmptyStateProps> & { Actions: FC<ComponentPropsWithoutRef<'div'>> }`, where `EmptyStateProps = ComponentPropsWithoutRef<'div'> & { kind?: 'first-use' | 'no-results' | 'error'; title?: ReactNode; description?: ReactNode; icon?: ReactNode; size?: 'sm' | 'md'; titleAs?: 'h1' | 'h2' | 'h3' }`.
  - Default titles and descriptions come from i18n per kind.
  - `kind="error"` sets `role="alert"`.
- Keys: `common.emptyState.{firstUse,noResults,error}.{title,description}`.

- [ ] **Step 1: Write the failing test**

`src/components/ui/empty-state/EmptyState.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EmptyState, Table } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('EmptyState', () => {
  it('uses the kind for its default copy and icon', () => {
    render(<EmptyState kind="no-results" />);
    expect(screen.getByRole('heading', { name: 'No results' })).toBeTruthy();
    expect(document.querySelector('[data-slot="empty-state"]')?.getAttribute('data-kind')).toBe('no-results');
  });

  it('announces errors and renders actions', () => {
    render(
      <EmptyState kind="error" title="Couldn't load visits">
        <EmptyState.Actions>
          <button type="button">Try again</button>
        </EmptyState.Actions>
      </EmptyState>,
    );
    expect(screen.getByRole('alert').textContent).toContain("Couldn't load visits");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('is what Table.Empty renders', () => {
    render(
      <table>
        <tbody>
          <Table.Empty when colSpan={3} title="No members yet" />
        </tbody>
      </table>,
    );
    expect(screen.getByRole('heading', { name: 'No members yet' }).closest('[data-slot="empty-state"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/components/ui/empty-state`
Expected: FAIL. `EmptyState` is not exported.

- [ ] **Step 3: Add the keys**

EN `common.json`:

```json
  "emptyState": {
    "firstUse": { "title": "Nothing here yet", "description": "When you add items, they will show up here." },
    "noResults": { "title": "No results", "description": "Try different keywords or clear the filters." },
    "error": { "title": "Something went wrong", "description": "We couldn't load this. Please try again." }
  },
```

AR:

```json
  "emptyState": {
    "firstUse": { "title": "لا يوجد شيء بعد", "description": "ستظهر العناصر هنا عند إضافتها." },
    "noResults": { "title": "لا توجد نتائج", "description": "جرّب كلمات مختلفة أو امسح عوامل التصفية." },
    "error": { "title": "حدث خطأ ما", "description": "تعذّر تحميل هذا المحتوى. يُرجى المحاولة مرة أخرى." }
  },
```

- [ ] **Step 4: Implement**

`src/components/ui/empty-state/EmptyState.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { AlertTriangle, Inbox, SearchX } from 'lucide-react';

type EmptyStateKind = 'first-use' | 'no-results' | 'error';

const KIND: Record<EmptyStateKind, { icon: typeof Inbox; key: 'firstUse' | 'noResults' | 'error' }> = {
  'first-use': { icon: Inbox, key: 'firstUse' },
  'no-results': { icon: SearchX, key: 'noResults' },
  error: { icon: AlertTriangle, key: 'error' },
};

const emptyStateVariants = cva('flex flex-col items-center text-center', {
  variants: {
    size: {
      sm: 'gap-1.5 px-4 py-8 [&_[data-slot=empty-state-icon]]:size-8',
      md: 'gap-2 px-6 py-12 [&_[data-slot=empty-state-icon]]:size-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type EmptyStateProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof emptyStateVariants> & {
    kind?: EmptyStateKind;
    title?: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    /** Heading level of the title; full-page states use `h1`. @default 'h3' */
    titleAs?: 'h1' | 'h2' | 'h3';
  };

type EmptyStateComponent = FC<EmptyStateProps> & {
  Actions: FC<ComponentPropsWithoutRef<'div'>>;
};

const Actions: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => (
  <div data-slot="empty-state-actions" className={cn('mt-3 flex flex-wrap items-center justify-center gap-2', className)} {...props} />
);

const EmptyState: EmptyStateComponent = ({ className, kind = 'first-use', title, description, icon, size, titleAs: Title = 'h3', children, ...props }) => {
  const { t } = useAppTranslation('common');
  const { icon: KindIcon, key } = KIND[kind];

  return (
    <div
      data-slot="empty-state"
      data-kind={kind}
      role={kind === 'error' ? 'alert' : undefined}
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    >
      <span data-slot="empty-state-icon" className="text-fg-subtle flex items-center justify-center [&_svg]:size-full">
        <Conditional>
          <Conditional.If condition={!!icon}>{icon}</Conditional.If>

          <Conditional.Else>
            <KindIcon aria-hidden="true" strokeWidth={1.5} />
          </Conditional.Else>
        </Conditional>
      </span>

      <Title className="text-fg text-md font-semibold">{title ?? t(`emptyState.${key}.title`)}</Title>

      <p className="text-fg-muted max-w-sm text-sm">{description ?? t(`emptyState.${key}.description`)}</p>

      {children}
    </div>
  );
};

EmptyState.Actions = Actions;
EmptyState.displayName = 'EmptyState';

export default EmptyState;
```

`index.ts`: `export { default as EmptyState } from './EmptyState'; export type { EmptyStateProps } from './EmptyState';`

In `Table.tsx`:
- Replace `Empty`'s `<td>` content with:

```tsx
      <td colSpan={colSpan}>
        <EmptyState size="sm" kind="no-results" title={title ?? t('table.emptyTitle')} description={description ?? t('table.emptyDescription')} />
      </td>
```

- Import it as `import EmptyState from '@components/ui/empty-state/EmptyState';` (direct path).
- Remove `Search` from the lucide import if it becomes unused.

Delete BlankSlate:

```bash
git rm -rq src/components/shared/blank-slate src/component-docs/shared/BlankSlate.mdx
```

Remove its barrel line. Create `src/component-docs/shared/EmptyState.mdx` (`id: empty-state`, `category: Shared`). It shows the three kinds side by side and one with `EmptyState.Actions`, plus an API table.

The grep must print nothing: `grep -rn 'BlankSlate' src`.

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/components tests/i18n && P exec tsc -b`
Expected: PASS and exit 0. The SP2 `Table` test "falls back to translated empty-state copy" still finds "No Results Found", because `table.emptyTitle` is passed through.

- [ ] **Step 6: Commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && git commit -m "feat(ui): EmptyState (first-use, no-results, error) used by Table.Empty; retire BlankSlate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: PageHeader + Breadcrumb (replaces ActionPanel)

**Files:**
- Create: `src/components/shared/page-header/PageHeader.tsx`, `index.ts`, `PageHeader.test.tsx`; `src/components/shared/breadcrumb/Breadcrumb.test.tsx`; `src/component-docs/shared/PageHeader.mdx`
- Modify: `src/components/shared/breadcrumb/Breadcrumb.tsx` (tokens, translated root, current page, mirrored separator); `src/components/shared/index.ts` (add `./page-header`, drop `./action-panel`); `src/pages/members/MembersPage.tsx:21,205-216`; `src/locales/{en,ar}/common.json` (`pageHeader.back`)
- Delete: `src/components/shared/action-panel/`, `src/component-docs/shared/ActionPanel.mdx`

**Interfaces:**
- Consumes: `Breadcrumb` and `BreadcrumbLink` (`{ title: string; href?: string }`) from `shared/breadcrumb`.
- Produces: `PageHeader: FC<PageHeaderProps> & { Actions: FC<ComponentPropsWithoutRef<'div'>> }`, where
  `PageHeaderProps = Omit<ComponentPropsWithoutRef<'header'>, 'title'> & { title: ReactNode; description?: ReactNode; back?: string | (() => void); breadcrumb?: BreadcrumbLink[] }`.
  - A string `back` renders a router `Link`; a function renders a button. Either way it gets `aria-label={t('pageHeader.back')}`.
  - The title is an `h1`.
  - `.Actions` children sit at the end of the title row and wrap under it on narrow screens.

- [ ] **Step 1: Write the failing tests**

`src/components/shared/breadcrumb/Breadcrumb.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Breadcrumb } from '@components/shared';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('en');
});

const renderCrumbs = () =>
  render(
    <MemoryRouter>
      <Breadcrumb withRoot links={[{ title: 'Members', href: 'members' }, { title: 'Sara Haddad' }]} />
    </MemoryRouter>,
  );

describe('Breadcrumb', () => {
  it('translates the root crumb and marks the current page', async () => {
    await i18n.changeLanguage('ar');
    renderCrumbs();
    expect(screen.getByRole('link', { name: 'لوحة التحكم' })).toBeTruthy();
    expect(screen.getByText('Sara Haddad').getAttribute('aria-current')).toBe('page');
  });

  it('mirrors the separator in RTL and uses tokens', () => {
    renderCrumbs();
    const separator = document.querySelector('[data-slot="breadcrumb-separator"]') as HTMLElement;
    expect(separator.getAttribute('aria-hidden')).toBe('true');
    expect(separator.querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
    expect(document.querySelector('nav ol')?.innerHTML).not.toMatch(/muted-400|text-primary/);
  });
});
```

`src/components/shared/page-header/PageHeader.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PageHeader } from '@components/shared';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('PageHeader', () => {
  it('renders a level-1 title, description, breadcrumb and actions', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Members" description="People with access to this workspace." breadcrumb={[{ title: 'Members' }]}>
          <PageHeader.Actions>
            <button type="button">Add member</button>
          </PageHeader.Actions>
        </PageHeader>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Members' })).toBeTruthy();
    expect(screen.getByText('People with access to this workspace.')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add member' }).closest('[data-slot="page-header-actions"]')).not.toBeNull();
  });

  it('labels the back link and mirrors its chevron', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Sara Haddad" back="/members" />
      </MemoryRouter>,
    );
    const back = screen.getByRole('link', { name: 'Back' });
    expect(back.getAttribute('href')).toBe('/members');
    expect(back.querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
  });

  it('calls a back handler from a button', () => {
    const onBack = vi.fn();
    render(
      <Tooltip.Provider>
        <PageHeader title="Visit" back={onBack} />
      </Tooltip.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run them**

Run: `P exec vp test --run src/components/shared/breadcrumb src/components/shared/page-header`
Expected: FAIL. The root crumb is the hard-coded "Dashboard", there is no `breadcrumb-separator` slot, and `PageHeader` is not exported.

- [ ] **Step 3: Add the keys**

EN `common.json`: `"pageHeader": { "back": "Back" },`. AR: `"pageHeader": { "back": "رجوع" },`.

- [ ] **Step 4: Rewrite Breadcrumb**

Replace the body of `Breadcrumb.tsx` from `const finalLinks` down to the end of the component:

```tsx
  const finalLinks = withRoot
    ? [{ title: t('breadcrumb.root'), href: PLAIN_ROUTES.HOME.INDEX }, ...links.filter((link) => link.href !== PLAIN_ROUTES.HOME.INDEX)]
    : links;

  return (
    <nav data-slot="breadcrumb" aria-label={t('breadcrumbLabel')} className={className}>
      <ol className="text-fg-muted flex flex-wrap items-center gap-1 text-xs">
        {finalLinks.map(({ title, href }, idx) => {
          const isLastItem = idx === finalLinks.length - 1;

          return (
            <li key={`${title}-${idx}`} data-slot="breadcrumb-item" className="flex items-center gap-1">
              <Conditional>
                <Conditional.If condition={!!href && !isLastItem}>
                  <Link
                    className="hover:text-fg focus-visible:ring-ring rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    to={href === PLAIN_ROUTES.HOME.INDEX || href === PLAIN_ROUTES.ROOT.INDEX ? href! : `/${href}`}
                  >
                    {title}
                  </Link>
                </Conditional.If>

                <Conditional.Else>
                  <span aria-current={isLastItem ? 'page' : undefined} className={cn(isLastItem && 'text-fg')}>
                    {title}
                  </span>
                </Conditional.Else>
              </Conditional>

              <Conditional.If condition={!isLastItem}>
                <span data-slot="breadcrumb-separator" aria-hidden="true" className="text-fg-subtle flex">
                  {separator ?? <ChevronRight className="size-3.5 rtl:-scale-x-100" />}
                </span>
              </Conditional.If>
            </li>
          );
        })}
      </ol>
    </nav>
  );
```

Note the behaviour change: a middle crumb without `href` now renders as a plain span instead of nothing. The old code rendered nothing for an href-less middle crumb, which was a bug.

- [ ] **Step 5: Implement PageHeader**

`src/components/shared/page-header/PageHeader.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { IconButton } from '@components/ui';
import { Conditional } from '@components/utils';
import Breadcrumb, { type BreadcrumbLink } from '@components/shared/breadcrumb/Breadcrumb';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronLeft } from 'lucide-react';

export type PageHeaderProps = Omit<ComponentPropsWithoutRef<'header'>, 'title'> & {
  title: ReactNode;
  description?: ReactNode;
  /** A path renders a link; a function renders a button. */
  back?: string | (() => void);
  breadcrumb?: BreadcrumbLink[];
};

type PageHeaderComponent = FC<PageHeaderProps> & {
  Actions: FC<ComponentPropsWithoutRef<'div'>>;
};

const BACK_CLASSES =
  'text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none';

const Actions: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => (
  <div data-slot="page-header-actions" className={cn('flex flex-wrap items-center gap-2', className)} {...props} />
);

const PageHeader: PageHeaderComponent = ({ className, title, description, back, breadcrumb, children, ...props }) => {
  const { t } = useAppTranslation('common');
  const icon = <ChevronLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />;

  return (
    <header data-slot="page-header" className={cn('flex flex-col gap-3 pb-6', className)} {...props}>
      <Conditional.If condition={!!breadcrumb?.length}>
        <Breadcrumb links={breadcrumb ?? []} />
      </Conditional.If>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-2">
          <Conditional>
            <Conditional.If condition={typeof back === 'string'}>
              <Link to={back as string} aria-label={t('pageHeader.back')} className={BACK_CLASSES}>
                {icon}
              </Link>
            </Conditional.If>

            <Conditional.If condition={typeof back === 'function'}>
              <IconButton size="sm" aria-label={t('pageHeader.back')} onClick={back as () => void}>
                {icon}
              </IconButton>
            </Conditional.If>
          </Conditional>

          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{title}</h1>

            <Conditional.If condition={!!description}>
              <p className="text-fg-muted max-w-prose text-sm">{description}</p>
            </Conditional.If>
          </div>
        </div>

        {children}
      </div>
    </header>
  );
};

PageHeader.Actions = Actions;
PageHeader.displayName = 'PageHeader';

export default PageHeader;
```

`index.ts`: `export { default as PageHeader, type PageHeaderProps } from './PageHeader';`

Check that `IconButton` accepts `size="sm"`: `grep -n "size" src/components/ui/icon-button/IconButton.tsx`. If the sizes are named differently, use the smallest one and ledger a ruling.

- [ ] **Step 6: Migrate MembersPage and delete ActionPanel**

In `src/pages/members/MembersPage.tsx`:
- Replace `import { ActionPanel } from '@components/shared';` with `import { PageHeader } from '@components/shared';`.
- Replace `import { AddCircle } from 'iconsax-react';` with `import { Plus } from 'lucide-react';`. If lucide is already imported, merge into it.
- Make sure `Button` comes from `@components/ui`.
- Replace lines 205–216 with:

```tsx
      <PageHeader title={t('title')} description={t('description')}>
        <PageHeader.Actions>
          <Button>
            <Plus aria-hidden="true" />
            {t('addMember')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>
```

Add `members.description` to both locales:
- EN: "Everyone with access to this workspace and what they can do."
- AR: "كل من يملك صلاحية الوصول إلى مساحة العمل هذه وما يمكنه فعله."

Then delete ActionPanel and remove its barrel line:

```bash
git rm -rq src/components/shared/action-panel src/component-docs/shared/ActionPanel.mdx
```

Create `src/component-docs/shared/PageHeader.mdx` (`id: page-header`, `category: Shared`). It shows:
1. title + description + actions
2. a `back` link with a breadcrumb

The grep must print nothing: `grep -rn 'ActionPanel' src`.

- [ ] **Step 7: Run tests**

Run: `P exec vp test --run src/components/shared tests/i18n && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 8: Commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && git commit -m "feat(shared): PageHeader with back and breadcrumb; Breadcrumb tokens, translated root, RTL separator; retire ActionPanel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: DescriptionList (replaces MetaCard)

**Files:**
- Create: `src/components/shared/description-list/DescriptionList.tsx`, `index.ts`, `DescriptionList.test.tsx`; `src/component-docs/shared/DescriptionList.mdx`
- Modify: `src/components/shared/index.ts` (add `./description-list`, drop `./meta-card`); `src/component-docs/calendar/CalendarGrid.mdx:13,187-200,497-499`; `src/components/shared/card-composites.test.tsx` (drop the MetaCard case)
- Delete: `src/components/shared/meta-card/`, `src/component-docs/shared/MetaCard.mdx`

**Interfaces:**
- Produces: `DescriptionList: FC<DescriptionListProps> & { Item: FC<DescriptionListItemProps> }`.
  - `DescriptionListItem = { term: ReactNode; value?: ReactNode; numeric?: boolean }`
  - `DescriptionListProps = Omit<ComponentPropsWithoutRef<'dl'>, 'children'> & { items?: DescriptionListItem[]; columns?: 1 | 2 | 3; layout?: 'stacked' | 'inline'; children?: ReactNode }`
  - `DescriptionListItemProps = DescriptionListItem & { className?: string }`
  - An empty value (`null`, `undefined`, `''`) renders `—`.
  - `numeric` wraps the value in `<span dir="ltr" class="font-mono tabular-nums">`.

- [ ] **Step 1: Write the failing test**

`src/components/shared/description-list/DescriptionList.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DescriptionList } from '@components/shared';

afterEach(cleanup);

describe('DescriptionList', () => {
  it('renders terms and values from items, isolating numeric values LTR', () => {
    render(
      <DescriptionList
        items={[
          { term: 'Doctor', value: 'Dr. Lina Khoury' },
          { term: 'File number', value: 'MRN-20391', numeric: true },
          { term: 'Insurance', value: null },
        ]}
      />,
    );
    expect(screen.getByText('Doctor').tagName).toBe('DT');
    expect(screen.getByText('Dr. Lina Khoury').closest('dd')).not.toBeNull();
    const id = screen.getByText('MRN-20391');
    expect(id.getAttribute('dir')).toBe('ltr');
    expect(id.className).toContain('tabular-nums');
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('sets the grid from columns and the row layout from layout', () => {
    render(
      <DescriptionList columns={3} layout="inline">
        <DescriptionList.Item term="Status" value="Confirmed" />
      </DescriptionList>,
    );
    const list = document.querySelector('[data-slot="description-list"]') as HTMLElement;
    expect(list.className).toContain('lg:grid-cols-3');
    expect((document.querySelector('[data-slot="description-list-item"]') as HTMLElement).getAttribute('data-layout')).toBe('inline');
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/components/shared/description-list`
Expected: FAIL. `DescriptionList` is not exported.

- [ ] **Step 3: Implement**

`src/components/shared/description-list/DescriptionList.tsx`:

```tsx
import { type ComponentPropsWithoutRef, createContext, type FC, type ReactNode, useContext } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type Layout = 'stacked' | 'inline';

export type DescriptionListItem = {
  term: ReactNode;
  value?: ReactNode;
  /** IDs, amounts, times: rendered LTR in tabular mono. */
  numeric?: boolean;
};

export type DescriptionListItemProps = DescriptionListItem & { className?: string };

export type DescriptionListProps = Omit<ComponentPropsWithoutRef<'dl'>, 'children'> & {
  items?: DescriptionListItem[];
  columns?: 1 | 2 | 3;
  layout?: Layout;
  children?: ReactNode;
};

type DescriptionListComponent = FC<DescriptionListProps> & {
  Item: FC<DescriptionListItemProps>;
};

const COLUMNS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

const LayoutContext = createContext<Layout>('stacked');

const isEmpty = (value: ReactNode) => value === null || value === undefined || value === '';

const Item: FC<DescriptionListItemProps> = ({ term, value, numeric = false, className }) => {
  const layout = useContext(LayoutContext);

  return (
    <div
      data-slot="description-list-item"
      data-layout={layout}
      className={cn(
        layout === 'inline' ? 'flex items-baseline justify-between gap-4' : 'flex flex-col gap-0.5',
        className,
      )}
    >
      <dt className="text-fg-muted flex items-center gap-1.5 text-sm [&_svg]:size-3.5">{term}</dt>

      <dd className={cn('text-fg text-sm font-medium', layout === 'inline' && 'text-end')}>
        <Conditional>
          <Conditional.If condition={isEmpty(value)}>
            <span className="text-fg-subtle">—</span>
          </Conditional.If>

          <Conditional.If condition={numeric}>
            <span dir="ltr" className="font-mono tabular-nums">
              {value}
            </span>
          </Conditional.If>

          <Conditional.Else>{value}</Conditional.Else>
        </Conditional>
      </dd>
    </div>
  );
};

const DescriptionList: DescriptionListComponent = ({ className, items, columns = 1, layout = 'stacked', children, ...props }) => (
  <LayoutContext.Provider value={layout}>
    <dl data-slot="description-list" className={cn('grid gap-x-6 gap-y-3', COLUMNS[columns], className)} {...props}>
      {items?.map((item, index) => <Item key={index} {...item} />)}

      {children}
    </dl>
  </LayoutContext.Provider>
);

DescriptionList.Item = Item;
DescriptionList.displayName = 'DescriptionList';

export default DescriptionList;
```

`index.ts`: `export { default as DescriptionList, type DescriptionListProps, type DescriptionListItem, type DescriptionListItemProps } from './DescriptionList';`

The test expects `—` for the null value. `Conditional` renders only the first matching branch, so put `isEmpty` first.

- [ ] **Step 4: Replace MetaCard in the docs and delete it**

`CalendarGrid.mdx`:
- In the imports, `import { MetaCard } from '@components/shared';` becomes `import { DescriptionList } from '@components/shared';`.
- Lines 187–200 (the three MetaCards inside the detail panel) become:

```mdx
              <DescriptionList
                layout="inline"
                className="border-border-subtle border-b pb-3"
                items={[
                  { term: <><Stethoscope aria-hidden /> Doctor</>, value: event.doctor },
                  { term: <><MapPin aria-hidden /> Location</>, value: event.location },
                ]}
              />

              <DescriptionList
                items={[
                  {
                    term: <><Clock aria-hidden /> Date & Time</>,
                    numeric: true,
                    value: `${new Date(event.start).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${formatTime(event.start)} - ${formatTime(event.end)}`,
                  },
                ]}
              />
```

- Lines 497–499 (the two horizontal MetaCards in the popover) become:

```mdx
        <DescriptionList layout="inline" items={[{ term: 'Doctor', value: event.doctor }, { term: 'Location', value: event.location }]} />
```

In `card-composites.test.tsx`, delete the `MetaCard header opts out…` case and drop `MetaCard` and `Tooltip` from the imports.

```bash
git rm -rq src/components/shared/meta-card src/component-docs/shared/MetaCard.mdx
```

Remove the barrel line. Create `src/component-docs/shared/DescriptionList.mdx` (`id: description-list`, `category: Shared`). It shows:
- a patient summary in a `Card` with `columns={2}` (name, MRN numeric, date of birth numeric, insurer, an empty phone)
- an `inline` example
- an API table

The grep must print nothing: `grep -rn 'MetaCard' src`.

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/components/shared && P exec tsc -b && P docs:lint`
Expected: PASS and exit 0.

- [ ] **Step 6: Commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(shared): DescriptionList with numeric LTR values; retire MetaCard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: CardGrid (replaces GridCard)

**Files:**
- Create: `src/components/shared/card-grid/CardGrid.tsx`, `index.ts`, `CardGrid.test.tsx`; `src/component-docs/shared/CardGrid.mdx`
- Modify: `src/components/shared/index.ts` (add `./card-grid`, drop `./grid-card`)
- Delete: `src/components/shared/grid-card/`, `src/component-docs/shared/GridCard.mdx`, `src/components/shared/card-composites.test.tsx` (its last case covered GridCard)

**Interfaces:**
- Produces: `CardGrid: FC<CardGridProps>`, where `CardGridProps = ComponentPropsWithoutRef<'div'> & { columns?: CardGridColumns | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl', CardGridColumns>>; gap?: 'sm' | 'md' | 'lg' }` and `CardGridColumns = 1 | 2 | 3 | 4 | 5 | 6`.
  - The default is `{ base: 1, sm: 2, lg: 4 }` with `gap="md"`.
  - It is layout only: no background or borders.

- [ ] **Step 1: Write the failing test**

`src/components/shared/card-grid/CardGrid.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CardGrid } from '@components/shared';

afterEach(cleanup);

const grid = () => document.querySelector('[data-slot="card-grid"]') as HTMLElement;

describe('CardGrid', () => {
  it('takes a fixed column count', () => {
    render(<CardGrid columns={3} gap="lg" />);
    expect(grid().className).toContain('grid-cols-3');
    expect(grid().className).toContain('gap-6');
  });

  it('takes responsive columns and defaults to 1 / 2 / 4', () => {
    render(
      <>
        <CardGrid columns={{ base: 1, md: 2, xl: 5 }} />
        <CardGrid data-testid="default" />
      </>,
    );
    expect(grid().className).toMatch(/grid-cols-1 .*md:grid-cols-2 .*xl:grid-cols-5/);
    const fallback = document.querySelector('[data-testid="default"]') as HTMLElement;
    expect(fallback.className).toMatch(/grid-cols-1 .*sm:grid-cols-2 .*lg:grid-cols-4/);
    expect(fallback.className).toContain('gap-4');
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/components/shared/card-grid`
Expected: FAIL. `CardGrid` is not exported.

- [ ] **Step 3: Implement**

`src/components/shared/card-grid/CardGrid.tsx`. Tailwind only scans literal strings, so every class is spelled out:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cn } from '@utils';

export type CardGridColumns = 1 | 2 | 3 | 4 | 5 | 6;
type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';

export type CardGridProps = ComponentPropsWithoutRef<'div'> & {
  columns?: CardGridColumns | Partial<Record<Breakpoint, CardGridColumns>>;
  gap?: 'sm' | 'md' | 'lg';
};

const COLUMNS: Record<Breakpoint, Record<CardGridColumns, string>> = {
  base: { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' },
  sm: { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6' },
  md: { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' },
  lg: { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' },
  xl: { 1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6' },
};

const GAP = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' } as const;

const BREAKPOINTS: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl'];

const columnClasses = (columns: NonNullable<CardGridProps['columns']>) =>
  typeof columns === 'number'
    ? COLUMNS.base[columns]
    : BREAKPOINTS.flatMap((bp) => (columns[bp] ? [COLUMNS[bp][columns[bp]]] : []));

const CardGrid: FC<CardGridProps> = ({ className, columns = { base: 1, sm: 2, lg: 4 }, gap = 'md', ...props }) => (
  <div data-slot="card-grid" className={cn('grid', columnClasses(columns), GAP[gap], className)} {...props} />
);

CardGrid.displayName = 'CardGrid';

export default CardGrid;
```

`index.ts`: `export { default as CardGrid, type CardGridProps, type CardGridColumns } from './CardGrid';`

- [ ] **Step 4: Delete GridCard**

```bash
git rm -rq src/components/shared/grid-card src/component-docs/shared/GridCard.mdx src/components/shared/card-composites.test.tsx
```

Remove the barrel line. Create `src/component-docs/shared/CardGrid.mdx` (`id: card-grid`, `category: Shared`). It shows four KPI `Card`s with the default columns (title, numeric value `font-mono tabular-nums` in `dir="ltr"`, a muted delta line) and a `columns={2}` example, plus an API table.

The grep must print nothing: `grep -rn 'GridCard' src`.

- [ ] **Step 5: Run tests**

Run: `P exec vp test --run src/components/shared && P exec tsc -b && P docs:lint`
Expected: PASS and exit 0.

- [ ] **Step 6: Commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(shared): CardGrid responsive layout; retire GridCard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Sidebar + AppShell

**Files:**
- Create: `src/components/shared/app-shell/AppShellContext.ts`, `AppShell.tsx`, `index.ts`, `AppShell.test.tsx`
- Create: `src/components/shared/sidebar/Sidebar.tsx`, `index.ts`, `Sidebar.test.tsx`
- Create: `src/component-docs/shared/AppShell.mdx`, `src/component-docs/shared/Sidebar.mdx`
- Modify: `src/components/shared/index.ts` (add `./app-shell`, `./sidebar`); `src/locales/{en,ar}/nav.json` (`skipToContent`)

**Interfaces:**
- Produces, from `shared/app-shell`:
  - `AppShell: FC<AppShellProps> & { Header; Content; MenuButton }`, where `AppShellProps = { sidebar: ReactNode; storageKey?: string | null; className?: string; children: ReactNode }`. The default `storageKey` is `'rsk:sidebar-collapsed'`; `null` turns persistence off.
  - `useAppShell(): AppShellState`. `AppShellState` holds `collapsed`, `toggleCollapsed()`, `setCollapsed(v)`, `mobileOpen`, `openMobile()`, `closeMobile(restoreFocus?: boolean)`, `menuButtonRef`, `sidebarId`, `scrolled` and `setScrolled(v)`. Outside an AppShell the context defaults to an expanded, closed, no-op state, so `Sidebar` renders standalone in docs.
- Produces, from `shared/sidebar`: `Sidebar` (root, `collapsed?: boolean` overrides the shell) with `.Header`, `.Content` (`nav`, `aria-label` defaults to `t('nav:navigation')`), `.Group` (`label`), `.Item` (`href`, `icon: ElementType`, `active?`, `badge?`, `children` is the label), `.SubMenu` (`icon`, `label`, `active?`, children are `.Item`s), `.Footer` and `.CollapseButton`.
- Collapsed styles apply from `md` up only. The mobile drawer always shows the expanded sidebar.

- [ ] **Step 1: Write the failing tests**

`src/components/shared/sidebar/Sidebar.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Sidebar } from '@components/shared';
import { Tooltip } from '@components/ui';

import { LayoutDashboard, Users } from 'lucide-react';

import '../../../i18n';

afterEach(cleanup);

const wrap = (ui: ReactNode) =>
  render(
    <MemoryRouter>
      <Tooltip.Provider>{ui}</Tooltip.Provider>
    </MemoryRouter>,
  );

const menu = (collapsed = false) => (
  <Sidebar collapsed={collapsed}>
    <Sidebar.Content>
      <Sidebar.Group label="Main">
        <Sidebar.Item href="/dashboard" icon={LayoutDashboard} active>
          Dashboard
        </Sidebar.Item>
        <Sidebar.Item href="/members" icon={Users} badge={12}>
          Members
        </Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar>
);

describe('Sidebar', () => {
  it('marks the active item with aria-current and a hover tint, never a stripe', () => {
    wrap(menu());
    const active = screen.getByRole('link', { name: 'Dashboard' });
    expect(active.getAttribute('aria-current')).toBe('page');
    expect(active.className).toContain('aria-[current=page]:bg-hover');
    expect(active.className).not.toMatch(/border-s-|border-l-|before:/);
    expect(screen.getByRole('link', { name: /Members/ }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeTruthy();
  });

  it('keeps collapsed items named, hides labels visually and adds tooltips', () => {
    wrap(menu(true));
    const members = screen.getByRole('link', { name: /Members/ });
    expect(members.getAttribute('data-slot')).toBe('sidebar-item');
    expect(members.getAttribute('data-state')).not.toBeNull(); // Radix tooltip trigger
    expect(members.querySelector('[data-slot="sidebar-item-label"]')?.className).toContain('md:sr-only');
    expect(screen.getByText('Main').className).toContain('md:sr-only');
  });
});
```

`src/components/shared/app-shell/AppShell.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { AppShell, Sidebar } from '@components/shared';
import { Tooltip } from '@components/ui';

import { Users } from 'lucide-react';

import '../../../i18n';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderShell = () =>
  render(
    <MemoryRouter>
      <Tooltip.Provider>
        <AppShell
          sidebar={
            <Sidebar>
              <Sidebar.Header>
                <Sidebar.CollapseButton />
              </Sidebar.Header>
              <Sidebar.Content>
                <Sidebar.Item href="/members" icon={Users}>
                  Members
                </Sidebar.Item>
              </Sidebar.Content>
            </Sidebar>
          }
        >
          <AppShell.Header>
            <AppShell.MenuButton />
          </AppShell.Header>
          <AppShell.Content>Page</AppShell.Content>
        </AppShell>
      </Tooltip.Provider>
    </MemoryRouter>,
  );

const aside = () => document.querySelector('[data-slot="app-shell-sidebar"]') as HTMLElement;
const menuButton = () => screen.getByRole('button', { name: /^(Open|Close) menu$/ });

describe('AppShell', () => {
  it('persists the collapsed sidebar across mounts', () => {
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(aside().getAttribute('data-collapsed')).toBe('true');
    expect(localStorage.getItem('rsk:sidebar-collapsed')).toBe('true');

    cleanup();
    renderShell();
    expect(aside().getAttribute('data-collapsed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeTruthy();
  });

  it('survives a storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(aside().getAttribute('data-collapsed')).toBe('true');
  });

  it('opens the mobile drawer and closes it on Escape, returning focus to the menu button', () => {
    renderShell();
    fireEvent.click(menuButton());
    expect(aside().getAttribute('data-open')).toBe('true');
    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    expect(menuButton().getAttribute('aria-controls')).toBe(aside().id);

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(aside().getAttribute('data-open')).toBe('false');
    expect(document.activeElement).toBe(menuButton());
  });

  it('closes the drawer on the scrim and when an item is chosen', () => {
    renderShell();
    fireEvent.click(menuButton());
    fireEvent.click(document.querySelector('[data-slot="app-shell-scrim"]') as HTMLElement);
    expect(aside().getAttribute('data-open')).toBe('false');

    fireEvent.click(menuButton());
    fireEvent.click(screen.getByRole('link', { name: 'Members' }));
    expect(aside().getAttribute('data-open')).toBe('false');
  });

  it('offers a skip link to the main content', () => {
    renderShell();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip.getAttribute('href')).toBe(`#${screen.getByRole('main').id}`);
  });
});
```

- [ ] **Step 2: Run them**

Run: `P exec vp test --run src/components/shared/sidebar src/components/shared/app-shell`
Expected: FAIL. `Sidebar` and `AppShell` are not exported.

- [ ] **Step 3: Add the key**

`nav.json` EN: `"skipToContent": "Skip to content"`. AR: `"skipToContent": "تخطَّ إلى المحتوى"`.

- [ ] **Step 4: Implement the context and AppShell**

`src/components/shared/app-shell/AppShellContext.ts`:

```ts
import { createContext, type RefObject, useContext } from 'react';

export type AppShellState = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  /** `restoreFocus` sends focus back to the menu button (Escape, scrim). */
  closeMobile: (restoreFocus?: boolean) => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  sidebarId: string;
  scrolled: boolean;
  setScrolled: (scrolled: boolean) => void;
};

const noop = () => {};

export const AppShellContext = createContext<AppShellState>({
  collapsed: false,
  setCollapsed: noop,
  toggleCollapsed: noop,
  mobileOpen: false,
  openMobile: noop,
  closeMobile: noop,
  menuButtonRef: { current: null },
  sidebarId: 'app-sidebar',
  scrolled: false,
  setScrolled: noop,
});

export const useAppShell = () => useContext(AppShellContext);
```

`src/components/shared/app-shell/AppShell.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Menu } from 'lucide-react';

import { AppShellContext, type AppShellState, useAppShell } from './AppShellContext';

const DEFAULT_STORAGE_KEY = 'rsk:sidebar-collapsed';

const readStored = (key: string | null): boolean => {
  if (!key) return false;
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

const writeStored = (key: string | null, value: boolean) => {
  if (!key) return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage blocked (private mode, quota): the preference just isn't remembered.
  }
};

export type AppShellProps = {
  sidebar: ReactNode;
  /** localStorage key for the collapsed preference; `null` disables persistence. */
  storageKey?: string | null;
  className?: string;
  children: ReactNode;
};

type AppShellComponent = FC<AppShellProps> & {
  Header: FC<ComponentPropsWithoutRef<'header'>>;
  Content: FC<ComponentPropsWithoutRef<'main'>>;
  MenuButton: FC<{ className?: string }>;
};

const Header: FC<ComponentPropsWithoutRef<'header'>> = ({ className, ...props }) => {
  const { scrolled } = useAppShell();

  return (
    <header
      data-slot="app-shell-header"
      data-scrolled={scrolled}
      className={cn(
        'bg-canvas border-border relative z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 transition-shadow md:px-6',
        'data-[scrolled=true]:shadow-raised',
        className,
      )}
      {...props}
    />
  );
};

const Content: FC<ComponentPropsWithoutRef<'main'>> = ({ className, children, ...props }) => {
  const { setScrolled } = useAppShell();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { root: sentinel.parentElement });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [setScrolled]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-slot="app-shell-content"
      className={cn('relative min-h-0 flex-1 overflow-y-auto p-4 focus:outline-none md:p-6', className)}
      {...props}
    >
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {children}
    </main>
  );
};

const MenuButton: FC<{ className?: string }> = ({ className }) => {
  const { t } = useAppTranslation('nav');
  const { mobileOpen, openMobile, closeMobile, menuButtonRef, sidebarId } = useAppShell();

  return (
    <IconButton
      ref={menuButtonRef}
      tooltip={false}
      aria-label={t(mobileOpen ? 'closeMenu' : 'openMenu')}
      aria-expanded={mobileOpen}
      aria-controls={sidebarId}
      className={cn('md:hidden', className)}
      onClick={() => (mobileOpen ? closeMobile(true) : openMobile())}
    >
      <Menu aria-hidden="true" />
    </IconButton>
  );
};

const AppShell: AppShellComponent = ({ sidebar, storageKey = DEFAULT_STORAGE_KEY, className, children }) => {
  const { t } = useAppTranslation('nav');
  const sidebarId = `app-sidebar-${useId().replace(/:/g, '')}`;
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const asideRef = useRef<HTMLElement>(null);

  const [collapsed, setCollapsedState] = useState(() => readStored(storageKey));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const setCollapsed = useCallback(
    (value: boolean) => {
      setCollapsedState(value);
      writeStored(storageKey, value);
    },
    [storageKey],
  );

  const closeMobile = useCallback((restoreFocus = false) => {
    setMobileOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    asideRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobile(true);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, closeMobile]);

  const value = useMemo<AppShellState>(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed: () => setCollapsed(!collapsed),
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile,
      menuButtonRef,
      sidebarId,
      scrolled,
      setScrolled,
    }),
    [collapsed, setCollapsed, mobileOpen, closeMobile, sidebarId, scrolled],
  );

  return (
    <AppShellContext.Provider value={value}>
      <div data-slot="app-shell" className={cn('bg-canvas text-fg flex h-dvh overflow-hidden', className)}>
        <a
          href="#main-content"
          className="bg-surface-raised text-fg shadow-overlay focus-visible:ring-ring sr-only z-[60] rounded-md px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus-visible:ring-2"
        >
          {t('skipToContent')}
        </a>

        <Conditional.If condition={mobileOpen}>
          <div data-slot="app-shell-scrim" aria-hidden="true" className="bg-overlay fixed inset-0 z-40 md:hidden" onClick={() => closeMobile(true)} />
        </Conditional.If>

        <aside
          ref={asideRef}
          id={sidebarId}
          tabIndex={-1}
          data-slot="app-shell-sidebar"
          data-collapsed={collapsed}
          data-open={mobileOpen}
          className={cn(
            'bg-sidebar border-sidebar-border fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e focus:outline-none',
            'transition-[translate,visibility] duration-200 ease-out motion-reduce:transition-none',
            'md:visible md:static md:translate-x-0 md:transition-[width]',
            collapsed ? 'md:w-16' : 'md:w-64',
            mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full rtl:translate-x-full',
          )}
        >
          {sidebar}
        </aside>

        <div data-slot="app-shell-main" className="flex min-w-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </AppShellContext.Provider>
  );
};

AppShell.Header = Header;
AppShell.Content = Content;
AppShell.MenuButton = MenuButton;
AppShell.displayName = 'AppShell';

export default AppShell;
```

`index.ts`:

```ts
export { default as AppShell, type AppShellProps } from './AppShell';
export { useAppShell, type AppShellState } from './AppShellContext';
```

`IconButton` is the forwardRef bridge, so `ref={menuButtonRef}` reaches the `<button>`.

- [ ] **Step 5: Implement Sidebar**

`src/components/shared/sidebar/Sidebar.tsx`:

```tsx
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ElementType,
  type FC,
  type MouseEvent,
  type ReactNode,
  useContext,
  useId,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { IconButton, ScrollArea, Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';
import { useAppShell } from '@components/shared/app-shell/AppShellContext';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronDown, ChevronsLeft } from 'lucide-react';

const SidebarContext = createContext({ collapsed: false });

type SidebarProps = ComponentPropsWithoutRef<'div'> & { collapsed?: boolean };
type GroupProps = ComponentPropsWithoutRef<'div'> & { label: ReactNode };
type ItemProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string;
  icon: ElementType;
  active?: boolean;
  badge?: ReactNode;
};
type SubMenuProps = { icon: ElementType; label: ReactNode; active?: boolean; children: ReactNode };

type SidebarComponent = FC<SidebarProps> & {
  Header: FC<ComponentPropsWithoutRef<'div'>>;
  Content: FC<ComponentPropsWithoutRef<'nav'>>;
  Group: FC<GroupProps>;
  Item: FC<ItemProps>;
  SubMenu: FC<SubMenuProps>;
  Footer: FC<ComponentPropsWithoutRef<'div'>>;
  CollapseButton: FC<{ className?: string }>;
};

const ROW =
  'text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-ring flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0';

const useCollapsed = () => useContext(SidebarContext).collapsed;

const Header: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => {
  const collapsed = useCollapsed();

  return (
    <div
      data-slot="sidebar-header"
      className={cn('flex h-14 shrink-0 items-center justify-between gap-2 px-3', collapsed && 'md:justify-center md:px-0', className)}
      {...props}
    />
  );
};

const Content: FC<ComponentPropsWithoutRef<'nav'>> = ({ className, children, ...props }) => {
  const { t } = useAppTranslation('nav');

  return (
    <ScrollArea className="min-h-0 flex-1">
      <nav data-slot="sidebar-content" aria-label={t('navigation')} className={cn('flex flex-col gap-4 px-3 py-2', className)} {...props}>
        {children}
      </nav>
    </ScrollArea>
  );
};

const Group: FC<GroupProps> = ({ label, className, children, ...props }) => {
  const collapsed = useCollapsed();
  const labelId = useId();

  return (
    <div data-slot="sidebar-group" role="group" aria-labelledby={labelId} className={cn('flex flex-col gap-0.5', className)} {...props}>
      <p id={labelId} className={cn('text-fg-subtle text-2xs px-3 pb-1 font-medium tracking-wider uppercase', collapsed && 'md:sr-only')}>
        {label}
      </p>

      {children}
    </div>
  );
};

const Item: FC<ItemProps> = ({ href, icon: Icon, active = false, badge, className, children, onClick, ...props }) => {
  const collapsed = useCollapsed();
  const { direction } = useAppTranslation();
  const { mobileOpen, closeMobile } = useAppShell();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (mobileOpen) closeMobile(false);
  };

  return (
    <Tooltip content={children} side={direction === 'rtl' ? 'left' : 'right'} disabled={!collapsed}>
      <Link
        to={href}
        data-slot="sidebar-item"
        aria-current={active ? 'page' : undefined}
        className={cn(ROW, 'aria-[current=page]:bg-hover aria-[current=page]:text-fg aria-[current=page]:font-medium', collapsed && 'md:justify-center md:px-0', className)}
        onClick={handleClick}
        {...props}
      >
        <Icon aria-hidden="true" />

        <span data-slot="sidebar-item-label" className={cn('flex-1 truncate', collapsed && 'md:sr-only')}>
          {children}
        </span>

        <Conditional.If condition={badge !== undefined && badge !== null}>
          <span className={cn('bg-surface-raised text-fg-muted text-2xs rounded-full px-1.5 font-mono tabular-nums', collapsed && 'md:hidden')}>
            {badge}
          </span>
        </Conditional.If>
      </Link>
    </Tooltip>
  );
};

const SubMenu: FC<SubMenuProps> = ({ icon: Icon, label, active = false, children }) => {
  const collapsed = useCollapsed();
  const { setCollapsed } = useAppShell();
  const [open, setOpen] = useState(active);
  const panelId = useId();

  const handleClick = () => {
    if (collapsed) {
      setCollapsed(false);
      setOpen(true);
      return;
    }
    setOpen((value) => !value);
  };

  return (
    <div data-slot="sidebar-submenu" className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open && !collapsed}
        aria-controls={panelId}
        data-active={active || undefined}
        className={cn(ROW, 'data-[active]:text-fg', collapsed && 'md:justify-center md:px-0')}
        onClick={handleClick}
      >
        <Icon aria-hidden="true" />

        <span className={cn('flex-1 truncate text-start', collapsed && 'md:sr-only')}>{label}</span>

        <ChevronDown aria-hidden="true" className={cn('transition-transform motion-reduce:transition-none', open && 'rotate-180', collapsed && 'md:hidden')} />
      </button>

      <Conditional.If condition={open && !collapsed}>
        <div id={panelId} className="flex flex-col gap-0.5 ps-7">
          {children}
        </div>
      </Conditional.If>
    </div>
  );
};

const Footer: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => (
  <div data-slot="sidebar-footer" className={cn('border-sidebar-border shrink-0 border-t p-3', className)} {...props} />
);

const CollapseButton: FC<{ className?: string }> = ({ className }) => {
  const { t } = useAppTranslation('nav');
  const { toggleCollapsed } = useAppShell();
  const collapsed = useCollapsed();

  return (
    <IconButton
      size="sm"
      tooltip={false}
      aria-label={t(collapsed ? 'expandSidebar' : 'collapseSidebar')}
      className={cn('max-md:hidden', className)}
      onClick={toggleCollapsed}
    >
      <ChevronsLeft aria-hidden="true" className={cn('rtl:-scale-x-100', collapsed && 'rotate-180')} />
    </IconButton>
  );
};

const Sidebar: SidebarComponent = ({ collapsed: collapsedProp, className, ...props }) => {
  const shell = useAppShell();
  const collapsed = collapsedProp ?? shell.collapsed;

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div data-slot="sidebar" data-collapsed={collapsed} className={cn('flex h-full min-h-0 flex-col', className)} {...props} />
    </SidebarContext.Provider>
  );
};

Sidebar.Header = Header;
Sidebar.Content = Content;
Sidebar.Group = Group;
Sidebar.Item = Item;
Sidebar.SubMenu = SubMenu;
Sidebar.Footer = Footer;
Sidebar.CollapseButton = CollapseButton;
Sidebar.displayName = 'Sidebar';

export default Sidebar;
```

`index.ts`: `export { default as Sidebar } from './Sidebar';`

Barrel order: `./app-shell` must come before `./sidebar` in `shared/index.ts`. Both import each other only through `AppShellContext.ts` (direct path), so there is no barrel cycle.

Notes:
- Is `text-2xs` defined? It is in the token list (`--text-2xs`).
- `Tooltip` forwards its trigger with `asChild`, so the Radix trigger props land on the `<a>`. The `data-state` assertion relies on this.

- [ ] **Step 6: Run the tests**

Run: `P exec vp test --run src/components/shared/sidebar src/components/shared/app-shell`
Expected: PASS (7 tests).

If `data-state` is absent while collapsed, the tooltip wrapper did not render a Radix trigger. Check `Tooltip`'s `disabled` short-circuit. Do not change the assertion.

- [ ] **Step 7: Docs**

`src/component-docs/shared/AppShell.mdx` (`id: app-shell`, `category: Shared`):
- A live demo inside a `relative h-[28rem] overflow-hidden rounded-lg border` frame.
- The demo passes `storageKey={null}` and overrides the root class `h-full` so it fits the frame.
- Sidebar header with a `Logo`-less wordmark span and `Sidebar.CollapseButton`.
- Two groups (Clinic: Schedule, Patients (badge 4), Visits; Admin: Settings), one item active, and a footer with an avatar row.
- Header with `AppShell.MenuButton` and a title; content with two `Card`s.
- API tables for AppShell (`sidebar`, `storageKey`), `useAppShell`, and the Sidebar parts.
- An "Accessibility" section: skip link, `aria-current`, collapsed tooltips, Escape closes the drawer.

`src/component-docs/shared/Sidebar.mdx` (`id: sidebar`): the standalone `Sidebar` in a `h-96 w-64 rounded-lg border` box, then the same box with `collapsed`, plus an API table.

- [ ] **Step 8: Run tests and commit**

```bash
P exec vp test --run src/components tests/i18n && P exec tsc -b && P docs:lint && \
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(shared): AppShell (persisted collapse, mobile drawer, skip link, scroll shadow) and presentational Sidebar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: AppLayout + AppHeader, router wiring, delete the dashboard layouts and `ui/layout`

**Files:**
- Create: `src/layouts/app-layout/AppLayout.tsx`, `index.ts`, `AppLayout.test.tsx`; `src/layouts/app-header/AppHeader.tsx`, `index.ts`
- Modify: `src/layouts/index.ts` (replace the five `dashboard-*` lines with `./app-header` and `./app-layout`); `src/routes/router.tsx:4,51` (`DashboardLayout` → `AppLayout`); `src/components/ui/index.ts` (drop `./layout`); `src/locales/{en,ar}/header.json` (`avatarAlt`)
- Delete: `src/layouts/{dashboard-layout,dashboard-sidebar,dashboard-sidebar-drawer,dashboard-sidebar-link,dashboard-header}/`, `src/components/ui/layout/` (with `Layout.test.tsx`), `src/component-docs/ui/Layout.mdx`

**Interfaces:**
- Consumes: `AppShell`, `useAppShell`, `Sidebar` (Task 6); `Spinner` (Task 1); `APP_MENU` and `AppMenu` from `@routes`; `useRouteUtils()` → `{ isActiveLink(path), isAnyRouteActive(paths) }`; `useAuth()` → `{ currentUser: { name, email, picture, userId }, removeCurrentUser }`.
- Produces: `AppLayout` (the route element for every signed-in page) and `AppHeader` (the content of `AppShell.Header`).

- [ ] **Step 1: Write the failing test**

`src/layouts/app-layout/AppLayout.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { ThemeProvider } from '@contexts';
import { AppLayout } from '@layouts';

import '../../i18n';

afterEach(cleanup);

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: '/members', element: <p>Members page</p> }, { path: '/dashboard', element: <p>Dashboard page</p> }] }],
    { initialEntries: [path] },
  );
  return render(
    <ThemeProvider>
      <Tooltip.Provider>
        <RouterProvider router={router} />
      </Tooltip.Provider>
    </ThemeProvider>,
  );
};

describe('AppLayout', () => {
  it('renders the page inside the shell and marks the current route', async () => {
    renderAt('/members');
    expect(await screen.findByText('Members page')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Members' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('group', { name: 'Account' })).toBeTruthy();
    expect(screen.getByRole('main').textContent).toContain('Members page');
  });

  it('puts search, theme, language and the user menu in the header', async () => {
    renderAt('/dashboard');
    await screen.findByText('Dashboard page');
    const header = document.querySelector('[data-slot="app-shell-header"]') as HTMLElement;
    expect(header.querySelector('[aria-label="Open command palette"]')).not.toBeNull();
    expect(header.querySelector('[aria-label="Open user menu"]')).not.toBeNull();
    expect(header.querySelector('[aria-label="Notifications"]')).not.toBeNull();
    expect(header.innerHTML).not.toMatch(/text-muted-foreground|bg-secondary|ring-primary|bg-background/);
    expect(document.querySelector('[data-slot="sidebar-footer"]')?.textContent).toContain('Mohammad Safia');
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/layouts/app-layout`
Expected: FAIL. `AppLayout` is not exported from `@layouts`.

- [ ] **Step 3: Add the key**

`header.json` EN: `"avatarAlt": "{{name}}'s profile picture"`. AR: `"avatarAlt": "الصورة الشخصية لـ {{name}}"`.

- [ ] **Step 4: Implement AppHeader**

`src/layouts/app-header/AppHeader.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';

import { Avatar, Button, DropdownMenu, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';
import { AppShell, LanguageSwitcher, ThemeSwitcher } from '@components/shared';

import { useCommandPalette } from '@contexts';
import { useAppTranslation, useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { Bell, LogOut, Search, Settings, User } from 'lucide-react';

function AppHeader() {
  const navigate = useNavigate();
  const { t } = useAppTranslation('header');
  const { currentUser, removeCurrentUser } = useAuth();
  const { toggle } = useCommandPalette();

  return (
    <>
      <AppShell.MenuButton />

      <button
        type="button"
        onClick={toggle}
        aria-label={t('openCommandPalette')}
        className="text-fg-muted bg-surface border-border hover:bg-hover hover:text-fg focus-visible:ring-ring h-control-md flex w-full max-w-xs items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />

        <span className="flex-1 truncate text-start">{t('searchPlaceholder')}</span>

        <kbd className="bg-surface-sunken text-fg-muted border-border text-2xs pointer-events-none hidden rounded-sm border px-1.5 font-mono sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-1">
        <IconButton aria-label={t('notifications')}>
          <Bell aria-hidden="true" />
        </IconButton>

        <ThemeSwitcher />

        <LanguageSwitcher />

        <div aria-hidden="true" className="bg-border mx-1 hidden h-5 w-px md:block" />

        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" className="size-8 rounded-full p-0" aria-label={t('openUserMenu')}>
              <Avatar size="md">
                <Conditional.If condition={!!currentUser?.picture}>
                  <Avatar.Image src={currentUser?.picture} alt={t('avatarAlt', { name: currentUser?.name })} />
                </Conditional.If>

                <Avatar.Fallback className="text-xs">
                  <Conditional>
                    <Conditional.If condition={!!currentUser?.name}>{currentUser?.name?.charAt(0)?.toUpperCase()}</Conditional.If>

                    <Conditional.Else>
                      <User aria-hidden="true" className="size-3.5" />
                    </Conditional.Else>
                  </Conditional>
                </Avatar.Fallback>
              </Avatar>
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content className="w-56" align="end">
            <DropdownMenu.Label className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-fg text-sm leading-none font-medium">{currentUser?.name}</p>

                <p className="text-fg-muted text-xs leading-none">{currentUser?.email}</p>
              </div>
            </DropdownMenu.Label>

            <DropdownMenu.Separator />

            <DropdownMenu.Group>
              <DropdownMenu.Item onClick={() => navigate(FULL_ROUTES_PATH.HOME.INDEX)}>
                <User aria-hidden="true" />
                {t('myProfile')}
              </DropdownMenu.Item>

              <DropdownMenu.Item onClick={() => navigate(FULL_ROUTES_PATH.SETTINGS.INDEX)}>
                <Settings aria-hidden="true" />
                {t('settings')}
              </DropdownMenu.Item>
            </DropdownMenu.Group>

            <DropdownMenu.Separator />

            <DropdownMenu.Item onClick={removeCurrentUser}>
              <LogOut aria-hidden="true" />
              {t('logout')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </>
  );
}

export default AppHeader;
```

`index.ts`: `export { default as AppHeader } from './AppHeader';`

Changes from DashboardHeader:
- The `forceMount` on the menu content is removed: it kept a hidden menu in the DOM.
- The `ring-primary/20` avatar halo is removed.
- Settings now navigates.

DropdownMenu.Item already sizes and spaces its icons (SP2), so the `me-2 h-4 w-4` classes are gone.

- [ ] **Step 5: Implement AppLayout**

`src/layouts/app-layout/AppLayout.tsx`:

```tsx
import { Suspense, useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import { Avatar, Spinner } from '@components/ui';
import { Conditional } from '@components/utils';
import { AppShell, CommandPalette, Sidebar, Toaster, useAppShell } from '@components/shared';

import { CommandPaletteProvider } from '@contexts';
import { AppHeader } from '@layouts/app-header';
import { useAppTranslation, useAuth } from '@hooks/shared';
import { useRouteUtils } from '@hooks/utils';

import { cn } from '@utils';
import { APP_MENU, type AppMenu } from '@routes';
import { APP_CONFIGURATIONS } from '@app-config';

const DEFAULT_GROUP = 'main';

type MenuGroup = { label: string; items: AppMenu[] };

const groupMenu = (menu: AppMenu[]): MenuGroup[] => {
  const groups = new Map<string, AppMenu[]>();

  for (const item of menu) {
    const label = item.group ?? DEFAULT_GROUP;
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  return [...groups].map(([label, items]) => ({ label, items }));
};

function AppSidebar() {
  const { t } = useAppTranslation('nav');
  const { currentUser } = useAuth();
  const { collapsed } = useAppShell();
  const { isActiveLink, isAnyRouteActive } = useRouteUtils();

  const groups = useMemo(() => groupMenu(APP_MENU), []);

  return (
    <Sidebar>
      <Sidebar.Header>
        <div className={cn('flex min-w-0 items-center gap-2.5', collapsed && 'md:hidden')}>
          <span aria-hidden="true" className="bg-fg text-canvas flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
            {APP_CONFIGURATIONS.APP_NAME.charAt(0)}
          </span>

          <span className="text-fg truncate text-sm font-semibold">{APP_CONFIGURATIONS.APP_NAME}</span>
        </div>

        <Sidebar.CollapseButton />
      </Sidebar.Header>

      <Sidebar.Content>
        {groups.map((group) => (
          <Sidebar.Group key={group.label} label={t(`groups.${group.label}`)}>
            {group.items.map((route) => (
              <Conditional key={route.id}>
                <Conditional.If condition={!!route.submenu?.length}>
                  <Sidebar.SubMenu
                    icon={route.icon}
                    label={t(route.id)}
                    active={isAnyRouteActive(route.submenu?.map((sub) => sub.path) ?? [])}
                  >
                    {route.submenu?.map((sub) => (
                      <Sidebar.Item key={sub.id} href={sub.path} icon={sub.icon} active={isActiveLink(sub.path)}>
                        {t(sub.id)}
                      </Sidebar.Item>
                    ))}
                  </Sidebar.SubMenu>
                </Conditional.If>

                <Conditional.Else>
                  <Sidebar.Item href={route.path} icon={route.icon} active={isActiveLink(route.path)}>
                    {t(route.id)}
                  </Sidebar.Item>
                </Conditional.Else>
              </Conditional>
            ))}
          </Sidebar.Group>
        ))}
      </Sidebar.Content>

      <Sidebar.Footer>
        <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center')}>
          <Avatar size="md" className="shrink-0">
            <Conditional.If condition={!!currentUser?.picture}>
              <Avatar.Image src={currentUser?.picture} alt="" />
            </Conditional.If>

            <Avatar.Fallback className="text-xs">{currentUser?.name?.charAt(0)?.toUpperCase()}</Avatar.Fallback>
          </Avatar>

          <div className={cn('min-w-0 flex-1', collapsed && 'md:sr-only')}>
            <p className="text-fg truncate text-sm font-medium">{currentUser?.name}</p>

            <p className="text-fg-muted truncate text-xs">{currentUser?.email}</p>
          </div>
        </div>
      </Sidebar.Footer>
    </Sidebar>
  );
}

function AppLayout() {
  return (
    <CommandPaletteProvider>
      <AppShell sidebar={<AppSidebar />}>
        <AppShell.Header>
          <AppHeader />
        </AppShell.Header>

        <AppShell.Content>
          <Suspense fallback={<Spinner overlay size="lg" />}>
            <Outlet />
          </Suspense>
        </AppShell.Content>
      </AppShell>

      <Toaster />

      <CommandPalette />
    </CommandPaletteProvider>
  );
}

export default AppLayout;
```

`index.ts`: `export { default as AppLayout } from './AppLayout';`

About the imports:
- The footer avatar `alt=""` is deliberate: the name is printed beside it.
- Check that `@hooks/utils` is the barrel exporting `useRouteUtils`: `grep -rn "useRouteUtils" src/lib/hooks/utils/index.ts`. If the barrel is elsewhere, use the path the old `DashboardSidebarLink` imported it from.
- Check `@layouts/app-header`: `grep -n "@layouts" tsconfig*.json vite.config.ts`. If only `@layouts` (no subpath) is aliased, import with `../app-header` (relative). Importing from the `@layouts` barrel inside a layout would be a module-load cycle.

- [ ] **Step 6: Rewire the router and delete the old layouts**

In `router.tsx`, change `import { AuthGuard, AuthLayout, DashboardLayout, ErrorBoundary } from '@layouts';` to `import { AppLayout, AuthGuard, AuthLayout, ErrorBoundary } from '@layouts';`, and `element: <DashboardLayout />` to `element: <AppLayout />`.

`src/layouts/index.ts` becomes:

```ts
export * from './app-header';
export * from './app-layout';
export * from './auth-guard';
export * from './auth-layout';
export * from './error-boundary';
```

```bash
git rm -rq src/layouts/dashboard-layout src/layouts/dashboard-sidebar src/layouts/dashboard-sidebar-drawer \
  src/layouts/dashboard-sidebar-link src/layouts/dashboard-header src/components/ui/layout src/component-docs/ui/Layout.mdx
```

Drop `export * from './layout';` from `src/components/ui/index.ts`.

Both greps must print nothing:
- `grep -rn "DashboardLayout\|DashboardSidebar\|DashboardHeader\|SidebarSubLink" src`
- `grep -rn "Layout\.\(Header\|Content\|Sidebar\)" src`

- [ ] **Step 7: Run tests**

Run: `P exec vp test --run src tests/i18n > $WS/t7.log 2>&1; tail -15 $WS/t7.log && P exec tsc -b`
Expected: PASS and exit 0. The `Layout.test.tsx` cases are gone with the folder. Their concerns (the sticky shadow and the dead scroll listener) are covered by AppShell's sentinel.

- [ ] **Step 8: Commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && git commit -m "feat(layouts): AppLayout and AppHeader on AppShell + Sidebar; retire the dashboard layouts and ui/layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Auth layout, error boundary and route placeholders

**Files:**
- Modify: `src/layouts/auth-layout/AuthLayout.tsx`, `src/layouts/error-boundary/ErrorBoundary.tsx`, `src/routes/RoutePlaceholders.tsx`
- Create: `src/layouts/error-boundary/ErrorBoundary.test.tsx`, `src/routes/RoutePlaceholders.test.tsx`

**Interfaces:**
- Consumes: `EmptyState` with `kind`, `title`, `description`, `titleAs` and `.Actions` (Task 2); `PageHeader` (Task 3).

- [ ] **Step 1: Write the failing tests**

`src/layouts/error-boundary/ErrorBoundary.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ErrorBoundary } from '@layouts';

import '../../i18n';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const Boom = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('shows an error EmptyState as the page heading with recovery actions', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <ErrorBoundary /> }]);
    render(<RouterProvider router={router} />);

    const alert = await screen.findByRole('alert');
    expect(alert.getAttribute('data-kind')).toBe('error');
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    expect(document.body.innerHTML).not.toMatch(/destructive|text-foreground|bg-background/);
  });
});
```

`src/routes/RoutePlaceholders.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { NotFound, SettingsPlaceholder } from './RoutePlaceholders';

import '../i18n';

afterEach(cleanup);

describe('route placeholders', () => {
  it('NotFound is a level-1 no-results state with a way home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/');
    expect(document.body.innerHTML).not.toMatch(/text-primary|text-foreground|text-muted-foreground/);
  });

  it('Settings uses the page header', () => {
    render(
      <MemoryRouter>
        <SettingsPlaceholder />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' }).closest('[data-slot="page-header"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run them**

Run: `P exec vp test --run src/layouts/error-boundary src/routes`
Expected: FAIL. There is no `alert` role, and the legacy classes are present.

- [ ] **Step 3: Implement**

`ErrorBoundary.tsx`:

```tsx
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@components/ui';
import { EmptyState } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { ArrowLeft, Home, RefreshCw } from 'lucide-react';

function ErrorBoundary() {
  const navigate = useNavigate();
  const { t } = useAppTranslation('errors');

  return (
    <div className="bg-canvas flex min-h-dvh items-center justify-center p-6 md:p-12">
      <EmptyState kind="error" titleAs="h1" title={t('boundary.title')} description={t('boundary.description')} className="max-w-lg">
        <EmptyState.Actions>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden="true" />
            {t('boundary.refresh')}
          </Button>

          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
            {t('boundary.goBack')}
          </Button>

          <Button variant="ghost" asChild>
            <Link to={FULL_ROUTES_PATH.HOME.INDEX}>
              <Home aria-hidden="true" />
              {t('boundary.home')}
            </Link>
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  );
}

export default ErrorBoundary;
```

`AuthLayout.tsx`: replace the inner `div` with:

```tsx
      <main className="bg-canvas text-fg flex min-h-dvh items-center justify-center p-6">
        <Outlet />
      </main>
```

`RoutePlaceholders.tsx`:

```tsx
import { Link } from 'react-router-dom';

import { Button } from '@components/ui';
import { EmptyState, PageHeader } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from './routes';

export function NotFound() {
  const { t } = useAppTranslation('errors');

  return (
    <div className="bg-canvas flex min-h-dvh items-center justify-center p-6">
      <EmptyState kind="no-results" titleAs="h1" title={t('notFound.title')} description={t('notFound.description')}>
        <EmptyState.Actions>
          <Button variant="outline" asChild>
            <Link to={FULL_ROUTES_PATH.HOME.INDEX}>{t('notFound.backHome')}</Link>
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  );
}

export function SettingsPlaceholder() {
  const { t } = useAppTranslation('nav');

  return <PageHeader title={t('settings')} />;
}

export function LoginPlaceholder() {
  const { t } = useAppTranslation('auth');

  return <h1 className="text-fg text-xl font-semibold">{t('login.title')}</h1>;
}
```

Check that `routes/RoutePlaceholders.tsx` importing `@components/shared` does not form a module-load cycle. `shared` → `Breadcrumb` → `@routes` → `router.tsx` → `RoutePlaceholders` → `shared` is a cycle, but every use is at render time, not at module load, so it is safe. If `tsc` passes and the test fails with `undefined` for `PageHeader`, import `PageHeader` and `EmptyState` by direct path (`@components/shared/page-header/PageHeader`, `@components/ui/empty-state/EmptyState`) and ledger a ruling.

- [ ] **Step 4: Run tests**

Run: `P exec vp test --run src/layouts src/routes && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 5: Commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(layouts): error boundary and not-found on EmptyState; auth layout and placeholders on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Tables — tokens, i18n strings, `meta.numeric`, Arabic plurals

**Files:**
- Modify: `src/components/tables/data-table/data-table-toolbar/DataTableToolbar.tsx`, `data-table-pagination/DataTablePagination.tsx`, `data-table-content/DataTableContent.tsx`
- Modify: `src/components/tables/data-table-filters/async-select-filter/AsyncSelectFilter.tsx:107,139`, `select-filter/SelectFilter.tsx:87`
- Modify: `src/types/DataTable.ts:62-73` (`numeric?: boolean`)
- Modify: `src/locales/{en,ar}/common.json` (`table.total_*`, `table.totalWithLabel`, `selectedCount_*`, `loadingMore`, `filters`)
- Delete: `src/assets/icons/SortIcon.tsx` (its only user is DataTableContent) and its line in `src/assets/icons/index.ts`
- Create: `src/components/tables/data-table/DataTable.test.tsx`

**Interfaces:**
- Produces: `ColumnMeta.numeric?: boolean`. DataTableContent forwards it to `Table.Head numeric` and `Table.Cell numeric`.
- Total-count copy:
  - `t('table.total', { count })` is plural ("12 results"), and digits stay Western.
  - With a `totalLabel`, the toolbar uses `t('table.totalWithLabel', { label, count })` → "Members: 12". The caller's noun is never pluralised by us.
- Ruling carried in this plan: the spec asks for Arabic plurals on `table.total`. A caller-supplied noun cannot be pluralised generically, so the plural form uses the generic noun "result" and the labelled form is `label: count`. Cost if wrong: one key rename.

- [ ] **Step 1: Write the failing test**

`src/components/tables/data-table/DataTable.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { type ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DataTable } from '@components/tables';

import i18n from '../../../i18n';

type Visit = { patient: string; amount: number };

const columns: ColumnDef<Visit>[] = [
  { accessorKey: 'patient', header: 'Patient' },
  { accessorKey: 'amount', header: 'Amount', meta: { numeric: true } },
];

const rows: Visit[] = [
  { patient: 'Sara Haddad', amount: 1250 },
  { patient: 'Omar Nasser', amount: 80 },
];

function Harness({ total, label }: { total?: number; label?: string }) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableGlobalFilter: true,
  });

  return (
    <DataTable table={table}>
      <DataTable.Toolbar totalCount={total} totalLabel={label} />
      <DataTable.Content />
      <DataTable.Pagination />
    </DataTable>
  );
}

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('DataTable', () => {
  it('forwards meta.numeric to the header and cells', () => {
    render(<Harness />);
    expect(screen.getByRole('columnheader', { name: 'Amount' }).getAttribute('data-numeric')).toBe('true');
    expect(screen.getByText('1250').closest('td')?.getAttribute('data-numeric')).toBe('true');
    expect(screen.getByText('Sara Haddad').closest('td')?.getAttribute('data-numeric')).toBeNull();
  });

  it('translates the toolbar and pagination text', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Harness total={2} />);
    expect(screen.getByText(i18n.t('common:pagination.rowsPerPage'))).toBeTruthy();
    expect(screen.getByPlaceholderText(i18n.t('common:searchHere'))).toBeTruthy();
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.textContent).toContain('نتيجتان');
  });

  it('uses the Arabic many form for eleven and Western digits', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Harness total={11} />);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.textContent).toContain('11 نتيجةً');
  });

  it('keeps a caller label as "label: count"', () => {
    render(<Harness total={1} label="Members" />);
    expect(document.querySelector('[data-slot="data-table-toolbar"]')?.textContent).toContain('Members: 1');
  });

  it('uses no legacy classes', () => {
    render(<Harness total={2} />);
    const html = document.querySelector('[data-slot="data-table"]')?.innerHTML ?? '';
    expect(html).not.toMatch(/bg-background|text-muted-400|bg-primary-25|muted-200|bg-muted-50|fill-primary|(^|\s)shadow(\s|")/);
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/components/tables`
Expected: FAIL. `data-numeric` is missing, the strings are hard-coded and legacy classes are present. The `meta: { numeric: true }` line also fails type-checking until Step 4.

- [ ] **Step 3: Add the keys**

EN `common.json`:
- top level: `"loadingMore": "Loading more…"`, `"filters": "Filters"`
- replace `"selectedCount"` with `"selectedCount_one": "{{count}} selected"`, `"selectedCount_other": "{{count}} selected"`
- inside `table`, replace `"total"` with:

```json
    "total_one": "{{count}} result",
    "total_other": "{{count}} results",
    "totalWithLabel": "{{label}}: {{count}}",
```

AR `common.json`:
- top level: `"loadingMore": "جارٍ تحميل المزيد…"`, `"filters": "عوامل التصفية"`
- replace `"selectedCount"` with:

```json
  "selectedCount_zero": "لم يُحدَّد شيء",
  "selectedCount_one": "عنصر واحد محدد",
  "selectedCount_two": "عنصران محددان",
  "selectedCount_few": "{{count}} عناصر محددة",
  "selectedCount_many": "{{count}} عنصرًا محددًا",
  "selectedCount_other": "{{count}} عنصر محدد",
```

- inside `table`, replace `"total"` with:

```json
    "total_zero": "لا توجد نتائج",
    "total_one": "نتيجة واحدة",
    "total_two": "نتيجتان",
    "total_few": "{{count}} نتائج",
    "total_many": "{{count}} نتيجةً",
    "total_other": "{{count}} نتيجة",
    "totalWithLabel": "{{label}}: {{count}}",
```

Run `grep -rn "selectedCount'\|table.total'" src` and update any caller to pass `{ count }`. FacetedFilter's hard-coded "selected" is handled in Task 11.

- [ ] **Step 4: Type and content**

In `src/types/DataTable.ts` `ColumnMeta`, add after `label?: string;`:

```ts
    /** Right-align (end-align) and use tabular figures for this column. */
    numeric?: boolean;
```

In `DataTableContent.tsx`:
- Replace `import { SortIcon } from '@assets/icons';` with `import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';`.
- The `ScrollArea` className becomes `cn('bg-surface border-border min-h-0 flex-1 rounded-lg border', className)`.
- On `Table.Head`, add `numeric={header.column.columnDef.meta?.numeric}`. The inner `div` becomes `cn('flex items-center gap-1', header.column.columnDef.meta?.numeric && 'justify-end')`.
- Replace the `<SortIcon direction={sortDirection} />` span with:

```tsx
                          <span aria-hidden="true" className={cn('inline-flex shrink-0 [&_svg]:size-3.5', sortDirection ? 'text-fg' : 'text-fg-subtle')}>
                            <Conditional>
                              <Conditional.If condition={sortDirection === 'asc'}>
                                <ArrowUp />
                              </Conditional.If>

                              <Conditional.If condition={sortDirection === 'desc'}>
                                <ArrowDown />
                              </Conditional.If>

                              <Conditional.Else>
                                <ChevronsUpDown />
                              </Conditional.Else>
                            </Conditional>
                          </span>
```

- On `Table.Cell`, add `numeric={cell.column.columnDef.meta?.numeric}`.

Check that `Table.Cell` sets `data-numeric` the way `Table.Head` does (`grep -n "data-numeric" src/components/ui/table/Table.tsx`). If only Head does, add `data-numeric={numeric || undefined}` to Cell in the same commit and ledger a ruling.

Delete `SortIcon.tsx` and its line in `src/assets/icons/index.ts`.

- [ ] **Step 5: Toolbar**

Rewrite the `return` of `DataTableToolbar` and its strings. Add `import { useId } from 'react'` (merge into the react import) and `import { useAppTranslation } from '@hooks/shared';` (merge). Replace the lucide import with `import { Search, SlidersHorizontal } from 'lucide-react';`. Inside the component:

```tsx
  const { t } = useAppTranslation('common');
  const filtersId = useId();
```

```tsx
  const hasFilters = filterableColumns.length > 0;
  const filtersOpen = showFilters && hasFilters;

  return (
    <div data-slot="data-table-toolbar" className={cn('bg-surface border-border flex w-full flex-col rounded-lg border', className)}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2">
        <div className="flex flex-1 items-center">
          <Conditional.If condition={totalCount !== undefined}>
            <span className="text-fg-muted text-xs font-medium whitespace-nowrap">
              <Conditional>
                <Conditional.If condition={!!totalLabel}>{t('table.totalWithLabel', { label: totalLabel, count: totalCount })}</Conditional.If>

                <Conditional.Else>{t('table.total', { count: totalCount })}</Conditional.Else>
              </Conditional>
            </span>
          </Conditional.If>
        </div>

        <Conditional.If condition={!!table?.options?.enableGlobalFilter}>
          <div className="relative">
            <Search aria-hidden="true" className="text-fg-subtle pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />

            <Input
              type="search"
              size="sm"
              name="data-table-search"
              aria-label={placeholder ?? t('search')}
              placeholder={placeholder ?? t('searchHere')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-60 ps-8"
            />
          </div>
        </Conditional.If>

        {children}

        <Conditional.If condition={hasFilters}>
          <Button variant="ghost" size="sm" aria-expanded={filtersOpen} aria-controls={filtersId} onClick={onToggleFilters}>
            <SlidersHorizontal aria-hidden="true" />
            {t('filter')}
            <Conditional.If condition={isFiltered}>
              <span className="bg-accent-subtle text-accent text-2xs rounded-full px-1.5 font-mono tabular-nums">{activeFilterCount}</span>
            </Conditional.If>
          </Button>
        </Conditional.If>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          filtersOpen ? 'grid-rows-[1fr]' : 'invisible grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            id={filtersId}
            role="toolbar"
            aria-orientation="horizontal"
            aria-label={t('filters')}
            className="border-border-subtle flex items-center gap-3 border-t px-4 py-2"
          >
            <div className="flex flex-1 flex-wrap items-center gap-1">
              {filterableColumns.map((column) => (
                <DataTableFacetedFilter key={column.id} column={column} />
              ))}
            </div>

            <Conditional.If condition={isFiltered}>
              <Button variant="ghost" tone="accent" size="sm" onClick={onReset}>
                {t('clearAll')}
              </Button>
            </Conditional.If>
          </div>
        </div>
      </div>
    </div>
  );
```

`grid-rows-[0fr]` and `grid-rows-[1fr]` are the existing arbitrary values. If the baseline counts them as `arbitrary-length`, keep them: the count must not rise (`P ds:baseline` refuses a regression).

- [ ] **Step 6: Pagination**

In `DataTablePagination.tsx`:
- Add `useId` (merge) and `useAppTranslation`.
- Inside the component: `const { t } = useAppTranslation('common'); const rowsLabelId = useId();`.
- Replace the `return` with:

```tsx
  return (
    <div data-slot="data-table-pagination" className={cn('flex w-full flex-wrap items-center justify-between gap-4', className)}>
      <span className="text-fg-muted text-xs">{t('pagination.pageOf', { current: currentPage, total: Math.max(totalPages, 1) })}</span>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span id={rowsLabelId} className="text-fg-muted text-xs whitespace-nowrap">
            {t('pagination.rowsPerPage')}
          </span>

          <Select value={`${table.getState().pagination.pageSize}`} onValueChange={handlePageSizeChange}>
            <Select.Trigger size="sm" aria-labelledby={rowsLabelId} className="w-20">
              <Select.Value placeholder={table.getState().pagination.pageSize} />

              <Select.Icon />
            </Select.Trigger>

            <Select.Content side="top">
              {pageSizeOptions.map((pageSize) => (
                <Select.Item key={pageSize} value={`${pageSize}`}>
                  <Select.Text>{pageSize}</Select.Text>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <Pagination className="w-fit p-0">
          {/* Pagination.List … unchanged, except the page label below */}
        </Pagination>
      </div>
    </div>
  );
```

Keep the `Pagination.List` block exactly as it is today, with one change: `{page.toString().padStart(2, '0')}` becomes `{page}`. Zero-padding read as "zero one" to screen readers.

- [ ] **Step 7: Filter strings**

| File | Old | New |
|---|---|---|
| `AsyncSelectFilter.tsx:107` | `>No results</Combobox.Empty>` | `>{t('noResults')}</Combobox.Empty>` |
| `AsyncSelectFilter.tsx:139` | `message="Loading more..."` | `message={t('loadingMore')}` |
| `SelectFilter.tsx:87` | `>No results</Combobox.Empty>` | `>{t('noResults')}</Combobox.Empty>` |

Add `const { t } = useAppTranslation('common');` to each component (`import { useAppTranslation } from '@hooks/shared';`) unless a `t` from `common` already exists. If the file already uses another namespace's `t`, call this one `tCommon`.

- [ ] **Step 8: Run tests**

Run: `P exec vp test --run src/components/tables tests/i18n && P exec tsc -b`
Expected: PASS (5 DataTable tests, parity green) and exit 0.

- [ ] **Step 9: Commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && git commit -m "feat(tables): tokens, translated toolbar/pagination/filters, meta.numeric, Arabic plurals; retire SortIcon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Calendar views — i18n, locale axis, hidden dates, DateNavigation

**Files:**
- Modify: `src/components/calendar/calendar-grid/calendar-grid-chrome/CalendarGridChrome.tsx:54-120` (tabs, toggle labels, picker tooltip)
- Modify: `src/components/calendar/calendar-grid/calendar-grid-month-view/CalendarGridMonthView.tsx:19-40,77-79,110` (weekday headers, hidden date, "+N more")
- Modify: `src/components/calendar/calendar-grid/calendar-grid-time-view/CalendarGridTimeView.tsx:204,214-228` (hour-only axis, hidden date)
- Modify: `src/components/shared/date-navigation/DateNavigation.tsx`
- Modify: `src/lib/hooks/shared/useDate.ts` (`DateFormats.WEEKDAY_SHORT = 'EEE'`, `TimeFormats.HOUR_12 = 'h a'`, unless equivalents exist)
- Modify: `src/locales/{en,ar}/common.json` (`calendar.*`)
- Create: `src/components/calendar/calendar-grid/CalendarGrid.test.tsx`, `src/components/shared/date-navigation/DateNavigation.test.tsx`

**Interfaces:**
- Keys:
  - `common.calendar.{day, week, month, views, listView, calendarView, jumpToDate, today, more}`
  - `more` is `"+{{count}} more"`
  - `views` is the accessible name of the Day/Week/Month tab list
- Ruling carried in this plan: the spec names `Intl.DateTimeFormat` with `numberingSystem: 'latn'` for the axis. `useDate().formatHour` already formats with the date-fns locale and `toLatinDigits`, which gives the same output ("9 AM" / "9 ص") with one formatting path for the whole kit. Cost if wrong: none visible; swapping the formatter later is internal.

- [ ] **Step 1: Write the failing tests**

`src/components/calendar/calendar-grid/CalendarGrid.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarGrid, type CalendarView } from '@components/calendar';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

type Visit = { id: string; start: string; end: string; patient: string };

const visits: Visit[] = [{ id: '1', start: '2026-10-16T10:00:00', end: '2026-10-16T10:30:00', patient: 'Sara Haddad' }];

const accessors = { getId: (v: Visit) => v.id, getStartTime: (v: Visit) => v.start, getEndTime: (v: Visit) => v.end };

const renderGrid = (view: CalendarView) =>
  render(
    <Tooltip.Provider>
      <CalendarGrid initialView={view} initialDate="2026-10-16" events={visits} eventAccessors={accessors} startHour={9} endHour={11}>
        <CalendarGrid.Header>
          <CalendarGrid.ViewTabs />
          <CalendarGrid.ViewToggle />
        </CalendarGrid.Header>
        <CalendarGrid.EventTemplate<Visit>>{(visit) => visit.patient}</CalendarGrid.EventTemplate>
        <CalendarGrid.DayView />
        <CalendarGrid.MonthView />
      </CalendarGrid>
    </Tooltip.Provider>,
  );

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const ARABIC_INDIC_DIGIT = /[٠-٩]/;

describe('CalendarGrid localisation', () => {
  it('translates the view tabs and the list/calendar toggle', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderGrid('month');
    expect(screen.getByRole('tablist', { name: 'طرق العرض' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'شهر' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'عرض القائمة' })).toBeTruthy();
  });

  it('renders weekday headers in the active language', async () => {
    renderGrid('month');
    expect(screen.getByText('Sun')).toBeTruthy();
    cleanup();

    await act(() => i18n.changeLanguage('ar'));
    renderGrid('month');
    expect(screen.queryByText('Sun')).toBeNull();
    expect(screen.queryByText('SUN')).toBeNull();
  });

  it('labels the time axis by hour in Arabic with Western digits', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderGrid('day');
    expect(document.body.textContent).toContain('9 ص');
    expect(document.body.textContent).not.toMatch(ARABIC_INDIC_DIGIT);
    expect(document.body.textContent).not.toContain(':00');
  });

  it('gives event chips and cards a hidden date for screen readers', () => {
    renderGrid('month');
    const chipDate = [...document.querySelectorAll('.sr-only')].map((node) => node.textContent);
    expect(chipDate.some((text) => text?.includes('October 16, 2026'))).toBe(true);
    cleanup();

    renderGrid('day');
    const cardDate = screen.getByText('Sara Haddad').parentElement?.querySelector('.sr-only');
    expect(cardDate?.textContent).toContain('October 16, 2026');
  });
});
```

`ToggleGroup type="single"` items are Radix `radio`s. If the role is `button` in this build, assert `getByRole('button', { name: 'عرض القائمة' })` and ledger a ruling. Either way the name is what is being tested.

`src/components/shared/date-navigation/DateNavigation.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DateNavigation } from '@components/shared';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('DateNavigation', () => {
  it('translates Today, mirrors the arrows and uses gap spacing', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <Tooltip.Provider>
        <DateNavigation date="2026-10-16" handlePrevious={vi.fn()} handleNext={vi.fn()} onSetDate={vi.fn()} />
      </Tooltip.Provider>,
    );
    expect(screen.getByRole('button', { name: 'اليوم' })).toBeTruthy();
    const root = document.querySelector('[data-slot="date-navigation"]') as HTMLElement;
    expect(root.className).toContain('gap-2');
    expect(root.className).not.toContain('space-x-');
    root.querySelectorAll('[data-slot="icon-button"] svg').forEach((svg) => expect(svg.getAttribute('class')).toContain('rtl:-scale-x-100'));
  });
});
```

- [ ] **Step 2: Run them**

Run: `P exec vp test --run src/components/calendar src/components/shared/date-navigation`
Expected: FAIL on the English-only labels, `SUN` headers, `h:mm a` axis labels, the missing hidden date, and the hard-coded "Today".

- [ ] **Step 3: Add the keys and formats**

EN `common.json`, inside `calendar` (after `nextMonth`):

```json
    "day": "Day",
    "week": "Week",
    "month": "Month",
    "views": "Views",
    "listView": "List view",
    "calendarView": "Calendar view",
    "jumpToDate": "Jump to date",
    "today": "Today",
    "more": "+{{count}} more"
```

AR, inside `calendar`:

```json
    "day": "يوم",
    "week": "أسبوع",
    "month": "شهر",
    "views": "طرق العرض",
    "listView": "عرض القائمة",
    "calendarView": "عرض التقويم",
    "jumpToDate": "الانتقال إلى تاريخ",
    "today": "اليوم",
    "more": "+{{count}} أخرى"
```

In `useDate.ts`, check `grep -n "'EEE'\|'h a'" src/lib/hooks/shared/useDate.ts`. If either is missing, add it:
- `DateFormats`: `// Example: "Sun"` then `WEEKDAY_SHORT = 'EEE',`
- `TimeFormats`: `// Example: "9 AM"` then `HOUR_12 = 'h a',`

- [ ] **Step 4: Chrome**

In `CalendarGridChrome.tsx`:
- `ViewTabs` gets `const { t } = useAppTranslation('common');`.
- `<Tabs.List variant="contained" fullWidth>` becomes `<Tabs.List variant="contained" fullWidth aria-label={t('calendar.views')}>`.
- The three triggers render `{t('calendar.day')}`, `{t('calendar.week')}` and `{t('calendar.month')}`.
- `ViewToggle` gets `t` the same way, with `aria-label={t('calendar.listView')}` and `aria-label={t('calendar.calendarView')}`.
- Its icons become `<ListIcon aria-hidden="true" />` and `<CalendarIcon aria-hidden="true" />`; ToggleGroup sizes icons.
- `Picker` gets `t`, with `triggerTooltip={t('calendar.jumpToDate')}`.

- [ ] **Step 5: Month view**

In `CalendarGridMonthView.tsx`:
- Delete `WEEK_HEADERS`.
- In `MonthView`, add `const { t } = useAppTranslation('common');` (import from `@hooks/shared`, merged with `useDate`).
- Build the headers from the locale. 1 January 2023 was a Sunday, matching the grid's Sunday start:

```tsx
  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => formatDate(new Date(2023, 0, 1 + index), constants.DateFormats.WEEKDAY_SHORT)),
    [formatDate, constants.DateFormats.WEEKDAY_SHORT],
  );
```

Render the headers as:

```tsx
        {weekdays.map((day) => (
          <CalendarMonthGrid.Weekday key={day}>{day}</CalendarMonthGrid.Weekday>
        ))}
```

`useMemo` must sit above the `if (view !== 'month' …) return null;` line (rules of hooks).

- `+{overflowEvents.length} more` becomes `{t('calendar.more', { count: overflowEvents.length })}`.
- `MonthEventItem` gets the hidden date:

```tsx
const MonthEventItem: FC<MonthEventItemProps> = ({ event, status }) => {
  const { renderEvent, popoverContent, eventAccessors } = useCalendarGridContext();
  const { formatDate, constants } = useDate();
  const [open, setOpen] = useState(false);

  const trigger = (
    <CalendarMonthGrid.EventChip onClick={popoverContent ? () => setOpen(true) : undefined}>
      <span className="sr-only">{`${formatDate(eventAccessors.getStartTime(event), constants.DateFormats.FULL_MONTH_DAY_YEAR)}, `}</span>
      {renderEvent(event, status)}
    </CalendarMonthGrid.EventChip>
  );
```

The rest of `MonthEventItem` is unchanged.

- [ ] **Step 6: Time view**

In `CalendarGridTimeView.tsx` `TimeAxis`, `constants.TimeFormats.HOUR_MINUTES_12` becomes `constants.TimeFormats.HOUR_12`.

`EventSlot` gets the same hidden prefix:

```tsx
const EventSlot: FC<EventSlotProps> = ({ placement }) => {
  const { renderEvent, popoverContent, eventAccessors } = useCalendarGridContext();
  const { formatDate, constants } = useDate();
  const [open, setOpen] = useState(false);

  const trigger = (
    <CalendarTimeGrid.EventCard
      top={placement.top}
      height={placement.height}
      left={placement.left}
      width={placement.width}
      onClick={popoverContent ? () => setOpen(true) : undefined}
    >
      <span className="sr-only">{`${formatDate(eventAccessors.getStartTime(placement.event), constants.DateFormats.FULL_MONTH_DAY_YEAR)}, `}</span>
      {renderEvent(placement.event, placement.status)}
    </CalendarTimeGrid.EventCard>
  );
```

The test reads `getByText('Sara Haddad').parentElement`. That holds when `renderEvent` returns a bare string, so the text node's element is the card. If `EventCard` wraps its children in an inner element, the sr-only span is the text's sibling inside that wrapper. Either way `parentElement.querySelector('.sr-only')` finds it.

- [ ] **Step 7: DateNavigation**

Replace the `return` in `DateNavigation.tsx`:

```tsx
  return (
    <div data-slot="date-navigation" className="flex items-center gap-2">
      <IconButton variant="outline" aria-label={t('previous')} onClick={handlePrevious}>
        <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
      </IconButton>

      <IconButton variant="outline" aria-label={t('next')} onClick={handleNext}>
        <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
      </IconButton>

      <Button variant="outline" onClick={() => onSetDate(toDate(undefined, constants.DateFormats.ISO_DATE))}>
        {t('calendar.today')}
      </Button>

      <span className="text-fg text-md font-medium lg:text-lg">{toDate(date, constants.DateFormats.FULL_WEEKDAY_SHORT_MONTH_DAY_YEAR)}</span>
    </div>
  );
```

The Today button now matches the icon buttons' height. The old `size="sm"` plus `md:h-9` hack made it a different height from its neighbours.

- [ ] **Step 8: Run tests**

Run: `P exec vp test --run src/components/calendar src/components/shared src/components/ui tests/i18n && P exec tsc -b`
Expected: PASS and exit 0.

The SP2 `CalendarTimeGrid` tests take labels as props, so they are unaffected. The `calendar/ is clean` guard must stay green.

- [ ] **Step 9: Commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && git commit -m "feat(calendar): translated views and weekdays, hour-only locale axis, hidden event dates; DateNavigation RTL and Today

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Remaining shared components — FileCard, FileIcon, FileUploader, Stepper, FacetedFilter, Toaster

**Files:**
- Modify: `src/components/shared/file-card/FileCard.tsx`, `file-icon/FileIcon.tsx:72-73`, `file-uploader/FileUploader.tsx`, `stepper/Stepper.tsx:34-37`, `faceted-filter/FacetedFilter.tsx`, `toaster/Toaster.tsx:22`
- Modify: `src/locales/{en,ar}/common.json` (`fileCard.*`, `toast.action`)
- Create: `src/components/shared/file-card/FileCard.test.tsx`, `src/components/shared/faceted-filter/FacetedFilter.test.tsx`
- Modify: `src/components/shared/file-uploader/FileUploader.test.tsx` (add keyboard cases)

**Interfaces:**
- Consumes: `selectedCount_*` plurals (Task 9); `Spinner` (Task 1); `FormHarness` (`src/test-utils/FormHarness.tsx`, `{ defaultValues, errors, children }`).
- Keys:
  - `common.fileCard.{approve, reject, selectStatus, noOptions, unassigned, noAssignees}`
  - `common.fileCard.documents_*`: plural; the count is rendered separately, so the string is just the noun
  - `common.toast.action`
- Behaviour fixes:
  - The FileUploader file input becomes `sr-only` (keyboard-focusable) instead of `display:none`; the dropzone group shows the focus ring.
  - The download and clear controls become real buttons. This closes the SP3 Plan A deferred minor.

- [ ] **Step 1: Write the failing tests**

`src/components/shared/file-card/FileCard.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FileCard } from '@components/shared';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('FileCard parts', () => {
  it('pluralises the folder count noun per language', async () => {
    render(<FileCard.FolderShape count={1} />);
    expect(screen.getByText('document')).toBeTruthy();
    cleanup();

    await act(() => i18n.changeLanguage('ar'));
    render(<FileCard.FolderShape count={2} />);
    expect(screen.getByText('مستندان')).toBeTruthy();
  });

  it('translates the default approve and reject labels', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <>
        <FileCard.Approve />
        <FileCard.Reject />
      </>,
    );
    expect(screen.getByRole('button', { name: 'اعتماد' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'رفض' })).toBeTruthy();
  });
});
```

`src/components/shared/faceted-filter/FacetedFilter.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FacetedFilter } from '@components/shared';
import { FormHarness } from '@/test-utils/FormHarness';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const options = [
  { label: 'Booked', value: 'booked' },
  { label: 'Arrived', value: 'arrived' },
  { label: 'Completed', value: 'completed' },
];

describe('FacetedFilter', () => {
  it('summarises three or more selections with the plural count', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <FormHarness defaultValues={{ status: ['booked', 'arrived', 'completed'] }}>
        <FacetedFilter name="status" title="الحالة" filterVariant="multi-select" filterOptions={options} />
      </FormHarness>,
    );
    expect(screen.getByText('3 عناصر محددة')).toBeTruthy();
  });

  it('uses the field height for the text variant, not pixel values', () => {
    render(
      <FormHarness defaultValues={{ q: '' }}>
        <FacetedFilter name="q" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('placeholder')).toBe('Search');
    expect(input.outerHTML).not.toMatch(/\[\d+px\]/);
  });
});
```

Check how the Plan A tests import the harness: `grep -rn "FormHarness" src --include='*.test.tsx' | head -1`. Use the same specifier.

Append to `FileUploader.test.tsx`:

```tsx
describe('FileUploader keyboard access', () => {
  it('keeps the file input focusable and the actions as buttons', () => {
    const file = new File(['x'], 'scan.png', { type: 'image/png' });
    render(
      <FileUploader name="scan" value={[file]} onChange={vi.fn()}>
        <FileUploader.DropzoneGroup>
          <FileUploader.Dropzone placeholder="Upload scan" />
          <FileUploader.Actions onDownload={vi.fn()} />
        </FileUploader.DropzoneGroup>
      </FileUploader>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.className).toContain('sr-only');
    expect(input.className).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect(screen.getByRole('button', { name: 'Download' }).tagName).toBe('BUTTON');
    expect(screen.getByRole('button', { name: 'Clear' }).tagName).toBe('BUTTON');
  });
});
```

- [ ] **Step 2: Run them**

Run: `P exec vp test --run src/components/shared/file-card src/components/shared/faceted-filter src/components/shared/file-uploader`
Expected: FAIL. The strings are hard-coded English, the input is `hidden`, and the actions are SVGs with `role="button"`.

- [ ] **Step 3: Add the keys**

EN `common.json`:
- `"fileCard": { "approve": "Approve", "reject": "Reject", "selectStatus": "Select status", "noOptions": "No options", "unassigned": "Unassigned", "noAssignees": "No assignees", "documents_one": "document", "documents_other": "documents" },`
- inside `toast`: `"action": "Notification action"`

AR `common.json`:

```json
  "fileCard": {
    "approve": "اعتماد",
    "reject": "رفض",
    "selectStatus": "اختر الحالة",
    "noOptions": "لا توجد خيارات",
    "unassigned": "غير مُسند",
    "noAssignees": "لا يوجد مُسند إليهم",
    "documents_zero": "مستندات",
    "documents_one": "مستند",
    "documents_two": "مستندان",
    "documents_few": "مستندات",
    "documents_many": "مستندًا",
    "documents_other": "مستند"
  },
```

and inside `toast`: `"action": "إجراء الإشعار"`.

- [ ] **Step 4: FileCard**

Class map:

| Line | Old | New |
|---|---|---|
| 161 | `text-primary-15` | `text-border` |
| 171 | `bg-primary-15` | `bg-surface-sunken` |
| 176 | `text-primary-200` | `text-fg-subtle` |
| 180 | `text-muted-400` | `text-fg-muted` |
| 185 | `text-muted-400` | `text-fg-muted` |
| 236 | `bg-primary-15 rounded-full border-none px-4 py-2 shadow-none` | `bg-surface-sunken rounded-full border-none px-4 shadow-none` (add `size="sm"` to the trigger; the field height comes from the size) |
| 338, 373 | `text-2xs ring-primary-25 … ring-2` | `text-2xs ring-surface … ring-2` |
| 341, 376 | `bg-primary text-primary-foreground` | `bg-fg text-fg-inverse` |
| 350 | `text-muted-400` | `text-fg-muted` |
| 398 | `text-muted-400` | `text-fg-muted` (add `dir="ltr"` and `tabular-nums` to the span: it shows a date value) |
| 411 | `border-primary-25 flex flex-col border transition-transform` | `border-border flex flex-col border transition-transform motion-reduce:transition-none` |

Strings:
- `FolderShape` becomes a function body with `const { t } = useAppTranslation('common');`, rendering `{t('fileCard.documents', { count })}`. The count `<span>` above it gets `tabular-nums`.
- `Approve` and `Reject`:

```tsx
const Approve: FC<ApproveProps> = ({ children, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <ComposedButton variant="outline" size="lg" {...props}>
      {children ?? t('fileCard.approve')}
    </ComposedButton>
  );
};
```

  `Reject` is the same with `tone="danger"` and `t('fileCard.reject')`.
- `Status`: drop the `placeholder = 'Select status'` default. Use `placeholder ?? t('fileCard.selectStatus')` where it is rendered. `No options` becomes `{t('fileCard.noOptions')}`; `"Loading more..."` becomes `{t('loadingMore')}`.
- `Assignee`: drop the `placeholder = 'Unassigned'` default and use `placeholder ?? t('fileCard.unassigned')`. `No assignees` becomes `{t('fileCard.noAssignees')}`; `"Loading more..."` becomes `{t('loadingMore')}`.
- Both components already call `useAppTranslation('common')`. Check that `Assignee` does too, and add it if not.

- [ ] **Step 5: FileIcon, Stepper, Toaster**

`FileIcon.tsx:72-73`:

```ts
      plain: 'text-fg-muted',
      chip: 'bg-surface-sunken text-fg gap-1 rounded-md p-1.5',
```

`Stepper.tsx:34-37`:

```ts
      done: 'text-accent',
      current: 'text-accent',
      error: 'text-danger',
      next: 'text-border-strong',
```

`Toaster.tsx:22`: `'Toast action'` becomes `t('toast.action')`. Toaster already has `t` from `common`. If not, add `const { t } = useAppTranslation('common');`.

- [ ] **Step 6: FileUploader**

`FileUploaderDropzoneGroup` className:

```ts
        'border-border bg-surface text-fg-muted relative flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm transition-colors outline-none',
        'has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-2',
        !disabled && 'hover:border-border-strong',
        disabled && 'bg-surface-sunken text-fg-subtle cursor-not-allowed',
```

`FileUploaderDropzone`:
- The `<input … className="hidden"` becomes `className="peer sr-only"`.
- The uploading `<Loader2Icon size={20} className="animate-spin" />` becomes `<Spinner size="sm" />`, imported from `@components/ui` (ui never imports shared, so there is no cycle). Drop `Loader2Icon` if unused.
- `text-foreground` (line 163) becomes `text-fg`.
- The single-file size span becomes `<span dir="ltr" className="shrink-0 text-xs tabular-nums">`.

`FileUploaderActions`: replace the two SVG "buttons":

```tsx
      <Conditional.If condition={showDownload}>
        <IconButton size="sm" tooltip={false} aria-label={t('download')} className="text-accent" onClick={onDownload}>
          <DownloadIcon aria-hidden="true" />
        </IconButton>
      </Conditional.If>

      <Conditional.If condition={showClear}>
        <IconButton size="sm" tooltip={false} aria-label={t('clear')} className="hover:text-danger" onClick={() => onRemove(0)}>
          <XCircleIcon aria-hidden="true" />
        </IconButton>
      </Conditional.If>
```

Add `IconButton` and `Spinner` to the existing `@components/ui` import.

List and preview lines:
- 251: `border-muted-200` → `border-border`
- 252: `text-primary` → `text-fg-muted`
- 258: `text-muted-400 shrink-0 text-xs` → `text-fg-muted shrink-0 text-xs tabular-nums` with `dir="ltr"`
- 316: `border-muted-200` → `border-border`

- [ ] **Step 7: FacetedFilter**

| Line | Old | New |
|---|---|---|
| 56 | `<PlusIcon className="me-2 h-4 w-4" />` | `<PlusIcon aria-hidden="true" />` |
| 63 | `<Divider orientation="vertical" className="mx-2 h-4" />` | `<Divider orientation="vertical" className="mx-1 h-4" />` |
| 65 | `<div className="hidden space-x-1 lg:flex">` | `<div className="hidden gap-1 lg:flex">` |
| 76 | `{selectedCount} selected` | `{t('selectedCount', { count: selectedCount })}` |
| 84 | `className="w-[200px] p-0"` | `className="w-56 p-0"` |
| 89 | `No results found.` | `{t('noResults')}` |
| 98–99 | `'border-primary me-2 flex h-4 w-4 …'`, `'bg-primary text-primary-foreground': isSelected` | `'border-border-strong me-2 flex size-4 items-center justify-center border'`, `'bg-accent border-accent text-accent-fg': isSelected` |
| 103 | `<CheckIcon size={16} />` | `<CheckIcon aria-hidden="true" className="size-3" />` |
| 117 | `Clear filters` | `{t('clearFilters')}` |
| 130 | `placeholder={title ?? 'Search'} className="m-0 me-0 h-[36px] w-[150px] lg:w-[250px]"` | `placeholder={title ?? t('search')} className="w-40 lg:w-64"` |

The badges at 61, 70 and 76 keep `rounded-sm px-1 font-normal`.

FormInput's field height comes from `fieldVariants`, which is the "same height as Input" rule. The removed `h-[36px]` was fighting it.

- [ ] **Step 8: Run tests**

Run: `P exec vp test --run src/components/shared tests/i18n && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 9: Commit**

```bash
P ds:baseline && P exec vp check && P docs:lint && \
git add -A src tests && git commit -m "feat(shared): FileCard, FileIcon, FileUploader, Stepper, FacetedFilter and Toaster on tokens and i18n; keyboard-reachable uploader

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: DashboardPage and MembersPage on the new composites

**Files:**
- Modify: `src/pages/dashboard/DashboardPage.tsx`, `src/pages/members/MembersPage.tsx`
- Modify: `src/locales/{en,ar}/dashboard.json` (`workspace.*`)
- Create: `src/pages/dashboard/DashboardPage.test.tsx`, `src/pages/members/MembersPage.test.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 3), `DescriptionList` (Task 4), `CardGrid` (Task 5), `ColumnMeta.numeric` (Task 9), and Card shortcut props `title` / `description` (Plan A).

- [ ] **Step 1: Write the failing tests**

`src/pages/dashboard/DashboardPage.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import DashboardPage from './DashboardPage';

import '../../i18n';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('is built from PageHeader, CardGrid, Card and DescriptionList on tokens', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' }).closest('[data-slot="page-header"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="card-grid"]').length).toBeGreaterThan(0);
    expect(container.querySelector('[data-slot="description-list"]')).not.toBeNull();
    expect(container.querySelector('polyline')?.getAttribute('stroke')).toBe('var(--accent)');
    expect(container.innerHTML).not.toMatch(/text-foreground|text-muted-foreground|bg-primary|text-primary|text-destructive|var\(--primary\)/);
  });

  it('isolates KPI values left-to-right', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    const value = document.querySelector('[data-slot="stat-value"]') as HTMLElement;
    expect(value.getAttribute('dir')).toBe('ltr');
    expect(value.className).toContain('tabular-nums');
  });
});
```

`src/pages/members/MembersPage.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import MembersPage from './MembersPage';

import '../../i18n';

afterEach(cleanup);

describe('MembersPage', () => {
  it('has a page header with its primary action and token-only cells', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Tooltip.Provider>
          <MemoryRouter>
            <MembersPage />
          </MemoryRouter>
        </Tooltip.Provider>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Members' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Member' })).toBeTruthy();
    const email = container.querySelector('td [data-slot="member-email"]') as HTMLElement;
    expect(email.getAttribute('dir')).toBe('ltr');
    expect(container.innerHTML).not.toMatch(/text-foreground|text-muted-foreground/);
  });
});
```

- [ ] **Step 2: Run them**

Run: `P exec vp test --run src/pages/dashboard src/pages/members`
Expected: FAIL. There is no PageHeader on the dashboard, no CardGrid or DescriptionList, a `var(--primary)` stroke, and legacy classes.

- [ ] **Step 3: Add the keys**

EN `dashboard.json`:

```json
  "workspace": {
    "title": "Workspace",
    "description": "Your plan and usage this billing cycle.",
    "plan": "Plan",
    "planValue": "Business",
    "seats": "Seats used",
    "renewal": "Renews on"
  }
```

AR:

```json
  "workspace": {
    "title": "مساحة العمل",
    "description": "خطتك واستخدامك في دورة الفوترة الحالية.",
    "plan": "الخطة",
    "planValue": "الأعمال",
    "seats": "المقاعد المستخدمة",
    "renewal": "تاريخ التجديد"
  }
```

- [ ] **Step 4: Rebuild DashboardPage**

Replace `StatCard`, `AreaChart`'s colours, `ActivityList`'s classes and `DashboardPage`:

```tsx
function StatCard({ stat }: { stat: Stat }) {
  const { t } = useAppTranslation('dashboard');
  const formatNumber = useNumberFormat();
  const positive = stat.delta >= 0;

  return (
    <Card>
      <Card.Content className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-fg-muted text-sm">{t(stat.labelKey)}</span>

          <span className="bg-surface-sunken text-fg-muted flex size-8 items-center justify-center rounded-md">
            <stat.icon aria-hidden="true" className="size-4" />
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <span data-slot="stat-value" dir="ltr" className="text-fg text-2xl font-semibold tabular-nums">
            {formatNumber(stat.value, { style: stat.format, maximumFractionDigits: stat.format === 'percent' ? 1 : 0 })}
          </span>

          <span dir="ltr" className={cn('flex items-center gap-0.5 text-xs font-medium tabular-nums', positive ? 'text-success' : 'text-danger')}>
            <Conditional>
              <Conditional.If condition={positive}>
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Conditional.If>

              <Conditional.Else>
                <ArrowDownRight aria-hidden="true" className="size-3.5" />
              </Conditional.Else>
            </Conditional>
            {formatNumber(Math.abs(stat.delta) / 100, { style: 'percent', maximumFractionDigits: 1 })}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}
```

In `AreaChart`, the two `stopColor="var(--primary)"` become `stopColor="var(--accent)"`, and `stroke="var(--primary)"` becomes `stroke="var(--accent)"`. The first stop's `stopOpacity` becomes `"0.18"`.

In `ActivityList`:
- the initial chip becomes `bg-surface-sunken text-fg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold` with `aria-hidden="true"`
- `text-foreground` → `text-fg`
- `text-muted-foreground` → `text-fg-muted`

`DashboardPage`:

```tsx
function DashboardPage() {
  const { t } = useAppTranslation('dashboard');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} description={t('subtitle')} className="pb-2" />

      <CardGrid>
        {STATS.map((stat) => (
          <StatCard key={stat.labelKey} stat={stat} />
        ))}
      </CardGrid>

      <CardGrid columns={{ base: 1, lg: 3 }}>
        <Card className="lg:col-span-2" title={t('revenueOverview')} description={t('lastTwelveMonths')}>
          <Card.Content>
            <AreaChart data={CHART_DATA} />
          </Card.Content>
        </Card>

        <Card title={t('recentActivity')}>
          <Card.Content className="py-0">
            <ActivityList />
          </Card.Content>
        </Card>
      </CardGrid>

      <Card title={t('workspace.title')} description={t('workspace.description')}>
        <Card.Content>
          <DescriptionList
            columns={3}
            items={[
              { term: t('workspace.plan'), value: t('workspace.planValue') },
              { term: t('workspace.seats'), value: '18 / 25', numeric: true },
              { term: t('workspace.renewal'), value: '2026-12-01', numeric: true },
            ]}
          />
        </Card.Content>
      </Card>
    </div>
  );
}
```

Imports:
- `import { Card } from '@components/ui';`
- `import { CardGrid, DescriptionList, PageHeader } from '@components/shared';`
- `import { Conditional } from '@components/utils';`

Check that `Card`'s shortcut `title` renders a `Card.Header` (Plan A). If the plan-A Card requires the header for content padding, keep `Card.Content` as written.

- [ ] **Step 5: MembersPage**

Cell classes:

| Line | Old | New |
|---|---|---|
| 97 | `<span className="text-foreground font-medium">` | `<span className="text-fg font-medium">` |
| 102 | `<span className="text-muted-foreground">{row.original.email}</span>` | `<span data-slot="member-email" dir="ltr" className="text-fg-muted">{row.original.email}</span>` |
| 141, 156 | `<span className="text-muted-foreground">{row.original.joined}</span>` (and `lastSeen`) | `<span dir="ltr" className="text-fg-muted tabular-nums">…</span>` |
| 169 | `<span className="text-muted-foreground">{row.original.shiftStart}</span>` | `<span dir="ltr" className="text-fg-muted tabular-nums">…</span>` |

Move the PageHeader added in Task 3 out of the DataTable, so the table fills the remaining height:

```tsx
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t('title')} description={t('description')}>
        <PageHeader.Actions>
          <Button>
            <Plus aria-hidden="true" />
            {t('addMember')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <DataTable table={table} className="min-h-0 flex-1">
        <DataTable.Toolbar totalCount={totalCount} totalLabel={t('totalLabel')} placeholder={t('searchPlaceholder')} />

        <DataTable.Content emptyState={{ title: t('emptyState.title'), description: t('emptyState.description') }} />

        <DataTable.Pagination />
      </DataTable>
    </div>
  );
```

- [ ] **Step 6: Run tests**

Run: `P exec vp test --run src/pages && P exec tsc -b`
Expected: PASS and exit 0.

- [ ] **Step 7: Commit**

```bash
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(pages): Dashboard and Members on PageHeader, CardGrid, Card and DescriptionList

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Plan B exit — guard, full gate, four-way screenshots

**Files:**
- Modify: `tests/design-system/forbidden-patterns.test.ts` (Plan B guards)

**Interfaces:**
- Consumes: everything above. The guard proves Plan B's folders are clean and its retired components are gone.

- [ ] **Step 1: Write the guards**

Append inside `describe('clean primitives', …)`, after the Plan A cases:

```ts
  it('Plan B app code contains no forbidden patterns', () => {
    const scopes = [
      'src/components/shared/',
      'src/components/tables/',
      'src/components/calendar/',
      'src/layouts/',
      'src/routes/',
      'src/App.tsx',
      'src/pages/dashboard/',
      'src/pages/members/',
    ];
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => scopes.some((scope) => file.startsWith(scope)));
    expect(offenders).toEqual([]);
  });

  it('Plan B retired components are gone', () => {
    const retired = ['prime-loader', 'blank-slate', 'action-panel', 'meta-card', 'grid-card', 'layout'];
    const present = componentFolders(`${REPO_ROOT}src/components`).filter((name) => retired.includes(name));
    expect(present).toEqual([]);
    const retiredLayouts = ['dashboard-layout', 'dashboard-sidebar', 'dashboard-sidebar-drawer', 'dashboard-sidebar-link', 'dashboard-header'];
    const presentLayouts = componentFolders(`${REPO_ROOT}src/layouts`).filter((name) => retiredLayouts.includes(name));
    expect(presentLayouts).toEqual([]);
  });
```

`componentFolders` is declared further down the file as a `const`. It is only called inside `it` bodies at run time, after module evaluation, so the order is fine. Plan A's guard already does the same.

- [ ] **Step 2: Run the guard**

Run: `P exec vp test --run tests/design-system`
Expected: PASS. Every earlier task removed its violations. If a file is listed, fix that file in this task (tokens per the earlier tasks' maps) and re-run. Never edit the guard to exclude it.

Also run these greps; each must print nothing:
- `grep -rnE "'(Toast action|Search Here|Rows per page|Clear All|Loading more\.\.\.|No results found\.|Approve|Reject|Unassigned)'" src/components src/layouts`
- `grep -rnE ">(Day|Week|Month|Today|Filter)<" src/components`

- [ ] **Step 3: Full gate**

```bash
WS=.superpowers/sdd/2026-10-16-ui-kit-composites-b
P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && \
P exec vp build > $WS/build.log 2>&1 && P docs:lint && P exec vp test --run src tests > $WS/gate.log 2>&1; echo "exit $?"; tail -8 $WS/gate.log
```

Expected: `exit 0`. Record the test count and the remaining baseline total (`python3 -c "import json;b=json.load(open('tests/design-system/forbidden-patterns.baseline.json'));print(sum(sum(c.values()) for c in b.values()))"`) in the ledger.

- [ ] **Step 4: Four-way screenshots**

Start `P exec vp dev --port 5199` in the background. Use `playwright-cli` at 1440×900, and at 390×844 for the mobile cases. Theme switches by swapping the `<html>` class in an IIFE; language switches with the app's language switcher (or `localStorage` + reload, whichever the SP2 screenshots used).

For dark/light × EN/AR, capture:
- `/dashboard`, `/members`, `/settings`, `/does-not-exist` (404)
- the docs pages `spinner`, `empty-state`, `page-header`, `description-list`, `card-grid`, `app-shell`, `sidebar`, `data-table`, `calendar-grid`

Also capture these extras:
- `/dashboard` with the sidebar collapsed (dark EN, light AR)
- `/dashboard` at 390 wide with the drawer open (light EN, dark AR)
- `/members` with the filters row open (light AR)

Save as `.superpowers/screens/sp3b-<route>-<theme>-<lang>.png`. Read each screenshot. Fix anything broken before the final review:
- a clipped label
- an unmirrored arrow
- a colour stripe
- mismatched control heights
- Arabic-Indic digits
- a scrim that does not cover

Ledger every fix as a ruling with its screenshot name.

- [ ] **Step 5: Commit**

```bash
git add -A tests src && git commit -m "test(design-system): SP3 Plan B exit — app shell, shared, tables, calendar, layouts and pages clean; retired components gone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
