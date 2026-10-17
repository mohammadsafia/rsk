# Docs site: a professional UI-kit documentation layout

**Status:** approved design (brainstorm 2026-10-16, with visual mockups in `.superpowers/brainstorm/96153-1792163351/content/`)
**Branch:** `feat/ui-kit-composites`
**Follow-up:** 1 of 3 after SP3. Next come deeper shared/calendar components (2) and five business example pages (3).

## 1. Goal

Turn the component gallery into a standalone, public documentation site that reads like a professional UI kit (shadcn/ui, Radix). It has:
- a docs shell,
- reference pages with live Preview · Code examples,
- consistent API tables,
- ⌘K search,
- an "On this page" outline,
- guides.

## 2. Decisions

| Question | Decision |
|---|---|
| Audience | **Public showcase site**. It is standalone, outside the app shell, and needs no sign-in. The team uses it too. |
| Build (amended 2026-10-16) | **Development only.** The user asked for the docs to stay out of `vp build`. Docs routes, the Components menu item, the landing page's docs links and showcase, and the `docs` locale namespace exist only under `import.meta.env.DEV`. The landing stats come from a build-time `__RSK_DOC_COUNTS__` define (`scripts/docs/doc-counts.ts`), so production never imports the registry. |
| v1 features | Nav + ⌘K search + "On this page" outline; Preview · Code tabs; consistent props tables; a Guides section. |
| Page layout | **A: one reference page** with framed examples and a right-hand outline. No page-level tabs and no playground. |
| Example source | **`<Example>` in MDX.** A build-time MDX plugin captures each example's JSX source, so the Code tab always matches the preview. |
| Components index | **A: card grid** with live mini thumbnails and category filter chips. |

## 3. Routes

| Path | Page |
|---|---|
| `/docs` | Introduction (guide) |
| `/docs/<guide-id>` | Guides: `installation`, `theming`, `rtl-i18n`, `forms`, `data-tables` |
| `/docs/foundations` | Existing Foundations doc |
| `/docs/components` | Overview grid (`?category=` filter, URL-synced) |
| `/docs/components/<id>` | Component reference page |

- **Redirects:** `/components` → `/docs/components`, and `/components/<id>` → `/docs/components/<id>`, with `replace`.
- **Links:**
  - The landing page's nav "Components" / "Docs", the hero "Browse Components" and the Documented "Open Gallery" point to `/docs/components` and `/docs`.
  - The app sidebar's "Components" item points to `/docs/components`.
- **Unknown id:** the docs `NotFound` (an EmptyState inside the docs shell), with links back to the overview.

The docs routes are public. They sit outside `AuthGuard` and `AppLayout`, under a new `DocsLayout` route element.

## 4. Docs shell (`layouts/docs-layout`)

- **Top bar** (sticky, 56 px, hairline bottom border):
  - the `Logo` lockup,
  - nav links Docs · Components · Foundations, with the current section marked `aria-current`,
  - the ⌘K search trigger (the visible text matches its accessible name),
  - GitHub (`github.com/mohammadsafia/rsk`), `ThemeSwitcher`, `LanguageSwitcher`.
- **Left nav** is built from the registry:
  - **Getting started:** the guides in a fixed order.
  - Then Foundations, UI, Forms, Shared, Tables, Calendar, Hooks.
  - Items are sorted alphabetically within each group.
  - The current page uses the Sidebar active style (`bg-hover text-fg font-medium`, `aria-current="page"`), and groups can be collapsed.
  - The nav scrolls independently and keeps the active item in view.
- **Below `md`:** the left nav becomes a drawer, reusing `AppShell`'s drawer behaviour (focus, Escape, `inert` background). The top bar gains a menu button.
- **Content column:** max-width 768 px for prose. Example frames may span the column. Right outline column (from `xl`): 200 px.

## 5. Component reference page

Order of the page:

1. **Header:**
   - a breadcrumb (Components / <Category>),
   - an `h1` title and a description,
   - tags,
   - an import line `import { Button } from '@components/ui'` in mono, LTR, with a copy button.
2. **Body:** MDX content, composed of `<Example>`, prose, `<PropsTable>`, `<Callout>` and `<DoDont>`.
   - Every page ends with **API**, **Accessibility** and **RTL notes** sections. The template enforces this, and `docs:lint` warns when a section is missing.
3. **Prev / next** links, in left-nav order.
4. **"On this page"** outline (right column, from `xl`):
   - built from the page's `h2`/`h3`,
   - the section in view is highlighted (IntersectionObserver),
   - clicking a heading smooth-scrolls to it, honouring reduced motion,
   - headings get stable slugified ids and anchor links.

### `<Example>`

```mdx
<Example title="Variants" description="One vocabulary: variant × tone × size.">
  <Button>Solid</Button>
  <Button variant="outline">Outline</Button>
</Example>
```

- Renders a frame with a header bar holding:
  - **Preview · Code** tabs, as a Tabs primitive,
  - a **copy** button for the code,
  - **Dark/Light** and **LTR/RTL** toggles. These scope to that preview only, via a `class="dark|light"` and `dir` on the preview root. The rest of the page is unchanged.
- Preview stage: a subtle dot-grid background on `surface-sunken`, centred, wrapping.
- Code tab: the shared `CodeBlock`, `dir="ltr"`, with syntax highlighting.
- **Source capture:** a remark plugin (`scripts/docs/remark-example-source.ts`, wired into the MDX config in `vite.config.ts`) finds each `<Example>` JSX element. It takes the exact source text of its children from the MDX file, dedents it, and passes it as a `code` prop (a string). There is no runtime reflection.
- An optional `code` prop overrides the captured source, for examples whose state lives in a helper component.

### `<PropsTable>`

- Takes `rows: { prop, type, default?, description, required? }[]`.
- Uses the kit's `Table`: mono `prop`/`type`, a `required` badge, default "—".
- The table scrolls horizontally on narrow screens.
- Existing markdown API tables are converted during migration.

### `<Callout tone="note|warning|danger">` and `<DoDont do={…} dont={…}>`

- `Callout` is built on `Alert`.
- `DoDont` is two framed previews with captions:
  - "Do" gets a success dot.
  - "Don't" gets a danger dot.
  - There are no coloured side stripes.

## 6. Components overview (`/docs/components`)

- Title, a count line ("81 documented components…", taken from the registry), and category chips with counts. The selected chip is URL-synced as `?category=`.
- **Card grid:** 4 columns at `xl`, 3 at `lg`, 2 at `sm`, 1 on phones. Each card shows:
  - a 96 px **thumbnail stage** (`surface-sunken`),
  - the name and a one-line description,
  - the whole card is a link.
- **Thumbnails** come from `component-docs/thumbnails.tsx`:
  - `Record<docId, () => ReactNode>`, holding tiny, inert compositions of the real components (`aria-hidden`, `inert`).
  - Docs without one get a quiet category glyph.
  - The overview never loads MDX bodies.

## 7. Search (⌘K)

- A `CommandDialog`, opened by ⌘K / Ctrl+K or the top-bar trigger.
- **Index:** registry entries (title, description, tags, category) plus each page's `h2`/`h3` headings. The headings are extracted at build time by the same remark plugin into the frontmatter-like export `headings`, read eagerly with the frontmatter glob.
- **Results:** grouped as Guides · Components · Sections. Arrow keys and Enter navigate; a section result jumps to `/docs/components/<id>#<slug>`.
- Matching ignores case and diacritics.

## 8. Guides (new MDX)

| Guide | Contents |
|---|---|
| `introduction` | What RSK is, the stack, principles (tokens, RTL, a11y), links |
| `installation` | Clone, install, scripts (`vp dev`, `vp check`, `vp test`), aliases |
| `theming` | Token layers (palette → tokens → theme), dark mode, adding a token, the forbidden-pattern guard |
| `rtl-i18n` | EN/AR, logical classes, LTR-isolated data values, plurals, Western digits |
| `forms` | `FormContainer`, `FormField` contract, validation, `FormContainer.Actions` |
| `data-tables` | `DataTable` composition, filter family, `useDataTableFilters`, server params |

Each guide uses `<Example>` where code helps. The copy is English. The docs UI chrome is translated (EN/AR) with the `docs` namespace, but MDX prose stays English in v1.

## 9. Migration

- **Every existing MDX page:**
  - Wrap its demos in `<Example title>`.
  - Delete its duplicated "Code" fenced blocks.
  - Convert its API markdown tables to `<PropsTable>`.
  - Add "Accessibility" and "RTL notes" sections where they're missing (one or two lines each is fine).
- **Pages:** `ComponentsGalleryPage` and `ComponentDetailPage` are replaced by the docs pages. Their gallery internals are removed:
  - `component-docs/gallery/{doc-panel,sidebar-panel}`
  - the gallery-specific hooks that only served the old two-pane UI
- **Template:** `docs:new` emits the new structure, with Example, PropsTable, Accessibility and RTL notes.
- **`docs:lint`:**
  - warns when an `<Example>` has no `title`,
  - warns when a page lacks the three closing sections,
  - errors on a duplicated "Code" block after an Example.

## 10. i18n

A new `docs` namespace (EN/AR) for the chrome:
- nav group names,
- "On this page", "Search docs", Preview, Code, Copy, Copied,
- Dark/Light, LTR/RTL,
- Previous/Next,
- "Do"/"Don't",
- the empty and not-found copy.

## 11. Testing

- **Remark plugin:**
  - captured code equals the dedented children source;
  - it handles nested JSX, expressions and multi-line props;
  - the `code` prop override wins.
- **`<Example>`:**
  - tabs switch;
  - copy writes the code;
  - the RTL/dark toggles set `dir`/class on the preview only, not on `document`.
- **Outline:** it lists the headings with ids, and the active heading follows scroll (mocked IntersectionObserver).
- **Search:**
  - ⌘K opens it;
  - results are grouped;
  - arrows + Enter navigate;
  - a section result lands on its anchor;
  - Arabic diacritics are ignored.
- **Routes:**
  - the redirects work;
  - unknown ids show the not-found page;
  - docs routes render without auth.
- **Overview:**
  - the chip filter is URL-synced;
  - every registry entry renders a card (a thumbnail or the fallback).
- **Guard:** the forbidden-pattern baseline stays `{}`, and every MDX page passes the new `docs:lint` rules.
- **Visual:** four-way (dark/light × EN/AR) screenshots of the overview, Button, CalendarGrid, DataTable, a guide and the mobile drawer.

## 12. Out of scope

- A props playground or controls panel.
- Full-text search of MDX prose.
- Translating guide prose into Arabic.
- Versioned docs.
- Static-site export (the docs ship as routes of the same app).
