# Components Gallery Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sidebar + doc-panel component gallery with a visual grid gallery that navigates to full-page detail views, using a clean & minimal aesthetic.

**Architecture:** Grid page at `/components` shows cards with live MDX previews. Clicking a card navigates to `/components/:id` which renders the full MDX content in a full-page layout. Existing MDX registry, hooks, and utility functions are reused; sidebar/doc-panel components are removed.

**Tech Stack:** React 18, React Router v6, Tailwind CSS v4, Radix Tabs, MDX, Vite

---

### Task 1: Add route constant and detail route

**Files:**
- Modify: `src/routes/routes.ts:16-31`
- Modify: `src/routes/router.tsx:1-66`

- [ ] **Step 1: Add DETAIL path to routes.ts**

In `src/routes/routes.ts`, add a `DETAIL` entry inside `COMPONENTS`:

```ts
COMPONENTS: {
  INDEX: '/components',
  DETAIL: '/components/:id',
},
```

- [ ] **Step 2: Add detail route and lazy import in router.tsx**

In `src/routes/router.tsx`, add the lazy import at the top:

```tsx
const ComponentDetailPage = lazy(() => import('@pages/components/ComponentDetailPage'));
```

Then add the nested route under the dashboard children, right after the existing components route. Replace the current single components route with two routes:

```tsx
{
  path: FULL_ROUTES_PATH.COMPONENTS.INDEX,
  element: <ComponentsGalleryPage />,
},
{
  path: FULL_ROUTES_PATH.COMPONENTS.DETAIL,
  element: <ComponentDetailPage />,
},
```

- [ ] **Step 3: Create a stub ComponentDetailPage**

Create `src/pages/components/ComponentDetailPage.tsx` with a placeholder so the route resolves:

```tsx
const ComponentDetailPage = () => {
  return <div className="p-6">Component detail page (placeholder)</div>;
};

export default ComponentDetailPage;
```

- [ ] **Step 4: Verify the app builds**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/routes.ts src/routes/router.tsx src/pages/components/ComponentDetailPage.tsx
git commit -m "feat: add /components/:id route and detail page stub"
```

---

### Task 2: Simplify gallery types and hooks

**Files:**
- Modify: `src/component-docs/gallery/types.ts`
- Modify: `src/component-docs/gallery/hooks.ts`
- Modify: `src/component-docs/gallery/index.ts`
- Modify: `src/component-docs/gallery/utils.tsx`

- [ ] **Step 1: Simplify types.ts — remove SidebarPanelProps and DocPanelProps**

Replace the full contents of `src/component-docs/gallery/types.ts` with:

```ts
import type { ComponentPropsWithoutRef } from 'react';

export type PreProps = ComponentPropsWithoutRef<'pre'>;

export type CategoryTab = Readonly<{
  key: string;
  label: string;
}>;
```

- [ ] **Step 2: Simplify hooks.ts — remove sidebar-specific hooks**

Keep these hooks (they're used by the gallery grid):
- `useDocsGroupedByCategory`
- `useDocsInActiveCategory`
- `useDocsFilteredBySearchTextByCategory`
- `useSelectedDocComponent`
- `useAutoSwitchCategoryOnEmptySearchResults`
- `useEnsureActiveCategoryExists`

Remove these hooks (sidebar/doc-panel specific, no longer needed):
- `useAvailableTagOptions`
- `useDocsFilteredByActiveTags`
- `useSelectedDoc`
- `useInitSelectedDocId`
- `useEnsureSelectedDocIsVisible`

The file should contain:

```ts
import { useEffect, useMemo, lazy } from 'react';

import { normalizeCategoryKey } from '@component-docs/registry';

import { filterDocsBySearchText } from '@component-docs/gallery/utils';

import type { Dispatch, SetStateAction } from 'react';
import type { ComponentDocEntry } from '@component-docs/registry';
import type { CategoryTab } from '@component-docs/gallery/types';

export function useDocsGroupedByCategory(allDocs: ReadonlyArray<Readonly<ComponentDocEntry>>) {
  return useMemo(() => {
    const by = new Map<string, ReadonlyArray<Readonly<ComponentDocEntry>>>();

    for (const doc of allDocs) {
      const key = normalizeCategoryKey(doc.category);
      const list = by.get(key) ?? [];
      by.set(key, [...list, doc]);
    }

    return by;
  }, [allDocs]);
}

export function useDocsInActiveCategory(
  docsByCategory: Map<string, ReadonlyArray<Readonly<ComponentDocEntry>>>,
  activeCategoryKey: string,
) {
  return useMemo(() => docsByCategory.get(activeCategoryKey) ?? [], [docsByCategory, activeCategoryKey]);
}

export function useDocsFilteredBySearchTextByCategory(
  docsByCategory: Map<string, ReadonlyArray<Readonly<ComponentDocEntry>>>,
  categoryTabOptions: CategoryTab[],
  searchText: string,
) {
  return useMemo(() => {
    const result = new Map<string, ReadonlyArray<Readonly<ComponentDocEntry>>>();
    for (const tab of categoryTabOptions) result.set(tab.key, []);

    const allDocs = Array.from(docsByCategory.values()).flat();
    const filteredAllDocs = filterDocsBySearchText(allDocs, searchText);

    for (const doc of filteredAllDocs) {
      const key = normalizeCategoryKey(doc.category);
      const list = result.get(key) ?? [];
      result.set(key, [...list, doc]);
    }

    return result;
  }, [docsByCategory, categoryTabOptions, searchText]);
}

export function useSelectedDocComponent(selectedDoc: Readonly<ComponentDocEntry> | null) {
  return useMemo(() => (selectedDoc ? lazy(selectedDoc.load) : null), [selectedDoc]);
}

export function useAutoSwitchCategoryOnEmptySearchResults(
  searchText: string,
  activeCategoryKey: string,
  docsByCategoryFiltered: Map<string, ReadonlyArray<Readonly<ComponentDocEntry>>>,
  categoryTabOptions: CategoryTab[],
  setActiveCategoryKey: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    if (!searchText.trim()) return;
    if ((docsByCategoryFiltered.get(activeCategoryKey) ?? []).length > 0) return;

    const nextTabWithResults = categoryTabOptions.find((tab) => (docsByCategoryFiltered.get(tab.key) ?? []).length > 0);
    if (!nextTabWithResults) return;

    setActiveCategoryKey(nextTabWithResults.key);
  }, [searchText, activeCategoryKey, docsByCategoryFiltered, categoryTabOptions, setActiveCategoryKey]);
}

export function useEnsureActiveCategoryExists(
  categoryTabOptions: CategoryTab[],
  activeCategoryKey: string,
  setActiveCategoryKey: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    if (categoryTabOptions.length === 0) return;
    if (categoryTabOptions.some((tab) => tab.key === activeCategoryKey)) return;
    setActiveCategoryKey(categoryTabOptions[0].key);
  }, [categoryTabOptions, activeCategoryKey, setActiveCategoryKey]);
}
```

- [ ] **Step 3: Update utils.tsx — add "All" tab support**

In `src/component-docs/gallery/utils.tsx`, update `buildCategoryTabOptions` to prepend an "All" tab:

```tsx
export function buildCategoryTabOptions(docs: ReadonlyArray<Readonly<ComponentDocEntry>>): CategoryTab[] {
  const categoryKeys = new Set<string>();
  for (const doc of docs) categoryKeys.add(normalizeCategoryKey(doc.category));

  const categoryTabs = Array.from(categoryKeys)
    .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey))
    .map((categoryKey) => ({
      key: categoryKey,
      label: formatCategoryLabel(categoryKey),
    }));

  const uiTabIndex = categoryTabs.findIndex((categoryTab) => categoryTab.key === 'UI');
  if (uiTabIndex > 0) {
    const [ui] = categoryTabs.splice(uiTabIndex, 1);
    categoryTabs.unshift(ui);
  }

  // Prepend "All" tab
  categoryTabs.unshift({ key: 'ALL', label: 'All' });

  return categoryTabs;
}
```

Also add the `ALL_CATEGORY_KEY` constant at the top of the file (after imports):

```ts
export const ALL_CATEGORY_KEY = 'ALL';
```

- [ ] **Step 4: Update gallery barrel index.ts**

Replace `src/component-docs/gallery/index.ts` with:

```ts
export type { CategoryTab } from './types';
export * from './hooks';
export { buildCategoryTabOptions, ALL_CATEGORY_KEY } from './utils';
```

- [ ] **Step 5: Do NOT build or commit yet**

The gallery page still imports removed exports (`SidebarPanel`, `DocPanel`, etc.). Continue directly to Task 3 — both tasks share a single build check and commit.

---

### Task 3: Rewrite the Gallery Page

**Files:**
- Rewrite: `src/pages/components/ComponentsGalleryPage.tsx`

- [ ] **Step 1: Rewrite ComponentsGalleryPage.tsx**

Replace the entire file with the new grid gallery implementation:

```tsx
import { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

import { Input, Tabs } from '@components/ui';
import {
  buildCategoryTabOptions,
  ALL_CATEGORY_KEY,
  useDocsGroupedByCategory,
  useDocsFilteredBySearchTextByCategory,
  useAutoSwitchCategoryOnEmptySearchResults,
  useEnsureActiveCategoryExists,
} from '@component-docs/gallery';
import { getComponentDocsRegistry, normalizeCategoryKey } from '@component-docs/registry';
import { FULL_ROUTES_PATH } from '@routes/routes';

import { mdxComponents } from '@component-docs/gallery/utils';
import { MDXProvider } from '@mdx-js/react';

import type { ComponentDocEntry } from '@component-docs/registry';

// --- Card Preview (lazy-loaded MDX in a constrained container) ---

function CardPreview({ doc }: Readonly<{ doc: Readonly<ComponentDocEntry> }>) {
  const LazyComponent = useMemo(() => lazy(doc.load), [doc]);

  return (
    <div className="pointer-events-none h-40 overflow-hidden bg-muted-50 p-4">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-400 text-xs">{doc.title}</span>
          </div>
        }
      >
        <MDXProvider components={mdxComponents}>
          <LazyComponent />
        </MDXProvider>
      </Suspense>
    </div>
  );
}

// --- Component Card ---

function ComponentCard({ doc }: Readonly<{ doc: Readonly<ComponentDocEntry> }>) {
  const detailPath = FULL_ROUTES_PATH.COMPONENTS.DETAIL.replace(':id', doc.id);

  return (
    <Link
      to={detailPath}
      className="group block overflow-hidden rounded-lg border border-muted-200 bg-background transition-all duration-150 hover:border-muted-300 hover:shadow-sm"
    >
      <CardPreview doc={doc} />

      <div className="border-t border-muted-100 px-4 py-3">
        <div className="text-sm font-medium text-foreground">{doc.title}</div>
        {doc.description ? (
          <div className="mt-0.5 text-xs text-muted-400 line-clamp-1">{doc.description}</div>
        ) : null}
      </div>
    </Link>
  );
}

// --- Empty State ---

function EmptyState({ onClear }: Readonly<{ onClear: () => void }>) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-muted-400 text-sm">No components match your search.</p>
      <button
        type="button"
        onClick={onClear}
        className="text-foreground mt-2 text-sm font-medium underline underline-offset-4"
      >
        Clear filters
      </button>
    </div>
  );
}

// --- Gallery Page ---

const ComponentsGalleryPage = () => {
  const allDocs = useMemo(() => getComponentDocsRegistry(), []);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchText, setSearchText] = useState(() => searchParams.get('q') ?? '');
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>(
    () => searchParams.get('category') ?? ALL_CATEGORY_KEY,
  );

  const categoryTabOptions = useMemo(() => buildCategoryTabOptions(allDocs), [allDocs]);
  const docsByCategory = useDocsGroupedByCategory(allDocs);
  const docsByCategoryFiltered = useDocsFilteredBySearchTextByCategory(
    docsByCategory,
    categoryTabOptions,
    searchText,
  );

  // Compute visible docs based on active category
  const visibleDocs = useMemo(() => {
    if (activeCategoryKey === ALL_CATEGORY_KEY) {
      return Array.from(docsByCategoryFiltered.values()).flat();
    }
    return docsByCategoryFiltered.get(activeCategoryKey) ?? [];
  }, [docsByCategoryFiltered, activeCategoryKey]);

  const totalCount = allDocs.length;
  const categoryCount = useMemo(() => {
    const keys = new Set<string>();
    for (const doc of allDocs) keys.add(normalizeCategoryKey(doc.category));
    return keys.size;
  }, [allDocs]);

  // Sync search params to URL
  const updateSearchParams = useCallback(
    (nextCategory: string, nextSearch: string) => {
      const params = new URLSearchParams();
      if (nextCategory !== ALL_CATEGORY_KEY) params.set('category', nextCategory);
      if (nextSearch.trim()) params.set('q', nextSearch.trim());
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const handleCategoryChange = useCallback(
    (nextTab: string) => {
      setActiveCategoryKey(nextTab);
      updateSearchParams(nextTab, searchText);
    },
    [searchText, updateSearchParams],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchText(value);
      updateSearchParams(activeCategoryKey, value);
    },
    [activeCategoryKey, updateSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchText('');
    setActiveCategoryKey(ALL_CATEGORY_KEY);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  useAutoSwitchCategoryOnEmptySearchResults(
    searchText,
    activeCategoryKey,
    docsByCategoryFiltered,
    categoryTabOptions,
    setActiveCategoryKey,
  );

  useEnsureActiveCategoryExists(categoryTabOptions, activeCategoryKey, setActiveCategoryKey);

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-480 px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Components</h1>
            <p className="mt-1 text-sm text-muted-400">
              {totalCount} components across {categoryCount} categories
            </p>
          </div>

          <div className="relative w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <Input
              aria-label="Search components"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="py-2 pl-10 text-sm"
            />
          </div>
        </header>

        {/* Category Tabs */}
        <Tabs value={activeCategoryKey} onValueChange={handleCategoryChange} className="mb-8">
          <Tabs.List variant="plain" className="gap-0 border-b border-muted-200 p-0">
            {categoryTabOptions.map((tab) => {
              const isActive = tab.key === activeCategoryKey;
              const count =
                tab.key === ALL_CATEGORY_KEY
                  ? Array.from(docsByCategoryFiltered.values()).flat().length
                  : (docsByCategoryFiltered.get(tab.key) ?? []).length;

              return (
                <Tabs.Trigger
                  key={tab.key}
                  value={tab.key}
                  variant="fitContent"
                  className={`rounded-none border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-foreground text-foreground bg-transparent'
                      : 'border-transparent text-muted-400 hover:text-foreground bg-transparent'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-60">{count}</span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
        </Tabs>

        {/* Grid */}
        {visibleDocs.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleDocs.map((doc) => (
              <ComponentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentsGalleryPage;
```

- [ ] **Step 2: Verify the app builds (covers Task 2 + Task 3)**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit Task 2 + Task 3 together**

```bash
git add src/component-docs/gallery/types.ts src/component-docs/gallery/hooks.ts src/component-docs/gallery/utils.tsx src/component-docs/gallery/index.ts src/pages/components/ComponentsGalleryPage.tsx
git commit -m "feat: rewrite gallery as visual grid with simplified hooks"
```

---

### Task 4: Build the Component Detail Page

**Files:**
- Rewrite: `src/pages/components/ComponentDetailPage.tsx`

- [ ] **Step 1: Implement ComponentDetailPage.tsx**

Replace the stub with the full implementation:

```tsx
import { useMemo, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';

import { MDXProvider } from '@mdx-js/react';
import { ChevronRight } from 'lucide-react';

import { Chip } from '@components/ui';
import { DocsLayout } from '@component-docs';
import { getComponentDocsRegistry, componentDocsErrors } from '@component-docs/registry';
import { useSelectedDocComponent } from '@component-docs/gallery';
import { mdxComponents } from '@component-docs/gallery/utils';
import { FULL_ROUTES_PATH } from '@routes/routes';

const ComponentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const allDocs = useMemo(() => getComponentDocsRegistry(), []);

  const selectedDoc = useMemo(
    () => allDocs.find((doc) => doc.id === id) ?? null,
    [allDocs, id],
  );

  const SelectedDocComponent = useSelectedDocComponent(selectedDoc);
  const tags = selectedDoc?.tags ?? [];

  // Not found
  if (!selectedDoc) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto w-full max-w-480 px-6 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-foreground text-lg font-medium">Component not found</p>
            <p className="text-muted-400 mt-1 text-sm">
              No component with id "{id}" exists in the registry.
            </p>
            <Link
              to={FULL_ROUTES_PATH.COMPONENTS.INDEX}
              className="text-foreground mt-4 text-sm font-medium underline underline-offset-4"
            >
              Back to Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-480 px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm">
          <Link
            to={FULL_ROUTES_PATH.COMPONENTS.INDEX}
            className="text-muted-400 hover:text-foreground transition-colors"
          >
            Components
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-300" />
          <span className="text-foreground font-medium">{selectedDoc.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">{selectedDoc.title}</h1>

          {selectedDoc.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-400">{selectedDoc.description}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Chip key={tag} variant="muted" size="xs">
                  {tag}
                </Chip>
              ))}
            </div>
          ) : null}
        </header>

        {/* MDX Validation Errors */}
        {componentDocsErrors.length > 0 ? (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive-200 p-4 text-sm">
            <div className="mb-2 font-semibold">MDX docs validation issues</div>
            <ul className="list-disc space-y-1 pl-5">
              {componentDocsErrors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* MDX Content — renders live preview, code examples, and props as natural MDX flow */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-400 text-sm">Loading documentation...</p>
            </div>
          }
        >
          <DocsLayout variant="panel">
            <MDXProvider components={mdxComponents}>
              {SelectedDocComponent ? <SelectedDocComponent /> : null}
            </MDXProvider>
          </DocsLayout>
        </Suspense>
      </div>
    </div>
  );
};

export default ComponentDetailPage;
```

- [ ] **Step 2: Verify the app builds**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/components/ComponentDetailPage.tsx
git commit -m "feat: implement full-page component detail view"
```

---

### Task 5: Remove old sidebar and doc panel

**Files:**
- Delete: `src/component-docs/gallery/sidebar-panel/SidebarPanel.tsx`
- Delete: `src/component-docs/gallery/sidebar-panel/index.ts`
- Delete: `src/component-docs/gallery/doc-panel/DocPanel.tsx`
- Delete: `src/component-docs/gallery/doc-panel/index.ts`

- [ ] **Step 1: Delete the sidebar-panel and doc-panel directories**

```bash
rm -rf src/component-docs/gallery/sidebar-panel src/component-docs/gallery/doc-panel
```

- [ ] **Step 2: Verify no remaining imports reference the deleted files**

Run: `grep -r "sidebar-panel\|doc-panel\|SidebarPanel\|DocPanel" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
Expected: No results (all references were already removed in Tasks 2 and 3).

- [ ] **Step 3: Verify the app builds**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A src/component-docs/gallery/sidebar-panel src/component-docs/gallery/doc-panel
git commit -m "chore: remove old sidebar-panel and doc-panel components"
```

---

### Task 6: Visual polish and verify end-to-end

**Files:**
- May modify: `src/pages/components/ComponentsGalleryPage.tsx`
- May modify: `src/pages/components/ComponentDetailPage.tsx`

- [ ] **Step 1: Start the dev server and verify gallery grid**

Run: `npx vite dev`

Open `http://localhost:5173/components` in the browser. Verify:
- Page title shows "Components" with count and category count
- "All" tab is selected by default, showing all component cards
- Each card shows a live preview of the MDX component
- Clicking a category tab filters the grid
- Search input filters cards in real-time
- URL updates with `?category=` and `?q=` params

- [ ] **Step 2: Verify detail page navigation**

Click any component card. Verify:
- Navigates to `/components/:id`
- Breadcrumb shows "Components > ComponentName"
- Clicking "Components" breadcrumb navigates back to the gallery
- Component header shows title, description, and tags
- MDX content renders with live previews, code blocks with copy button, and proper styling
- "Component not found" page shows for invalid IDs (e.g. `/components/nonexistent`)

- [ ] **Step 3: Verify responsive layout**

Resize the browser to verify:
- Desktop (lg): 3-column grid
- Tablet (md): 2-column grid
- Mobile (sm): 1-column grid

- [ ] **Step 4: Apply any visual fixes needed**

If any spacing, alignment, or styling issues are found during verification, fix them. Common adjustments:
- Card preview height may need tweaking (currently `h-40`)
- Tab styling may need adjustment for the `data-[state=active]` override
- Ensure cards have consistent height regardless of description length

- [ ] **Step 5: Final build check**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit any fixes**

```bash
git add src/pages/components/ComponentsGalleryPage.tsx src/pages/components/ComponentDetailPage.tsx
git commit -m "style: polish gallery grid and detail page visual details"
```

Only commit if changes were made in Step 4. Skip if no changes needed.
