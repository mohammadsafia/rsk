# UI Kit Sub-project 3 — Composites, App, Landing — Addendum Spec

- **Date:** 2026-10-15
- **Status:** Approved (design), pending implementation plan
- **Branch:** `feat/ui-kit-composites` (stacked on `feat/ui-kit-primitives`)
- **Parent spec (binding):** `docs/superpowers/specs/2026-10-15-ui-kit-design-system-design.md`, which fixes §5 delivery, §6 conventions, §8.1 vocabulary and the §8.2 consolidation map. The SP2 addendum `docs/superpowers/specs/2026-10-15-ui-kit-primitives-design.md` is binding for every primitive used here. This addendum records SP3's decisions and does not reopen anything else.
- **Mockups:** `.superpowers/brainstorm/43733-1792096913/content/{landing-directions,landing-b-full,logo-options}.html` (gitignored). Also, from SP2: `structure-family.html` and `date-family.html`.

## 1. Goal

Rebuild `forms/`, `shared/`, `tables/` and `calendar/` on the SP2 primitives, and restyle the app (layouts, pages, docs gallery). Redesign the landing page and give RSK a logo and favicon. Then **delete `src/styles/legacy-tokens.css`** and finish with an **empty forbidden-pattern baseline**.

As in SP2, this is a clean break: every call site is migrated in the same change, and replaced components are deleted.

## 2. Decisions (this round)

1. **The six "3 / 4" items from the parent map are built in SP3:**
   - `Spinner` (replaces `PrimeLoader`)
   - `EmptyState` (replaces `BlankSlate`)
   - `PageHeader` (replaces `ActionPanel`)
   - `AppShell` + `Sidebar` (replace the dashboard layouts and `ui/layout`)
   - `DescriptionList` (replaces the MetaCard body)
   - `CardGrid` (replaces `GridCard`)

   SP4 keeps only the remaining new components.
2. **Field errors are inline.** A danger border, then a message line under the field with an icon and text, linked by `aria-describedby`. This removes the in-field ⓘ error tooltip, `ErrorTooltip`, and every `ps-8` offset.
3. **The landing page gets a full redesign** in direction **B · Specimen sheet** (§7).
4. **The RSK logo is mark C · Building block** (§8).
5. **Three stacked plans:**
   - **A:** forms + composites
   - **B:** new shared components + app screens
   - **C:** landing, logo, docs, bridge deletion

   Each plan ends with its folders at zero forbidden patterns.

## 3. Plan A — forms and composites

### 3.1 Form field contract (parent §8.1)

**`forms/FormField` (new).** The anatomy every `Form*` renders:
- **Label row:**
  - `label` with a required marker.
  - An optional `tooltip` ⓘ `button`, rendered as a **sibling** of `<label>` so it stays out of the field's accessible name.
- **Control.**
- **Message line:**
  - Shows `error.message` (danger icon + `text-danger`) when invalid, otherwise `description` (`text-fg-muted`).
  - Has an id the control references via `aria-describedby`.

**Props on every `Form*`:** `name`, `label`, `description`, `required`, `disabled`, `tooltip`, `className` and `rules`, plus that field's own options.

**Removed:** `containerClassName`, `labelClassName`, `errorClassName` and `checkboxClassName`. Styling targets `data-slot`: `form-field`, `form-field-label`, `form-field-control`, `form-field-message`.

**Invalid state:** `invalid` is derived from `fieldState.error` and passed to the primitive. Primitives already map it to `aria-invalid`.

**Deleted or retired:**
- `FormMessage`'s tooltip mode and the `errorType` prop are deleted. `FormMessage` becomes the message line.
- `FormControl` and `FormLabel` are folded into `FormField`. Their files are deleted once no importer remains.
- `shared/ErrorTooltip` is deleted.

### 3.2 `FormContainer.Actions` and `FormSection`

**`FormContainer.Actions`** replaces `shared/FormSubmitButtons`:
- A footer row with `Cancel` (outline) and `Submit` (solid).
- `loading` follows `formState.isSubmitting`.
- `sticky` pins it to the bottom of a scrolling form.
- `confirmOnCancel` shows the unsaved-changes `ConfirmDialog` when the form is dirty.
- Button labels come from i18n and can be overridden by props.

**`forms/FormSection`** replaces `shared/FieldSection`: `title`, `description`, children, and a `border-subtle` hairline above each section except the first.

### 3.3 Card absorbs PrimeCard and CollapsibleCard

Additions to `ui/Card`:
- `collapsible` + `open` / `defaultOpen` / `onOpenChange`: a header chevron trigger built on `Collapsible`, with `aria-expanded`; the body animates only without reduced motion.
- `loading`: the body renders `Skeleton` lines.
- `tone`: `neutral` (default) · `accent` · `info` · `success` · `warning` · `danger`. A whole-card `*-subtle` tint (`accent` maps to `bg-accent-subtle`); text stays `fg`.
- Shortcut props `icon`, `title`, `description` and `tooltip`, which render the header when there's no explicit `Card.Header`. The leading icon is `text-fg-muted` and 16px; the header follows SP2 (`pb-3` + a `border-subtle` hairline when it's followed by content).

**Deleted:** `shared/PrimeCard` and `shared/CollapsibleCard`, with every call site migrated. PrimeCard's `glass` and `gradient` variants are dropped (parent §8.2).

### 3.4 Rebuilt composites

- **`ConfirmDialog`:**
  - `variant` → `tone` (`danger` · `warning` · `success` · `info`).
  - The description gets an id and is wired to `aria-describedby`.
  - When not dismissible it keeps a ✕ (current behaviour), while Escape and outside clicks stay blocked.
- **`CountTooltip`:** tokens only. Its API is unchanged.

### 3.5 SP2 deferred minors owned by Plan A

- FormTimePicker drops the stale `Omit<'error'>`.
- Disabled date-field shells match Input's disabled look: `data-disabled` drives the same token classes.
- The table filter pills use `Combobox.Trigger size="sm"`.
- FormattedNumber's ArrowUp/Down call `preventDefault`.

## 4. Plan B — new shared components and app screens

Every component below follows parent §6: audit → variant matrix → build → MDX doc → EN/AR keys → RTL, dark and a11y checks.

| Component | API | Replaces |
|---|---|---|
| `ui/Spinner` | `size` `sm` · `md` · `lg`; `overlay` (a scrim covering the nearest positioned parent); `label` (sr-only, default i18n `common.loading`); `role="status"`; reduced motion stops the rotation | `PrimeLoader` (`App.tsx`, `DashboardLayout`, `ui/layout` fallback, `Table.Loader`) |
| `shared/EmptyState` | `kind` `first-use` · `no-results` · `error` (each with a default icon); `title`, `description`, `.Actions`; `size` `sm` (inside tables) · `md` | `BlankSlate`; `Table.Empty` renders it |
| `shared/PageHeader` | `title`, `description`, `back` (href or handler; the chevron mirrors in RTL), `breadcrumb` (uses `shared/Breadcrumb`), `.Actions` | `ActionPanel` |
| `shared/AppShell` | grid of `Sidebar` + `.Header` + `.Content`; owns the mobile drawer state | `layouts/DashboardLayout`, `DashboardSidebarDrawer`, `ui/layout` |
| `shared/Sidebar` | `.Header` (logo), `.Group` (`label`), `.Item` (`icon`, `href`, `active`, `badge`; the active item is shown by `bg-hover` + `text-fg` + medium weight, never a side stripe), `.Footer` (user); `collapsed` with a stored preference; icon-only collapsed items get tooltips | `DashboardSidebar`, `DashboardSidebarLink` |
| `shared/DescriptionList` | `items: { term, value, numeric? }[]` or `.Item` children; `columns` 1–3; `layout` `stacked` · `inline`; numeric values render in a `dir="ltr"` mono span | the MetaCard key/value body |
| `shared/CardGrid` | `columns` (responsive object or number), `gap`; layout only | `GridCard` |

**Deleted:**
- `shared/{prime-loader,blank-slate,action-panel,meta-card,grid-card}`
- `ui/layout`
- `layouts/{dashboard-layout,dashboard-sidebar,dashboard-sidebar-drawer,dashboard-sidebar-link}`

`DashboardHeader` becomes `AppShell.Header` content (search, language, theme, notifications, user menu). `AuthLayout` and `ErrorBoundary` are restyled; the error screen uses `EmptyState kind="error"`.

**Tables (`tables/`):**
- DataTable content, pagination and filters move to tokens.
- The "Rows per page" and total-count text come from i18n.
- Arabic plurals are added for `common.table.total` and `common.selectedCount`.
- The column `meta` gains `numeric?: boolean`, which DataTable forwards to `Table.Head` / `Table.Cell numeric`.
- The table loader uses `Spinner`; skeleton rows get a `role="status"` wrapper with sr-only text.

**Calendar (`calendar/`):**
- Week headers, the Day/Week/Month tabs and the "List view"/"Calendar view" labels come from i18n.
- Time-axis labels are formatted for the locale (`Intl.DateTimeFormat` with `numberingSystem: 'latn'`) and fit the 64px axis (hour only on hour marks: `9 AM` / `9 ص`).
- `EventChip` / `EventCard` children get a visually hidden date prefix, so screen readers announce the day.
- `shared/DateNavigation`: arrows mirror in RTL, `gap-2` replaces `space-x-2`, and "Today" is translated.

**App screens:**
- Dashboard, Members and the Components gallery pages are rebuilt on `AppShell`, `PageHeader`, `CardGrid`, `Card` and `DescriptionList`.
- The remaining `shared/` components (FileCard, FileUploader, Stepper, Breadcrumb, FacetedFilter, LanguageSwitcher, ThemeSwitcher) are migrated to tokens.
- `composed-components` stays (it holds `ComposedButton` and `ComposedDropdownItem`).

## 5. Plan C — landing, logo, docs, bridge

### 5.1 Landing page (direction B · Specimen sheet)

Sections in order (mockup `landing-b-full.html`):

1. **Nav:**
   - Contents: logo + "RSK", Components, Docs, CLI, language switch, theme switch, `Get Started` (solid).
   - Sticky with a hairline bottom border.
2. **Hero:**
   - Centered: eyebrow (mono, uppercase), `h1` with the Oxblood emphasis word, subtitle, and `Get Started` (solid) + `Browse Components` (outline).
   - Below it, a hairline **stat strip** of four cells with mono numbers. Counts come from the docs registry at build time, not hard-coded.
3. **Specimen bento:**
   - A grid of **live primitives**: a CalendarTimeGrid slice (tinted events + now line), the field family with one inline error, status `Tag`s, a `Table` with a selected row and a numeric column, a `Toast`, and a `ConfirmDialog`-style panel.
   - These render through the real components, inert (`inert` / `aria-hidden` on the decorative clone), with an accessible description of the section.
4. **What's inside:** the six features as numbered hairline rows (`01` mono · title · description).
5. **Documented:** text + `Open Gallery`, next to a docs-page specimen (gallery sidebar + Button page with live buttons).
6. **Tooling:** a DTO-generator terminal log (mono, LTR) next to the text.
7. **Structure:** path aliases in a mono hairline grid (LTR).
8. **Get going:** three numbered cards (Clone / Install / Start) with copyable commands.
9. **Footer.**

**Rules:**
- The fixed type scale only: `h1` uses `text-4xl`-scale tokens, with no `clamp()` and no arbitrary lengths.
- One accent use per section at most.
- No gradients, glass or glow.
- Copy stays in `home.json` (EN/AR); new keys are added in both languages.
- Arabic uses the Kufi stack with increased leading on headings.
- The page is fully RTL-mirrored, except code, commands and aliases, which stay LTR.
- `pages/home` and `views/home` are rewritten. The old `ComponentShowcase` is deleted.

### 5.2 Logo and favicon (mark C · Building block)

- **The mark:** a 2×2 grid of rounded squares inside a rounded tile.
  - Three squares are ink; the fourth (bottom-inline-end) is Oxblood and fully rounded.
  - Geometry: tile 32×32 with `rx` 8; squares 8×8 at 7/17 with `rx` 2.5; the accent square has `rx` 4. At 16px it switches to 8.5 squares at 6.5/17.
- **`shared/Logo`:**
  - `variant` `mark` · `lockup` (mark + "RSK" wordmark, with an optional "React Starter Kit" sub-line); `size` `sm` · `md` · `lg`.
  - Colors come from tokens (`fg` tile with `canvas` squares in dark, inverted in light; accent square `accent`). No hex.
  - Used in the Sidebar header, the landing nav and the auth layout.
- **Favicon set** (generated with the `favicon-gen` skill, from the 32px geometry, into `public/`):
  - `favicon.svg` (a `prefers-color-scheme` media query inside the SVG switches the tile/square inks)
  - `favicon.ico` (16/32)
  - `apple-touch-icon.png` (180, opaque graphite tile, no transparency)
  - `icon-192.png`, `icon-512.png`
  - `site.webmanifest` (`name` "RSK — React Starter Kit", `short_name` "RSK", graphite `theme_color` / `background_color`)
- **`index.html`:** gets real `<link>`s for the svg, ico, apple-touch and manifest, plus a `theme-color` meta for each scheme. The empty `href` and the missing `logo192.png` reference are removed.
- **Deleted:** `assets/icons/QuraAILogo.tsx` and `QuraAILoader.tsx` (leftovers from another product), with their call sites replaced by `Logo` / `Spinner`.

### 5.3 Docs gallery

- **Code blocks:** render `dir="ltr"` in the mono face (this fixes the reversed code in Arabic).
- **Page chrome:** DocPanel, SidebarPanel, ComponentDetailPage and ComponentsGalleryPage move to tokens.
- **MDX pages:** all migrated off legacy classes. Prose and examples that name removed APIs are updated.
- **`docs:new` template:** emits the SP2/SP3 conventions (tokens, `Conditional`, `data-slot`).

### 5.4 Bridge deletion

- **Icons:** the remaining `assets/icons` hex fills become `currentColor` or tokens. There is no brand exception, because the logo is token-based.
- **Removed:**
  - `src/styles/legacy-tokens.css` and its `@import` in `index.css`
  - the legacy entries in `lib/constants/DesignTokens.ts`
  - the legacy-only animations (e.g. `prime-loader-move`)
- **Guard:** the forbidden-pattern test asserts an **empty baseline** for every pattern id. `ds:baseline` stays as the ratchet tool but has nothing left to record.

### 5.5 SP2 deferred minors owned by Plan C

- **Contrast tests:** add `fg` and `fg-muted` on every `*-subtle` tint. If a pair fails, lighten or darken `fg-muted` in light mode until it passes. Selected table rows and past calendar events must reach 4.5:1.
- **Outside-month calendar days:** clickable outside days use `text-fg-muted`; `fg-subtle` is kept for disabled days.
- **Reduced motion:** Accordion and Collapsible height animations, and the shell's width transition, get `motion-reduce:` resets.
- **Toast swipe direction:** `swipeDirection` follows the document direction.
- **Generic `Input`:** sets `dir="auto"`, so mixed values (IDs, emails) keep their order in Arabic.
- **Layout bugs:** the className-only-when-fixed bug and the dead scroll listener go away with `ui/layout`'s deletion. `AppShell` implements the sticky-header shadow with an `IntersectionObserver` sentinel.

## 6. Global rules (inherited, restated)

- **Conventions:** parent §6 applies to every component.
- **Tooling:** codemods (`scripts/design-system/codemods`) are used for literal-prop migrations; dynamic and judgment cases are hand-fixed from tables in the plan.
- **i18n:** EN/AR parity is enforced by `tests/i18n/parity.test.ts`; new strings land in both languages in the same commit.
- **Data values:** single values (IDs, amounts, times, ranges) are isolated LTR (SP2 addendum §11).
- **Verification per plan:** the full gate (`vp check`, `vp test --run`, `tsc -b`, `tsc -p tsconfig.scripts.json`, `vp build`, `docs:lint`, `ds:baseline`), a whole-branch review, and a four-way (dark/light × EN/AR) screenshot review of every route and docs page.

## 7. Verification

**Behaviour tests** (happy-dom):

| Area | Test |
|---|---|
| FormField | an errored field renders the message, `aria-invalid`, and `aria-describedby` pointing at the message; `description` shows when valid; the tooltip button is outside the label's accessible name |
| FormContainer.Actions | submit shows `loading` while submitting; cancel on a dirty form opens the confirm dialog when `confirmOnCancel` |
| Card | `collapsible` toggles `aria-expanded` and hides the body; `loading` renders skeletons; `tone` maps to its tint |
| ConfirmDialog | the description is announced (`aria-describedby`); a non-dismissible dialog still has a ✕ |
| Spinner | `role="status"` with translated sr-only text; `overlay` covers its parent |
| EmptyState | `kind` picks the icon; `.Actions` render |
| PageHeader | back control is labelled and mirrors in RTL; actions slot renders |
| AppShell/Sidebar | the active item has `aria-current="page"`; collapsed items expose tooltips; the drawer opens and closes on mobile |
| DescriptionList | numeric values are LTR-isolated; `columns` sets the grid |
| Tables | `meta.numeric` reaches `Table.Cell`; the pagination text is translated |
| Calendar views | axis labels are localized with Western digits; event chips carry a hidden date |
| Logo | renders `mark` / `lockup`; uses no hex; the accent square uses the accent token |
| Landing | stat counts come from the registry; every section heading exists in EN and AR |

**Exit criteria (whole SP3):**
- The forbidden-pattern baseline is **empty**, and `legacy-tokens.css` is gone (`tsc -b` and `vp build` prove nothing references it).
- Every component listed as deleted in §3–§5 has no importers.
- `public/` holds the full favicon set, and `index.html` references it.
- Four-way screenshots of every route and docs page have been reviewed, with the landing page compared against `landing-b-full.html`.
- A whole-branch review per plan, with Critical/Important findings fixed by TDD.
