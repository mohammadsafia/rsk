# UI Kit Sub-project 2 — Primitives (`ui/`) — Addendum Spec

- **Date:** 2026-10-15
- **Status:** Approved (design), pending implementation plan
- **Branch:** `feat/ui-kit-primitives` (stacked on `feat/ui-kit-design-system`)
- **Parent spec (binding):** `docs/superpowers/specs/2026-10-15-ui-kit-design-system-design.md` — this addendum adds per-component decisions for sub-project 2 and records three amendments (§2); it does not reopen anything else.
- **Mockups:** `.superpowers/brainstorm/*/content/{button-matrix,status-family-v2,inputs-family,structure-family,date-family}.html` (gitignored)

## 1. Goal

Restyle every primitive in `src/components/ui/` to Graphite Instrument and give it the parent spec's shared API vocabulary (`variant` × `tone` × `size`, uniform slots, Radix event names), as a **clean break**: every call site in the repo is migrated in the same change. At the end, `ui/` contains zero forbidden patterns and the `Prime*`/button-wrapper/Chip components it replaces are deleted.

## 2. Amendments to the parent spec (decided in this round)

1. **Legacy bridge deletion moves to the end of sub-project 3.** SP2 removes every legacy color use inside `src/components/ui/` (and in call sites it touches for API migration); SP3 does the same for `forms/`, `shared/`, `tables/`, `calendar/`, pages, layouts and docs, then deletes `src/styles/legacy-tokens.css`. Each file is migrated once, by the sub-project that redesigns it.
2. **Duplicate tokens removed.** `inverse` ≡ `fg` and `inverse-fg` ≡ `fg-inverse` in both modes, so `inverse` and `inverse-fg` are deleted; the primary action is `bg-fg text-fg-inverse`. `inverse-hover`/`inverse-pressed` are renamed `fg-hover`/`fg-pressed`. `ring` stays as a deliberate alias of `accent`.
3. **Banned pattern added:** colored side-stripe borders (a thick `border-inline-start` in a tone color on cards, alerts or event blocks). Tone is carried by an icon or a dot instead.

## 3. Token additions (Batch 0)

| Token | Purpose | Dark | Light |
|---|---|---|---|
| `accent-hover` | Solid accent fill on hover | `oklch(0.75 0.11 12)` | `oklch(0.38 0.13 14.9)` |
| `danger-hover` | Solid danger fill on hover | `oklch(0.76 0.17 37.1)` | `oklch(0.52 0.17 35.5)` |

Light `success`, `warning` and `danger` are darkened (reference: `oklch(0.5 0.13 157.2)`, `oklch(0.53 0.12 70.4)`, `oklch(0.55 0.18 35.5)`) so that **status text on its own `-subtle` tint reaches 4.5:1**; exact lightness is set by the contrast tests (lightness-only adjustments). The contrast test gains an alpha-compositing helper so translucent dark-mode tints are measured composited over `surface`. New pairs: `fg-inverse` on `fg-hover`/`fg-pressed`; `accent-fg` on `accent-hover`; `danger-fg` on `danger-hover`; each status on its `-subtle`; `fg-muted` on `surface-sunken`.

## 4. Sequencing

Six dependency-ordered batches in one SP2 PR, each ending with its folders at zero forbidden patterns: **0 tokens → 1 Actions → 2 Status → 3 Inputs → 4 Overlays → 5 Structure → 6 Date & number**. Every component follows parent spec §6 (forge:create-component workflow: audit → variant matrix → pattern → build; README code standards; MDX doc; EN/AR keys; RTL/dark/a11y audits).

## 5. Batch 1 — Actions

**`Button`** — `variant`: `solid` (default) · `outline` · `ghost` · `link`; `tone`: `neutral` (default) · `accent` · `danger`; `size`: `sm` 28 · `md` 32 (default) · `lg` 40; `loading`, `fullWidth`, `asChild`.

| | neutral | accent | danger |
|---|---|---|---|
| solid | `bg-fg text-fg-inverse`, hover `bg-fg-hover`, active `bg-fg-pressed` | `bg-accent text-accent-fg`, hover `bg-accent-hover` | `bg-danger text-danger-fg`, hover `bg-danger-hover` |
| outline | transparent, `border-border-strong text-fg`, hover `bg-hover` | `border-accent text-accent`, hover `bg-hover` | `border-danger text-danger`, hover `bg-hover` |
| ghost | `text-fg-muted`, hover `bg-hover text-fg` | `text-accent`, hover `bg-hover` | `text-danger`, hover `bg-hover` |
| link | `text-fg` underline on hover | `text-accent` underline on hover (offset 4) | `text-danger` |

Shared: 6px radius, `gap-1.5`, 16px icons, text `xs`/`sm`/`base` for `sm`/`md`/`lg`, `focus-ring`, `state-press`, disabled = 50% + no pointer. `loading` shows a spinner before the label, preserves width, sets `aria-busy` and disables. Solid fills never take the `hover`/`pressed` overlays (they would replace the fill).

**`IconButton`** — square (`size` = width = height), same `variant`/`tone`/`size` (default `ghost`/`neutral`), `loading`; **`aria-label` is required by its type** and is rendered as its `Tooltip` content.

**Migration map:**

| Old | New |
|---|---|
| `default`, `icon`, `success` | `solid neutral` |
| `destructive` | `solid danger` |
| `outline`, `secondary`, `muted`, `outline-muted`, `outline-success` | `outline neutral` |
| `surface-primary` | `outline accent` |
| `outline-destructive` | `outline danger` |
| `ghost`, `ghost-muted`, `soft-muted` | `ghost neutral` |
| `ghost-primary`, `ghost-muted-primary`, `soft-primary`, `quiet-primary` | `ghost accent` |
| `ghost-destructive`, `ghost-muted-destructive` | `ghost danger` |
| `link` | `link accent` |
| `unstyled` (variant or size) | native `<button type="button">` with its own classes |
| size `xs`, `sm` / `default` / `lg` | `sm` / `md` / `lg` |
| size `full` | `md` + `fullWidth` |
| size `icon` / `icon-sm` | `IconButton` `md` / `sm` |
| `LoadingButton` | `Button loading` |
| `FormSubmitButton` | `<Button type="submit" loading={isSubmitting}>` |
| `LinkButton` | `<Button asChild><Link …/></Button>` |
| `TooltipButton` | `IconButton` (icon-only) or `Tooltip` + `Button` (text) |

Deleted: `shared/loading-button`, `shared/form-submit-button`, `shared/link-button`, `shared/tooltip-button`.

## 6. Batch 2 — Status

- **`Badge`** (static) — `tone`: neutral · accent · success · warning · danger · info; `variant`: `dot` (default: `border-border`, `fg` text, 6px tone dot) · `soft` (tone tint background, tone text; neutral uses `fg` text); `size`: `sm` 20 · `md` 22; 6px radius (no pills). Map: `default`/`secondary`/`muted`/`neutral` → neutral, `destructive` → danger; sizes `default`/`xs`/`sm` → sm, `md`/`lg` → md.
- **`Tag`** (new; replaces `Chip`) — `tone`, `size` `sm` 20 · `md` 24, `selected` (`aria-pressed`, accent border + text), `onRemove` (renders a remove button labeled "Remove {label}" from i18n), clickable via `onClick`/`asChild` with `focus-ring`. Chip map: `default` → accent, `muted`/`secondary` → neutral, `accent` → info, `destructive` → danger; sizes `xxs`/`xs`/`sm` → sm, others → md. `FileCard.StatusPill` becomes `Badge`. `ui/chip` deleted.
- **`Alert`** (compound `.Title`, `.Description`, icon slot) — `tone`: neutral · info · success · warning · danger; `variant`: `soft` (default: tone tint + tone/30 border) · `outline` (`bg-surface`, 1px `border-border`, tone on the icon only — **no side stripe**). `role="alert"` for danger, `role="status"` otherwise. Map: `default` → neutral soft, `info`/`success`/`warning` → same tone soft, `destructive` → danger soft, `outline` → neutral outline, `outline-info|success|destructive` → info|success|danger outline.
- **`Progress`** — `tone`: accent (default) · neutral · success · danger; `size`: `sm` 4 · `md` 6 · `lg` 8; track `bg-border`; the fill grows from the inline start (RTL-correct). Map: `default` → accent, `secondary` → neutral, `destructive` → danger.
- **`Skeleton`** — `shape`: `line` (default) · `circle` · `block`; `size` (line height): `sm` 12 · `md` 14 · `lg` 18; `bg-border-subtle` with an opacity pulse. Map: sizes `xs`/`sm` → sm, `default`/`md` → md, `lg`/`xl` → lg; variant `card` → `block`, `primary` dropped.
- **`Divider`** — API unchanged; `border` token.

## 7. Batch 3 — Inputs

**Field shape** (Input, Select trigger, TimePicker trigger, FormattedNumber; reused by SP3 forms): height from `size` (`sm` 28 · `md` 32 · `lg` 40), `bg-surface`, 1px `border-border-strong`, 6px radius; hover darkens the border to `fg-muted` (no ring); `focus-ring-input`; `invalid` prop → `aria-invalid` + `state-invalid`; disabled = `bg-surface-sunken text-fg-subtle border-border`; placeholder `text-fg-muted`.

- **`Input`** — adds `size`, `invalid`.
- **`Checkbox`** — `variant` removed; 16px, 4px radius, `border-border-strong`; checked/indeterminate `bg-accent text-accent-fg`.
- **`RadioGroup`** — 16px circle; checked = accent ring + accent dot; `RadioDot` becomes internal (removed from the barrel; importers use `RadioGroup.Item`).
- **`CheckboxGroup`** — layout only.
- **`Switch`** — `variant` removed; checked `bg-accent`; `size` `sm` · `md` (`lg` → `md`).
- **`Select`** — trigger = field shape (`size`, `invalid`); menu `bg-surface-raised shadow-raised` 10px radius; 28px items, highlight `bg-hover`, selected = accent check, disabled `text-fg-subtle`.
- **`Command`** — menu styling as Select; borderless search input; group headings `text-xs text-fg-muted`; shortcut hints in mono (a span until `Kbd` lands in SP4).

## 8. Batch 4 — Overlays

Shared floating surface: `bg-surface-raised`, 10px radius, `shadow-raised` (popover, menu, toast) / `shadow-overlay` (dialog); enter = fade + `scale(0.98)` with `duration-base`/`duration-slow` (reduced motion keeps the fade only).

- **`Dialog`** (absorbs `PrimeDialog`) — `Dialog`, `.Trigger`, `.Content`, `.Footer`, `.Close`. **`Dialog.Content` requires `title`** (`hideTitle` renders it visually hidden), plus `description`, `size` (`sm`/`md`/`lg` via `max-w-*`), `dismissible` (default true: close `IconButton`, Escape, outside click; false disables all three). Scrim `bg-overlay`. `PrimeDialog`'s `dialogMode`, `closeOnSuccess`, `isLoading` and `Actions` are dropped. `ConfirmDialog` (SP3) receives the minimal edit needed to compile.
- **`Tooltip`** (absorbs `PrimeTooltip`) — `<Tooltip content side align delayDuration disabled>{trigger}</Tooltip>`; a single `Tooltip.Provider` mounted at the app root; inverse style `bg-fg text-fg-inverse text-xs` 6px radius. `CountTooltip` (SP3) receives the minimal edit to render its item list as content.
- **`Popover`** — Radix API unchanged; `p-3`.
- **`DropdownMenu`** (replaces `PrimeDropdown`) — Radix compound kept; `Item tone="danger"`; `.Shortcut` slot (mono); 28px items with `bg-hover`; separators `border-subtle`.
- **`Toast`** — `tone` (neutral · success · warning · danger · info) replaces `variant` (`destructive` → `danger`); all six `position` values kept; raised surface with a tone icon, `fg` title, `fg-muted` description, optional action; no tinted backgrounds.

Deleted: `shared/prime-dialog`, `shared/prime-tooltip`, `shared/prime-dropdown`.

## 9. Batch 5 — Structure

- **`Card`** — `.Header` / `.Title` / `.Description` / `.Content` / `.Footer` + new **`.Actions`** (header trailing slot); `bg-surface border-border` 10px radius, no resting shadow; title `text-md` semibold. (`collapsible`/`loading` arrive in SP3.)
- **`Tabs`** — `variant`: `underline` (default; active = 2px accent underline + `fg` text) · `contained` (sunken track, active on `surface` with a hairline); `fullWidth`. Map: `default` → `contained fullWidth`, `compact` → `contained`, `plain` → `underline fullWidth`, `compactPlain` → `underline`; trigger `fitContent` removed.
- **`Table`** — headers `text-xs text-fg-muted` medium; rows `border-border-subtle`; hover `bg-hover`; `data-state="selected"` → `bg-accent-subtle`; **`Table.Cell numeric`** → end-aligned, mono, `tabular-nums`; `text-start` cells.
- **`Pagination`** — current page `Button solid neutral sm` with `aria-current="page"`, others `ghost`; previous/next `IconButton` with i18n labels, chevrons mirrored in RTL.
- **`Accordion`** — no boxes: `border-border-subtle` under each item, 44px triggers, rotating chevron, `text-fg-muted` content.
- **`Collapsible`**, **`ScrollArea`** (6px `border-strong` thumb) — API unchanged.
- **`Avatar`** — `size` `sm` 24 · `md` 32 (default) · `lg` 40; fallback initials `text-fg-muted` on `bg-hover`.

## 10. Batch 6 — Date & number

- **`Calendar`** — 32px day cells, 6px radius, tabular digits; today = hairline `border-strong` ring (not a fill); selected/range ends `bg-accent text-accent-fg`; range middle `bg-accent-subtle`; outside days `text-fg-subtle`; disabled struck through; nav via `IconButton ghost sm` with i18n labels, mirrored in RTL. API unchanged.
- **`CalendarMonthGrid` / `CalendarTimeGrid`** — `border-subtle` grid; today header in accent; events = soft tint blocks with a status dot (**no side stripe**); "now" line in accent. API unchanged.
- **`TimePicker`** — trigger = field shape (`size`, `invalid`); popover with mono 28px columns, selected `bg-accent text-accent-fg`; 12h/24h kept.
- **`FormattedNumber`** — field shape, end-aligned mono `tabular-nums`; step buttons `IconButton ghost sm` with labels, disabled at `min`/`max`; existing props kept, adds `size`/`invalid`.
- **`ScrollSelector`, `RadioDot`** — internal; removed from the `@components/ui` barrel; their gallery docs are removed.
- **`Layout`** — token migration only.

## 11. Data values in RTL (from SP1)

Every primitive that renders an ID, phone number, amount or date range as a single value (`FormattedNumber`, `Table.Cell numeric`, `TimePicker` value, `Calendar` captions with digits) wraps it in `dir="ltr"` (or `<bdi>` where direction is unknown) so the bidi algorithm cannot reorder hyphen-separated digit groups.

## 12. Verification

**Per batch:** contrast tests for any new token pair; behavior tests (happy-dom) as listed below; ratchet counts for the batch's `ui/` folders reach zero; `tsc -b` green (proves deleted components have no importers); `vp check` 0 errors and no new warnings in touched files; MDX docs updated and `docs:lint` green; EN/AR keys for new strings.

**Behavior tests:**

| Component | Test |
|---|---|
| Button | `loading` → `aria-busy`, disabled, label kept; `asChild` renders a router `Link` with button classes |
| IconButton | type test: missing `aria-label` fails (`@ts-expect-error`); label shown as tooltip on focus |
| Tag | remove button has its i18n label and calls `onRemove`; `selected` → `aria-pressed` |
| Alert | `role="alert"` for danger, `status` otherwise |
| Progress | fill anchored at inline start under `dir="rtl"` |
| Input / Select | `invalid` → `aria-invalid="true"` |
| Switch | `role="switch"`, `aria-checked`, toggles with Space |
| Checkbox | `indeterminate` → `aria-checked="mixed"` |
| Dialog | type test: missing `title` fails; Escape closes unless `dismissible={false}`; focus moves in on open and back on close |
| Tooltip | focusing the trigger shows the content (single root provider) |
| DropdownMenu | `tone="danger"` item → `data-tone="danger"` |
| Toast | `toast({ tone: 'danger' })` → `data-tone`; `variant` key is a type error |
| Card / Tabs / Table / Avatar | `.Actions` in header; `data-variant`/`data-full-width`; `data-numeric`; `data-size` |
| Pagination | prev/next labels; `aria-current="page"` |
| Calendar / TimePicker / FormattedNumber | range attributes + nav labels + Western digits under `ar`; 24h pick emits `"10:30"`; step-down disabled at `min` |

**Exit criteria (whole SP2):** ratchet baseline empty for `src/components/ui/**`; the eight replaced folders deleted with no importers; `forge:audit-rtl`, `audit-dark-mode`, `audit-a11y` clean on `ui/`; 4-way (dark/light × en/ar) screenshots of the gallery and dashboard reviewed; legacy bridge still present (deleted in SP3).
