# Components Gallery Redesign

## Overview

Replace the current sidebar + doc-panel gallery layout with a visual grid gallery that navigates to full-page component detail views. The new design follows a clean & minimal aesthetic — generous whitespace, thin borders, restrained palette — letting the components themselves be the visual focus.

## Goals

- **Visual scanning**: Users can quickly browse all components via a card grid with live rendered previews
- **Deep documentation**: Full-page detail view with equal space for live preview, code examples, and props/API
- **Showcase-worthy**: Polished enough to present to stakeholders or onboard new team members
- **Preserve existing infrastructure**: MDX registry, data model, discovery system, and hooks remain unchanged

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Browsing pattern | Grid Gallery | Visual-first scanning across many components |
| Detail view | Full-page navigation (`/components/:id`) | Maximum space for docs, code, and props |
| Visual tone | Clean & Minimal | Restrained palette, thin borders, whitespace. Components are the star |
| Detail sections | Preview + Code + Props (equal weight) | Serves all use cases: shopping, reference, and showcase |

---

## Gallery Page (`/components`)

### Header

- Title: "Components" (text-2xl, font-semibold, foreground)
- Subtitle: Component count, e.g. "42 components across 5 categories" (text-sm, muted)
- Search input: Right-aligned, subtle with search icon. Filters cards in real-time across title, description, category, and tags (reuse existing `matchesSearchText` logic)

### Category Tabs

- Horizontal underline-style tabs (not pills)
- Each tab: category label + count
- "UI" category pinned first (preserve existing `buildCategoryTabOptions` behavior)
- Active tab: bottom border in foreground color, text-foreground
- Inactive tab: text-muted, no border
- Selecting a tab filters the grid to that category
- Add a new "All" tab (not in current implementation) that shows every component across categories — natural for a grid gallery where browsing everything at once is useful

### Component Card Grid

- Responsive: 3 columns on desktop (lg), 2 on tablet (md), 1 on mobile (sm)
- Gap: consistent spacing (gap-6)

**Each card contains:**

1. **Preview area** (top): Neutral background (`bg-muted-50` or similar), padded container. Renders the actual component with representative variant(s). This is the key differentiator from the current text-only sidebar.
2. **Info area** (bottom): Component name (text-sm, font-medium) and one-line description (text-xs, muted). Minimal — no tags on the card.

**Card behavior:**
- Subtle border (`border-muted-200`)
- Hover: slight border color shift or shadow lift (transition-all)
- Click: navigates to `/components/:id` via React Router
- No active/selected state needed (navigates away)

### Filtering Behavior

- Search is global across all categories (preserve existing cross-category search)
- When a category tab is active, only show cards in that category
- Search + category work together: search filters within active category
- Empty state: centered message "No components match your search" with a "Clear filters" link
- Tag filtering is removed from the gallery page (simplification — tags appear on detail page)

---

## Detail Page (`/components/:id`)

### Navigation

- Breadcrumb: "Components" (link back to `/components`) > "Button" (current component name)
- The breadcrumb link preserves the gallery's active filters via URL search params (e.g. `/components?category=ui&q=button`) so they survive page refresh. Scroll position restored via React Router's `scrollRestoration` or manual scroll-to-top on the detail page.

### Component Header

- Component name (text-2xl, font-semibold)
- Description (text-sm, muted, max-width for readability)
- Tags displayed as subtle chips (muted variant, small size)
- Category label

### Section 1: Live Preview

- Full-width neutral container (`bg-muted-50`, rounded, padded)
- Renders the component's key variants as shown in its MDX documentation
- The MDX content IS the preview — the existing `SelectedDocComponent` renders here via `MDXProvider`
- Clean separation from the rest of the page with spacing

### Section 2: Code Examples

- Rendered from the MDX content via the existing `CodeBlock` component
- Syntax highlighting (already in place)
- Copy-to-clipboard button on each code block
- Dark code block background for contrast against the minimal page

### Section 3: Props / API

- Also rendered from MDX content
- If the MDX includes a props table, it renders with proper table styling
- This section is part of the natural MDX flow, not a separate data source

**Important note on sections:** The three sections (preview, code, props) are not separate hardcoded panels. They are the natural flow of the MDX documentation content rendered on the full page. The MDX files already structure content as: live examples → code snippets → props tables. The detail page provides the full-width canvas and clean styling for this content to render well.

### Error Handling

- If `:id` doesn't match any registered component: show "Component not found" with a link back to gallery
- MDX validation errors: show in a subtle warning banner (preserve existing `componentDocsErrors` display)
- Loading state: skeleton or subtle spinner while lazy-loading the MDX component

---

## Routing Changes

### New Route

```
/components       → ComponentsGalleryPage (grid view)
/components/:id   → ComponentDetailPage (full-page detail)
```

### Router Configuration

- Both routes remain under `DashboardLayout` with `AuthGuard`
- Both lazy-loaded with `React.lazy()`
- The `:id` param matches `ComponentDocEntry.id` (kebab-case string)

---

## File Changes

### New Files

| File | Purpose |
|---|---|
| `src/pages/components/ComponentDetailPage.tsx` | Full-page detail view for a single component |

### Modified Files

| File | Change |
|---|---|
| `src/pages/components/ComponentsGalleryPage.tsx` | Rewritten — grid layout replacing sidebar+doc panel |
| `src/routes/router.tsx` | Add `/components/:id` route |
| `src/routes/routes.ts` | Add `COMPONENTS.DETAIL` path constant |
| `src/component-docs/gallery/types.ts` | Simplify types (remove SidebarPanelProps, DocPanelProps) |
| `src/component-docs/gallery/hooks.ts` | Keep category/search/filter hooks, remove sidebar-specific ones |
| `src/component-docs/gallery/utils.tsx` | Keep utility functions, may simplify |

### Removed Files

| File | Reason |
|---|---|
| `src/component-docs/gallery/sidebar-panel/SidebarPanel.tsx` | Replaced by grid cards |
| `src/component-docs/gallery/doc-panel/DocPanel.tsx` | Replaced by ComponentDetailPage |

### Unchanged

- `src/component-docs/registry/` — entire registry system untouched
- `src/component-docs/code-block/` — reused in detail page
- `src/component-docs/docs-layout/` — reused in detail page
- All MDX documentation files — no changes needed
- All UI components (`src/components/ui/`) — consumed as-is

---

## Component Card Preview Strategy

Each card needs to render a live preview of the component. The approach:

1. **Eager-load frontmatter** (already done by registry via `import.meta.glob` with `eager: true`)
2. **Lazy-load the actual MDX component** only when the card enters the viewport (intersection observer)
3. **Render a constrained preview**: The MDX component renders inside a container with `overflow: hidden`, fixed height, and `pointer-events: none` to prevent interaction in the grid
4. **Fallback**: While loading, show a placeholder with the component name centered on a muted background

This means the grid shows actual rendered components, not static screenshots — keeping everything dynamic and always up-to-date with the real component library.

**Performance consideration:** Lazy-load card previews via `IntersectionObserver` so only visible cards load their MDX. Cards off-screen render the placeholder. This keeps initial page load fast even with 40+ components.

**Content clipping note:** Some MDX files may start with text/headings before the rendered component. With the fixed-height `overflow: hidden` container, the preview shows whatever the MDX renders first. This is acceptable — even a text preview is informative. Most MDX files lead with live component examples, so the majority of cards will show actual rendered components.

---

## Visual Specifications

### Colors (using existing design tokens)

- Page background: `bg-background`
- Card background: `bg-background` (white)
- Card border: `border-muted-200`
- Card hover border: `border-muted-300`
- Preview area background: `bg-muted-50`
- Text primary: `text-foreground`
- Text secondary: `text-muted-400`
- Active tab border: `border-foreground`
- Tags: `Chip` component with `variant="muted"` and `size="xs"`

### Typography

- Page title: `text-2xl font-semibold`
- Component name (card): `text-sm font-medium`
- Component description (card): `text-xs text-muted-400`
- Component name (detail): `text-2xl font-semibold`
- Section headings: Not needed — MDX content provides its own headings

### Spacing

- Page padding: `px-6 py-8` (preserve current)
- Max width: `max-w-480` (preserve current)
- Grid gap: `gap-6`
- Card padding: `p-0` (preview flush to edges, info area padded)
- Card info padding: `px-4 py-3`
- Card border radius: `rounded-lg`

### Transitions

- Card hover: `transition-all duration-150`
- Page navigation: default React Router transition (no custom animation needed)

---

## What This Design Does NOT Include

- **Interactive props playground** (e.g., Storybook controls) — MDX previews are sufficient for now
- **Dark mode toggle on preview** — inherits from app-level theme
- **Component versioning** — not needed for internal design system
- **Keyboard navigation between cards** — standard tab navigation is sufficient
- **Tag filtering on gallery page** — simplified to category tabs + search only
- **Sidebar toggle** — removed entirely (no sidebar)
