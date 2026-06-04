# Dashboard UI Redesign — Design Spec

- **Date:** 2026-06-04
- **Status:** Approved (design), pending implementation plan
- **Branch:** `feat/dashboard-ui-redesign`
- **Owner:** Mohammad Safia

## 1. Context & Problem

RSK's authenticated dashboard shell looks unfinished and the global palette feels flat:

- **Colors** — the current "warm earth" OKLCH palette is near-monochrome: `--primary` equals `--foreground` (deep brown-black), so there is **no real brand color**. Buttons, badges, and active states have no pop.
- **Sidebar** (`DashboardSidebar`) — a flat, ungrouped link list with only an "S"/"Starter" text logo, a floating collapse button, and no user profile.
- **Header** (`DashboardHeader`) — nearly empty: a blank left section and a row of icon buttons on the right. No search, no command access, no page context.
- **Dashboard page** — `/dashboard` is a placeholder (`<div>Dashboard</div>`), so the shell never showcases well.

## 2. Goals

1. Replace the global palette with a cohesive **Ocean Blue** system (cool slate neutrals + a blue brand), in **both light and dark** themes, applied **app-wide** (including the landing page).
2. Redesign the sidebar as a **floating / inset** card with branding, grouped sections, a solid-blue active state, and a bottom user profile.
3. Redesign the header around a **fully functional ⌘K command palette**, keeping notifications, theme switcher, and the avatar menu.
4. Build a **sample dashboard page** (stat cards, chart, recent activity) so the new shell demonstrates itself.

## 3. Non-Goals

- Settings page content (stays a placeholder).
- Auth flow changes; real backend data (dashboard uses mock data).
- Adding a charting library (the chart is a dependency-free SVG).
- Changing the component library's public APIs.

## 4. Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Palette | **A · Ocean Blue** — cool slate neutrals + blue `#2563EB` |
| Color scope | **Whole app** (landing page included) |
| Sidebar | **C · Floating / inset** — rounded card, margin + shadow, solid-blue pill active item |
| Header | **B · Command bar (⌘K)** — fully functional palette |
| Sample dashboard page | **Yes** |

## 5. Detailed Design

### 5.1 Color system (`src/index.css`)

The token **structure is unchanged** — every existing CSS variable keeps its name, so all components continue to work. Only **values** change: warm hue 55–65 → cool **slate** neutrals (hue ~256) + a **blue** primary ramp (hue ~264).

**Principle:** preserve each token's existing lightness step; swap hue/chroma to the slate (neutral) or blue (primary/accent) family. Semantic colors (success/destructive/warning) are kept, lightly retuned to harmonize with cool neutrals.

**Key anchors — light mode:**

| Token | Target (hex ref) | OKLCH |
|---|---|---|
| `--background` | `#F8FAFC` slate-50 | `oklch(0.985 0.003 256)` |
| `--foreground` | `#0F172A` slate-900 | `oklch(0.21 0.03 264)` |
| `--secondary` | `#F1F5F9` slate-100 | `oklch(0.97 0.006 256)` |
| `--muted` (borders) | `#CBD5E1` slate-300 | `oklch(0.83 0.012 256)` |
| `--muted-foreground` | `#64748B` slate-500 | `oklch(0.55 0.03 257)` |
| `--border` | ≈ slate-200 on white | `oklch(0.21 0.03 264 / 12%)` (alpha of foreground, per existing pattern) |
| `--accent` | soft blue (hover) | `oklch(0.95 0.03 264)` |
| `--primary` (DEFAULT) | `#2563EB` blue-600 | `oklch(0.55 0.21 264)` |
| `--primary-foreground` | white | `oklch(0.99 0 0)` |

**Primary blue ramp — light mode** (lighter → darker; DEFAULT sits between `-400` and `-600`, matching the existing convention where `-600..900` are darker than DEFAULT):

| Var | hex ref |
|---|---|
| `--primary-15` | `#EFF6FF` blue-50 |
| `--primary-25` | `#E3EDFE` (between blue-50/100) |
| `--primary-50` | `#DBEAFE` blue-100 |
| `--primary-100` | `#BFDBFE` blue-200 |
| `--primary-200` | `#93C5FD` blue-300 |
| `--primary-300` | `#60A5FA` blue-400 |
| `--primary-400` | `#3B82F6` blue-500 |
| `--primary` | `#2563EB` blue-600 |
| `--primary-600` | `#1D4ED8` blue-700 |
| `--primary-700` | `#1E40AF` blue-800 |
| `--primary-800` | `#1E3A8A` blue-900 |
| `--primary-900` | `#172554` blue-950 |

**Key anchors — dark mode:**

| Token | OKLCH |
|---|---|
| `--background` | `oklch(0.18 0.02 264)` (deep slate) |
| `--foreground` | `oklch(0.97 0.005 256)` |
| `--secondary` | `oklch(0.24 0.02 264)` |
| `--muted-foreground` | `oklch(0.65 0.02 257)` |
| `--border` | `oklch(0.97 0.005 256 / 12%)` |
| `--primary` (DEFAULT) | `oklch(0.62 0.19 264)` ≈ blue-500 `#3B82F6` (brighter for dark) |
| `--primary-foreground` | `oklch(0.99 0 0)` white |
| `--sidebar` | `oklch(0.22 0.02 264)` (elevated panel) |
| `--sidebar-accent` | `oklch(0.27 0.02 264)` |

The remaining tonal tokens (`--secondary-15..900`, `--muted-50..400`, `--surface*`, `--accent-*`, `--popover`, `--code-*`, sidebar tokens) follow the same rule: **keep the existing lightness, move hue to slate (~256) / blue (~264)**.

**Why this is safe:** the landing page's solid dark buttons use `bg-foreground` (not `bg-primary`), so they stay dark; `bg-primary` usages (scrollbar, `::selection`, primary buttons, active nav) correctly become blue. After implementing, audit usages of `bg-primary-50/100` and `bg-accent` for any spot where a blue tint reads oddly.

### 5.2 Sidebar — floating / inset

**`DashboardLayout.tsx`** — wrap content in a padded canvas (`bg-secondary`), with the sidebar and main panel as separate rounded cards with a gap between them.

**`DashboardSidebar.tsx`** — the `<aside>` becomes a floating card: `rounded-xl border border-border bg-sidebar shadow-spread`, with outer margin from the layout canvas. Contents top→bottom:
1. **Brand** — a blue rounded-square logo mark with the app initial + a wordmark. App name sourced from `@app-config` (fallback "Starter").
2. **Grouped nav** — items grouped by an optional `group` label (see 5.5). Each group renders an uppercase section label (hidden when collapsed).
3. **Spacer**, then a **user profile** block pinned to the bottom (avatar + name + email), separated by a top border. Reuses `currentUser` from `useAuth`.

Collapse-to-icon-rail behavior is preserved and restyled; the floating collapse toggle is kept. All directional utilities stay RTL-safe (`ps/pe`, `ms/me`, `border-s/e`).

**`DashboardSidebarLink.tsx`** — restyle states:
- **Active:** solid blue pill — `bg-primary text-primary-foreground rounded-lg` (remove the current left accent bar).
- **Default:** `text-sidebar-foreground/70`; **hover:** `bg-sidebar-accent`.
- Submenu and collapsed-rail variants keep current logic, restyled to match.

### 5.3 Header — ⌘K command bar

**`DashboardHeader.tsx`**:
- **Left/center:** a command **trigger button** styled as a search field — placeholder "Search or jump to…" + a `⌘K` keyboard hint. Clicking it opens the palette.
- **Right:** notifications (`Bell`), `ThemeSwitcher`, and the existing avatar `DropdownMenu`. The standalone Help icon is removed (its role is absorbed by ⌘K; easy to re-add).

**New: `CommandPalette` (`src/components/shared/command-palette/`)** — built on the existing `cmdk` `Command` primitive inside `Dialog`:
- **Navigation group** — every `APP_MENU` route; selecting navigates and closes.
- **Actions group** — Toggle theme (via `ThemeContext`), Go to Settings/Profile (navigate), Log out (`useAuth().removeCurrentUser`).
- Filtering via cmdk's built-in search; `Esc` closes.

**New: `CommandPaletteContext` (`src/lib/contexts/`)** — exposes `{ open, setOpen, toggle }` and installs a global `keydown` listener for `⌘K` / `Ctrl+K`. The provider wraps the dashboard in `DashboardLayout`, which also renders a single `<CommandPalette />`. The header trigger calls `toggle()`.

### 5.4 Sample dashboard page

**New: `src/pages/dashboard/DashboardPage.tsx`** (lazy-loaded; router updated to use it for `FULL_ROUTES_PATH.HOME.DASHBOARD`). Sections:
1. **Stat cards** — 4 `Card`s, each: label, big value, and an up/down trend delta (green/red via `success`/`destructive`). Mock data.
2. **Chart card** — a larger `Card` containing a **dependency-free SVG area chart** (responsive `viewBox`, blue gradient fill). Local component; mock series.
3. **Recent activity** — a `Card` with a list of items (avatar/icon + text + relative time). Mock data.

Composed from existing `Card`, `Badge`, `Avatar`, `lucide-react` icons. Page-level subcomponents (`StatCard`, `AreaChart`, `ActivityList`) live in the page file or a local folder, following the project's page/view conventions.

### 5.5 Menu data (`src/routes/routes.ts`)

Add an optional `group?: string` to the `AppMenu` type. Tag existing items, e.g. Dashboard/Components → `"Main"`, Settings → `"Account"`. The sidebar groups items by `group` (preserving order; default group `"Main"`) and renders a section label per group. No change to `submenu` handling.

## 6. Files

**Modified:**
- `src/index.css` — Ocean Blue tokens (light + dark)
- `src/layouts/dashboard-layout/DashboardLayout.tsx` — inset canvas + palette provider mount
- `src/layouts/dashboard-sidebar/DashboardSidebar.tsx` — floating card, brand, groups, profile
- `src/layouts/dashboard-sidebar-link/DashboardSidebarLink.tsx` — active pill styling
- `src/layouts/dashboard-header/DashboardHeader.tsx` — ⌘K trigger + actions
- `src/routes/routes.ts` — `group` field on `AppMenu`
- `src/routes/router.tsx` — wire `DashboardPage`
- `src/components/shared/index.ts` — export `CommandPalette`
- `src/lib/contexts/index.ts` — export `CommandPaletteContext`

**New:**
- `src/components/shared/command-palette/CommandPalette.tsx` (+ `index.ts`)
- `src/lib/contexts/CommandPaletteContext.tsx`
- `src/pages/dashboard/DashboardPage.tsx` (+ local subcomponents)

## 7. Accessibility, RTL, Dark Mode

- Command palette: focus trap (via `Dialog`), full keyboard nav, `aria-label`s, visible focus rings.
- Maintain contrast (WCAG AA) for text on blue and on slate, in both themes.
- All new layout uses logical/RTL-safe utilities (`ps/pe`, `ms/me`, `border-s/e`, `start/end`).
- Every new token and component verified in light **and** dark.

## 8. Verification

- `yarn build` (tsc + Vite) passes clean.
- Manual pass: light/dark toggle; ⌘K open/close/navigate + theme toggle from palette; sidebar collapse/expand; mobile responsive; RTL spot-check; landing page still renders correctly under new tokens.
- Follow `fe-code-standards` (import order, compound components, CVA, `cn`, barrel exports). Use `frontend-design` + `ui-ux-pro-max` for visual polish during implementation.

## 9. Open Questions

None blocking. Accent shade, exact stat-card metrics, and chart series are tunable during implementation.
