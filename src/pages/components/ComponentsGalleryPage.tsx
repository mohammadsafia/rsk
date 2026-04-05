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
import { FULL_ROUTES_PATH } from '@routes';

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
          <Tabs.List variant="underline">
            {categoryTabOptions.map((tab) => {
              const count =
                tab.key === ALL_CATEGORY_KEY
                  ? Array.from(docsByCategoryFiltered.values()).flat().length
                  : (docsByCategoryFiltered.get(tab.key) ?? []).length;

              return (
                <Tabs.Trigger key={tab.key} value={tab.key} variant="underline">
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
