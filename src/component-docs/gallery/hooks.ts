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
