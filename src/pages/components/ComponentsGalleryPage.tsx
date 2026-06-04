import { type SetStateAction, useCallback, useMemo, useState } from 'react';

import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';

import { Button, Chip, Tabs } from '@components/ui';
import {
  buildCategoryTabOptions,
  DocPanel,
  type DocPanelProps,
  SidebarPanel,
  type SidebarPanelProps,
  useAutoSwitchCategoryOnEmptySearchResults,
  useAvailableTagOptions,
  useDocsFilteredByActiveTags,
  useDocsFilteredBySearchTextByCategory,
  useDocsGroupedByCategory,
  useDocsInActiveCategory,
  useEnsureActiveCategoryExists,
  useEnsureSelectedDocIsVisible,
  useInitSelectedDocId,
  useSelectedDoc,
  useSelectedDocComponent,
} from '@component-docs/gallery';
import { getComponentDocsRegistry, normalizeCategoryKey } from '@component-docs/registry';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const ComponentDocsGalleryPage = () => {
  const allDocs = useMemo(() => getComponentDocsRegistry(), []);

  const defaultCategoryKey = normalizeCategoryKey(allDocs[0]?.category);

  const [activeCategoryKey, setActiveCategoryKey] = useQueryState('category', parseAsString.withDefault(defaultCategoryKey));
  const [selectedDocId, setSelectedDocId] = useQueryState('doc', parseAsString.withDefault(''));
  const [activeTagArray, _setActiveTagArray] = useQueryState('tags', parseAsArrayOf(parseAsString).withDefault([]));
  const activeTagSet = useMemo(() => new Set(activeTagArray), [activeTagArray]);
  const setActiveTagSet = useCallback(
    (action: SetStateAction<Set<string>>) => {
      _setActiveTagArray((prev) => {
        const prevSet = new Set(prev ?? []);
        const next = typeof action === 'function' ? action(prevSet) : action;
        return [...next];
      });
    },
    [_setActiveTagArray],
  );

  const [searchText, setSearchText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const categoryTabOptions = useMemo(() => buildCategoryTabOptions(allDocs), [allDocs]);

  const docsByCategory = useDocsGroupedByCategory(allDocs);
  const docsByCategoryFiltered = useDocsFilteredBySearchTextByCategory(docsByCategory, categoryTabOptions, searchText);
  const docsInActiveCategory = useDocsInActiveCategory(docsByCategory, activeCategoryKey);

  const availableTagOptions = useAvailableTagOptions(docsInActiveCategory);
  const filteredDocsInActiveCategory = useDocsFilteredByActiveTags(docsByCategoryFiltered, activeCategoryKey, activeTagSet);

  const selectedDoc = useSelectedDoc(filteredDocsInActiveCategory, selectedDocId);
  const SelectedDocComponent = useSelectedDocComponent(selectedDoc);

  const totalInActiveCategory = docsInActiveCategory.length;
  const totalFilteredInActiveCategory = filteredDocsInActiveCategory.length;
  const hasSearchText = searchText.trim().length > 0;
  const hasActiveFilters = hasSearchText || activeTagSet.size > 0;
  const hasSelected = selectedDoc != null;
  const selectedDocTags = selectedDoc?.tags ?? [];

  const handleCategoryChange = useCallback((nextTab: string) => {
    setActiveCategoryKey(nextTab);
    setActiveTagSet(new Set());
    setSelectedDocId('');
  }, []);

  const toggleTagFilter = useCallback((tag: string) => {
    setActiveTagSet((previousTags) => {
      const nextTags = new Set(previousTags);
      if (nextTags.has(tag)) nextTags.delete(tag);
      else nextTags.add(tag);
      return nextTags;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchText('');
    setActiveTagSet(new Set());
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  useInitSelectedDocId(allDocs, categoryTabOptions, setSelectedDocId);

  useAutoSwitchCategoryOnEmptySearchResults(
    searchText,
    activeCategoryKey,
    docsByCategoryFiltered,
    categoryTabOptions,
    setActiveCategoryKey,
    setActiveTagSet,
  );

  useEnsureActiveCategoryExists(categoryTabOptions, activeCategoryKey, setActiveCategoryKey);

  useEnsureSelectedDocIsVisible(filteredDocsInActiveCategory, selectedDocId, setSelectedDocId);

  const sidebarProps: SidebarPanelProps = {
    activeCategoryKey,
    hasActiveFilters,
    totalFilteredInActiveCategory,
    totalInActiveCategory,
    clearFilters,
    searchText,
    setSearchText,
    availableTagOptions,
    activeTagSet,
    toggleTagFilter,
    filteredDocsInActiveCategory,
    selectedDocId,
    setSelectedDocId,
  };

  const docPanelProps: DocPanelProps = {
    hasSelected,
    selectedDoc,
    selectedDocTags,
    SelectedDocComponent,
    sidebarOpen,
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-480 px-6 py-8">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-primary-900 text-2xl font-bold">Components Gallery</h1>

            <p className="text-muted-400 mt-1 text-sm">Browse and explore components with live demos and usage examples.</p>
          </div>

          <Button variant="ghost-muted" size="icon-sm" onClick={toggleSidebar} className="mt-1">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </Button>
        </header>

        <Tabs value={activeCategoryKey} onValueChange={handleCategoryChange} className="mb-6">
          <Tabs.List variant="default" className="border-primary-100">
            {categoryTabOptions.map((tab) => {
              const isActive = tab.key === activeCategoryKey;
              const count = searchText.trim()
                ? (docsByCategoryFiltered.get(tab.key) ?? []).length
                : (docsByCategory.get(tab.key) ?? []).length;

              return (
                <Tabs.Trigger key={tab.key} value={tab.key} className="gap-2">
                  <span>{tab.label}</span>

                  <Chip variant={isActive ? 'default' : 'muted'} size="default">
                    {count}
                  </Chip>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
        </Tabs>

        <div className="grid grid-cols-12 gap-6">
          {sidebarOpen ? <SidebarPanel {...sidebarProps} /> : null}

          <DocPanel {...docPanelProps} />
        </div>
      </div>
    </div>
  );
};

export default ComponentDocsGalleryPage;
