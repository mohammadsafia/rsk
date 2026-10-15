# RSK UI Kit — Design System Redesign — Design Spec

- **Date:** 2026-10-15
- **Status:** Approved (design), pending implementation plan
- **Branch:** `feat/ui-kit-design-system` (based on `chore/migrate-to-vite-plus`)
- **Owner:** Mohammad Safia
- **Supersedes:** the visual system in `.impeccable.md` and the Ocean Blue palette from `2026-06-04-dashboard-ui-redesign-design.md`

## 1. Context & Problem

RSK ships ~100 base components across `ui/` (33), `shared/` (30), `forms/` (17), `tables/` and `calendar/`, documented in a live MDX gallery. They work, but as a UI kit they have three problems:

1. **Visual identity is generic.** Ocean Blue + Fraunces/DM Sans sits close to the default "AI-generated dashboard" look (blue brand, soft cards, gradients/glass variants such as `PrimeCard variant="glass" | "gradient"`).
2. **The API surface has sprawled.** `Button` has 24 variants that encode two ideas in one name (`ghost-muted-destructive`, `outline-success`, `soft-primary`, `quiet-primary`, `surface-primary`…). `size` mixes size with width (`full`), shape (`icon`) and reset (`unstyled`). `Badge` and `Chip` have different size scales. Several components duplicate each other (`PrimeCard`/`MetaCard`/`GridCard`/`CollapsibleCard`, `PrimeDialog`/`Dialog`, `PrimeDropdown`/`DropdownMenu`, `PrimeTooltip`/`Tooltip`, and the `LoadingButton`/`FormSubmitButton`/`LinkButton`/`TooltipButton` wrappers).
3. **Colors are ad-hoc numeric ramps.** Components reference `primary-15…900`, `secondary-*`, `accent-*`, `muted-*`, `surface-*` in 56 distinct combinations, so there are no semantic roles to restyle against.

The kit also lacks components that a serious admin / data-entry product needs (sheets, stat cards, description lists, charts, OTP, tag input, notifications…).

## 2. Goals

1. Give RSK a **distinctive, non-generic visual language**: *Graphite Instrument* — graphite neutrals, an Oxblood accent, Schibsted Grotesk + Noto Kufi Arabic.
2. Replace numeric color ramps with a **semantic token system**, dark-first with a fully tuned light mode, both WCAG AA.
3. **Clean up the API**: one shared prop vocabulary (`variant` × `tone` × `size`), consolidated duplicates, no `Prime*` prefix — as a **clean break** with all call sites migrated.
4. Add **16 new components** so RSK is a complete kit.
5. Every component follows the project's **own component conventions** (`forge:create-component` + README code standards).

## 3. Non-Goals

- Backend/data changes; real data for demos (mock data only).
- Changing the theme mechanism (the `.dark` class strategy and theme switcher stay).
- Deprecation shims for removed APIs (explicitly rejected: clean break).
- Marketing/landing-page redesign beyond what inherits the new tokens automatically.

## 4. Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Overall goal | Visual refresh **+** API cleanup |
| Visual direction | **D · Graphite Instrument** — dark-first, dense, neutral primary action, status as dot-in-chip |
| Light mode | **Equal citizen** — hand-tuned, same contrast/state checks as dark; dark stays the default |
| Accent | **Oxblood** (avoids blue/indigo/violet/teal/mint/neon/terracotta "AI colors") |
| Typography | **Schibsted Grotesk** (UI) + **Noto Kufi Arabic** (RTL) + **Spline Sans Mono** (IDs, amounts, shortcuts) |
| Breaking changes | **Clean break** — rename/remove freely, migrate every call site in the same change, no aliases |
| New components | All 16 proposed (see §9) |
| Charts | **Recharts**, themed through tokens, lazy-loaded (new runtime dependency — approved) |
| Test deps | `@testing-library/react` + `happy-dom` (new dev dependencies — approved) |
| Design lens | `/frontend-design` + Taste Skill `redesign-skill` and `output-skill` (installed project-locally) |
| Structure | **Foundations → Primitives → Composites → New components**, four sub-projects |

Mockups used for these decisions live in `.superpowers/brainstorm/` (gitignored): `component-kit.html` (direction comparison), `accent-v2.html`, `typography-v2.html`.

## 5. Delivery Structure

The work is split into four sub-projects. **Each gets its own implementation plan and PR**, stacked in order; layers 2–4 may get a short addendum spec for per-component variant matrices, but must not reopen decisions made here.

| # | Sub-project | Scope | Visible breakage |
|---|---|---|---|
| 1 | **Foundations** | Token layers, fonts, type scale, radius, sizes, elevation, motion, state rules, test guards, Taste install | None by design (old ramp tokens are removed in #2, together with their call sites) |
| 2 | **Primitives (`ui/`)** | Restyle + new API for every `ui/` component; migrate their call sites; remove old color ramps | Yes — migrated in the same PR |
| 3 | **Composites (`forms/`, `shared/`, `tables/`, `calendar/`)** | Rebuild on new primitives; consolidation map (§8.2); uniform form-field contract | Yes — migrated in the same PR |
| 4 | **New components** | The 16 additions (§9) built natively in the system | None |

This spec details **sub-project 1 fully** and fixes the binding rules for 2–4.

## 6. Component Conventions ("the project way") — mandatory in all sub-projects

1. **Workflow = `forge:create-component`:** Audit (reuse anything covering ≥80%) → **variant matrix** (states, sizes, slots, responsive, RTL, dark) documented before code → pattern decision:
   - 2+ semantic sub-parts → **compound** component (`Root.Header`, …, static assignment, `FC & { … }` type)
   - 3+ visual variants → **CVA**; otherwise `cn()` conditionals
   - state shared across 3+ sub-components → `createContext` inside the compound
2. **Files:** kebab-case folder, PascalCase file, `index.ts` re-exporting the default, tier barrel export (`@components/ui | shared | forms | tables`).
3. **Every sub-component:** accepts `className`, merges with `cn()`, spreads `...props`, sets `data-slot="<component>-<slot>"`, uses semantic HTML.
4. **Code standards (README):** alias imports in fixed group order; `type` not `interface`; `import type`; **`Conditional.If`** instead of `&&`/ternaries in JSX; **theme tokens only — no hex/rgb, no arbitrary values** (`p-[24px]`); prescribed hook order; `handle*` handlers; default export last; no `any`, no TODOs, no swallowed errors.
5. **Ships with:** MDX doc via `forge:document-component` (passing `pnpm docs:lint`), EN + AR keys via `forge:add-translations`, and clean passes of `forge:audit-rtl`, `forge:audit-dark-mode`, `forge:audit-a11y`.
6. **Design lens:** `/frontend-design` and Taste `redesign-skill` review the *visual* result of each component; they never replace rule 1–4 for code structure.

Consequence of rule 4: **every design value must exist as a theme token** so components reach it through Tailwind's scale. This is why Foundations comes first.

## 7. Foundations (Sub-project 1)

### 7.1 Color — two layers

**Layer 1 — raw palette** (OKLCH, defined in `:root` and `.dark`, *never referenced by components*): 12-step `graphite`, 12-step `oxblood`, and status ramps `green`, `amber`, `vermilion`, `steel`.

**Layer 2 — semantic tokens** (exposed via `@theme inline` as `--color-*`; the **only** colors components may use):

| Role | Token | Dark (default) | Light |
|---|---|---|---|
| App background | `canvas` | `#0F1012` | `#FCFCFD` |
| Sunken (sidebar, wells) | `surface-sunken` | `#0C0D0F` | `#F6F6F8` |
| Card / control | `surface` | `#141518` | `#FFFFFF` |
| Menus, popovers | `surface-raised` | `#1A1B1E` | `#FFFFFF` (+ shadow) |
| Scrim | `overlay` | graphite 0 @ 70% | graphite 12 @ 40% |
| Text | `fg` | `#E6E7E9` | `#16171A` |
| Secondary text | `fg-muted` | `#8A8F98` | `#6B7079` |
| Tertiary text (disabled, decorative meta only — ≥3:1) | `fg-subtle` | `#616770` | `#8D9199` |
| Text on inverse | `fg-inverse` | `#0F1012` | `#FFFFFF` |
| Decorative lines (cards, dividers) | `border` | `#26282D` | `#E3E4E8` |
| Control boundaries (inputs, checkboxes — WCAG 1.4.11, ≥3:1) | `border-strong` | `#63656C` | `#8F9197` |
| Row lines | `border-subtle` | `#1D1F23` | `#EEEFF2` |
| Primary action | `inverse` / `inverse-fg` | `#E6E7E9` / `#0F1012` | `#16171A` / `#FFFFFF` |
| Primary action hover / pressed (solid steps, never an overlay) | `inverse-hover` / `inverse-pressed` | `oklch(0.86 …)` / `oklch(0.8 …)` | `oklch(0.29 …)` / `oklch(0.34 …)` |
| Accent (Oxblood) | `accent` | `#E07B89` | `#8C2236` |
| Text on accent | `accent-fg` | `#0F1012` | `#FFFFFF` |
| Selection tint | `accent-subtle` | accent @ 11% | `#F8ECEE` |
| Focus outline (solid, ≥3:1) | `ring` | = `accent` | = `accent` |
| Focus glow (decorative) | `ring-subtle` | accent @ 25% | accent @ 20% |
| Success | `success` / `-subtle` | `#4CC38A` / 12% | `#00844C` / `#E9F7EF` |
| Warning | `warning` / `-subtle` | `#E5A93B` / 12% | `#A26500` / `#FDF5E6` |
| Danger (vermilion) | `danger` / `-subtle` | `#FF6A3D` / 12% | `#CF421A` / `#FCEDE8` |
| Info (steel, not blue) | `info` / `-subtle` | `#9AA4B2` / 12% | `#5B6573` / `#EFF1F4` |

Each status also gets `-fg` (text on its solid fill): `#0F1012` in dark, `#FFFFFF` in light. Status colors are used as **text** (error messages, deltas), so each must reach 4.5:1 on `surface`; status *badges* use `fg` text with a status-colored dot (dot ≥3:1). Placeholders use `fg-muted`, never `fg-subtle`. The light success/warning/danger and both `fg-subtle`/`border-strong` values above were tuned during planning by a contrast script to meet these targets. Hex values are the approved references; the plan converts them to OKLCH and may adjust lightness only to meet §7.8 contrast targets. Errors moved to **vermilion** so they never collide with the Oxblood accent. Info is **steel**, not blue, to stay off the AI palette.

**Sidebar and code-surface tokens** (`sidebar-*`, `code-*`) are rebuilt on layer 1.

### 7.2 Typography

- **Families (`@theme`):** `--font-sans: 'Schibsted Grotesk', 'Noto Kufi Arabic', system-ui, sans-serif`; `--font-mono: 'Spline Sans Mono', ui-monospace, monospace`. Under `[dir=rtl]`, Noto Kufi Arabic leads.
- **Loading:** Google Fonts (replacing DM Sans, Fraunces, IBM Plex Sans Arabic) with `display=swap`; weights 400/500/600/700 (Schibsted), 400/500/600 (Kufi), 400/500 (Spline Mono).
- **Scale (replaces current `--text-*`):**

| Token | Size / line-height | Use |
|---|---|---|
| `text-2xs` | 11 / 16 | meta, shortcut hints |
| `text-xs` | 12 / 16 | labels, table headers, badges |
| `text-sm` | 13 / 20 | dense UI, table cells |
| `text-base` | **14 / 22** | **body & controls (default)** |
| `text-md` | 16 / 24 | card titles |
| `text-lg` | 18 / 26 | section titles |
| `text-xl` | 22 / 28 | page titles |
| `text-2xl` | 28 / 34 | stat values, display |

- **RTL optical adjustment:** under `[dir=rtl]`, line-height +0.2 and a slightly reduced optical size (Kufi renders large); tuned visually in the plan.
- **Numbers:** Western digits in both locales (existing i18n decision). `tabular-nums` default in tables, stats and money; IDs/amounts use `font-mono`.
- Display/heading letter-spacing −0.02em; never tracking on Arabic.

### 7.3 Shape & density

- **Radius:** `rounded-sm` 4px (checkbox, kbd), `rounded-md` 6px (controls), `rounded-lg` 10px (cards, popovers, dialogs, sheets), `rounded-full` (switch, avatar, spinner).
- **Control heights (the shared `size` prop):** `sm` 28px · `md` 32px (default) · `lg` 40px — exposed as `--spacing-control-sm|md|lg` (Tailwind v4 spacing namespace → `h-control-md`, `min-h-control-sm`, …) and used by Button, IconButton, Input, Select, Combobox, Tabs, SegmentedControl, DatePicker triggers.
- Spacing stays Tailwind's 4px scale; no arbitrary values.

### 7.4 Elevation

- **Resting elements have no shadow** (Taste rule): cards, inputs, tables use `border` only.
- `shadow-raised` — menus, popovers, hover cards, toasts. `shadow-overlay` — dialogs, sheets.
- In dark mode, depth comes primarily from the surface ladder (`surface-sunken` → `surface` → `surface-raised`) plus a hairline; shadows are secondary.
- Existing `shadow-boundary*`, `shadow-spread`, `shadow-deep`, `shadow-inner` are removed (clean break).

### 7.5 Motion

- Durations: `--duration-fast` 120ms (hover, press), `--duration-base` 180ms (menus, popovers, tabs), `--duration-slow` 260ms (dialog, sheet).
- One easing: `--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Animate **only** `transform` and `opacity`. Press = `scale(0.98)`.
- `prefers-reduced-motion: reduce` → keep opacity fades, remove all translation/scale.
- `animate-prime-loader-move` is replaced by the Spinner's own keyframes (sub-project 4).

### 7.6 Interaction states (single rule set)

| State | Treatment |
|---|---|
| Hover | `hover` overlay (ghost/outline) or a solid step for filled controls (`inverse-hover`; never `bg-hover`/`bg-pressed` on a solid fill — it replaces the fill) |
| Pressed | `fg` overlay 8% + `scale(0.98)` |
| Selected | `accent-subtle` background (rows, calendar ranges, list items) |
| Focus | `:focus-visible` only. Buttons/links: 2px solid `ring` outline + 2px offset. Inputs: `ring` border + 3px `ring-subtle` glow |
| Invalid | `danger` border + `danger-subtle` glow + message text (never color alone) |
| Disabled | 50% opacity, `pointer-events: none`, `aria-disabled` honored |
| Loading | content replaced by Spinner, width preserved, `aria-busy` |

These are implemented once as Tailwind `@utility` helpers (e.g. `state-hover`, `focus-ring`, `focus-ring-input`) so components don't re-derive them.

### 7.7 Theme mechanics

`.dark` class strategy, `ThemeProvider` and theme switcher are unchanged; **dark remains the default**. Both modes are first-class: every semantic token has an explicit, hand-tuned value in each.

### 7.8 Foundations test guards

1. **Contrast test (Vitest, Node):** parses semantic token pairs from `src/index.css` in both modes and asserts WCAG AA — text pairs ≥ 4.5:1 (`fg` and `fg-muted` on `canvas`/`surface`/`surface-raised`/`surface-sunken`; `accent`, `success`, `warning`, `danger`, `info` on `surface`; `accent-fg`/`accent`, `fg-inverse`/`inverse`, each status `-fg` on its fill), UI pairs ≥ 3:1 (`border-strong`, `ring`, `fg-subtle` on `surface`).
2. **Forbidden-pattern test — a ratchet (Vitest, Node):** scans `src/**/*.tsx` for: `Prime[A-Z]` identifiers; removed variant strings (§8.2); old ramp utilities (`(bg|text|border|ring)-(primary|secondary|accent|muted|surface)-\d+`); hex/rgb color literals; arbitrary **length** values (`-[<n>px|rem]`, e.g. `text-[12px]`). Layout brackets such as `grid-cols-[auto_1fr]` or `rounded-[inherit]` are allowed (README bans arbitrary *pixel* values, not brackets).
   - Foundations commits a **baseline** (`forbidden-patterns.baseline.json`: per-file counts of today's violations — at time of writing 60 arbitrary length values and 23 hex literals, plus all ramp/`Prime*` usages).
   - The test fails if any file's count **increases** or a new file introduces a violation; counts may only go down. Each sub-project lowers the baseline for what it migrates; sub-project 3 ends with an empty baseline for ramps, `Prime*`, removed variants and length values.
   - Legitimate hex values that are *data*, not styling (e.g. ColorEditor defaults, avatar palettes), move to constants in `.ts` files, which the scan excludes.
3. **Test environment:** add `@testing-library/react` + `happy-dom`; DOM tests opt in per file (`// @vitest-environment happy-dom`), Node remains the default.

### 7.9 Foundations deliverables

- `src/index.css` rewritten around §7.1–7.6 (raw + semantic layers, `@theme`, utilities).
- Font imports switched; `.impeccable.md` updated to describe Graphite Instrument.
- Contrast + forbidden-pattern tests; test deps installed.
- Taste `redesign-skill` + `output-skill` installed project-locally (`npx skills add Leonxlnx/taste-skill --skill <name>`).
- A **Foundations page** in the component gallery: color roles (both modes), type scale (EN + AR), radius, sizes, elevation, motion, states.
- Until sub-project 2 lands, legacy ramp variables stay defined (mapped onto the new palette) so nothing renders broken in between; they are deleted in sub-project 2 together with their call sites.

## 8. Binding Rules for Sub-projects 2–3

### 8.1 Shared API vocabulary

| Prop | Meaning | Values |
|---|---|---|
| `variant` | visual weight | `solid` · `outline` · `ghost` · `link` (subset per component) |
| `tone` | semantic color | `neutral` · `accent` · `success` · `warning` · `danger` · `info` (subset per component) |
| `size` | control height | `sm` · `md` · `lg` |
| booleans | behavior | `loading`, `disabled`, `fullWidth`, `invalid` |
| slots | compound structure | `.Header` `.Title` `.Description` `.Content` `.Footer` `.Actions` — same names everywhere |
| events | Radix convention | `onValueChange`, `onOpenChange`, `onCheckedChange` |
| polymorphism | element swapping | `asChild` (Radix `Slot`) wherever a component renders an element |

- **Form-field contract:** every `Form*` accepts `name`, `label`, `description`, `required`, `disabled`, `className` (+ its own options); `invalid` derives from React Hook Form `fieldState`. No per-component `xClassName` props (e.g. `checkboxClassName` is removed in favor of `data-slot` targeting).
- **A11y by types:** `IconButton` requires `aria-label` and renders it as its tooltip; `Dialog`/`Sheet` require a `Title` (visually hidden allowed).

### 8.2 Consolidation map (clean break; all call sites migrated in the same PR)

| Today | Becomes | Sub-project |
|---|---|---|
| `Button` (24 variants), `LoadingButton`, `FormSubmitButton`, `LinkButton` | `Button` — `variant` × `tone` × `size`, `loading`, `fullWidth`, `asChild` | 2 |
| `TooltipButton`, `size="icon" \| "icon-sm"` | `IconButton` (required label → auto tooltip) | 2 |
| `PrimeDialog` | merged into `Dialog` (`dismissible`, panel conveniences) | 2 |
| `PrimeDropdown` | removed → `DropdownMenu` | 2 |
| `PrimeTooltip` | merged into `Tooltip` (`<Tooltip content side>`) | 2 |
| `Chip`, `Badge variant="chip"` | `Badge` (static status, `tone`) + `Tag` (interactive, removable) | 2 |
| `ToggleGroup` single-select usage | `SegmentedControl` (built on ToggleGroup) | 2 / 4 |
| `RadioDot`, `ScrollSelector` | internal parts, not exported from barrels | 2 |
| `ui/layout` | `AppShell` + `Sidebar` | 3 / 4 |
| `FormSubmitButtons` | `FormContainer.Actions` | 3 |
| `PrimeCard`, `CollapsibleCard`, `MetaCard` loader | `Card` compound with `collapsible`, `loading` | 3 |
| `MetaCard` key/value body | `DescriptionList` | 3 / 4 |
| `GridCard` | `CardGrid` (layout only) | 3 |
| `ConfirmDialog`, `CountTooltip`, `ErrorTooltip` | kept, rebuilt on new `Dialog` / `Tooltip` | 3 |
| `PrimeLoader` | `Spinner` (with overlay mode) | 3 / 4 |
| `BlankSlate` | `EmptyState` (first-use / no-results / error) | 3 / 4 |
| `ActionPanel` | `PageHeader` (back, breadcrumb, title, actions) | 3 / 4 |
| `FieldSection` | `forms/FormSection` | 3 |
| `shared/composed-components` (empty) | deleted | 3 |

Removed `Button` variants (all replaced by `variant` × `tone`): `default, secondary, muted, destructive, success, icon, soft-primary, soft-muted, ghost-primary, ghost-muted, ghost-destructive, ghost-muted-primary, ghost-muted-destructive, quiet-primary, surface-primary, outline-muted, outline-destructive, outline-success, unstyled`; removed sizes `full, icon, icon-sm, unstyled, xs`. Removed `PrimeCard` variants `glass` and `gradient` (banned by the direction).

## 9. New Components (Sub-project 4)

| Tier | Components |
|---|---|
| `ui/` | Sheet/Drawer, HoverCard, ContextMenu, Kbd, SegmentedControl, Slider/Range, OTPInput, Spinner, Meter, Banner/Callout |
| `shared/` | PageHeader, Sidebar + AppShell, StatCard, Sparkline (dependency-free SVG), DescriptionList, Timeline/ActivityFeed, Chart (Recharts: bar/line/area via a token-mapped `ChartContainer`, lazy-loaded), TagInput, NotificationCenter, EmptyState |
| `forms/` | FormOTP, FormTagInput, FormSlider |
| `@hooks` / `@contexts` | `useHotkeys` + shortcut registry (`HotkeysProvider`) powering ⌘K and `Kbd` hints in menus |

Each new component goes through §6 in full (variant matrix first).

## 10. Verification

**Per component (definition of done):** forge quality checklist ✓ · MDX doc + `pnpm docs:lint` ✓ · EN/AR keys ✓ · `forge:audit-rtl` / `audit-dark-mode` / `audit-a11y` clean ✓ · `vp check` 0 errors and no new warnings in touched files ✓ · `tsc -b` ✓.

**Per sub-project PR:**
- §7.8 guards green (contrast; forbidden patterns updated with that PR's removals).
- Behavior tests (happy-dom) for interactive components: OTP (paste, RTL order), TagInput (keyboard add/remove), Slider (keyboard steps), hotkeys registry, Dialog/Sheet focus trap and `Escape`.
- **Visual check:** `playwright-cli` screenshots of the gallery in dark/light × LTR/RTL, before and after, reviewed against this spec's direction.
- `vp build` passes; Recharts appears only in lazy chunks.

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Clean break leaves a stale call site | Forbidden-pattern test + `tsc -b` (removed props/components fail to type-check) |
| Oxblood vs danger confusion | Danger moved to vermilion; contrast test plus paired text on every invalid state |
| Kufi renders larger/taller than Schibsted | RTL optical adjustments (§7.2) verified in the 4-way screenshots |
| Dark-first light mode looks derived | Light values are hand-tuned (§7.1) and held to identical checks |
| Recharts bundle weight | Lazy-loaded `Chart`; build check that it never enters the main chunk |
| Scope (100 restyled + 16 new) | Four stacked sub-projects, each independently reviewable and shippable |

## 12. Open Items for Implementation Plans

- Exact OKLCH conversions and the 12-step raw ramps (sub-project 1 plan).
- Per-component variant matrices for layers 2–4 (produced in each plan's audit step, per §6).
