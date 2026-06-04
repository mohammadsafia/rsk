import { useEffect, useMemo, lazy } from 'react';

import { normalizeCategoryKey } from '@component-docs/registry';

import { countTagsByLabel, filterDocsBySearchText } from '@component-docs/gallery/utils';

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

export function useAvailableTagOptions(docsInActiveCategory: ReadonlyArray<Readonly<ComponentDocEntry>>) {
  const tagCounts = useMemo(() => countTagsByLabel(docsInActiveCategory), [docsInActiveCategory]);

  return useMemo(
    () =>
      Array.from(tagCounts.entries())
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([tag, count]) => ({ tag, count })),
    [tagCounts],
  );
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

export function useDocsFilteredByActiveTags(
  docsByCategoryFiltered: Map<string, ReadonlyArray<Readonly<ComponentDocEntry>>>,
  activeCategoryKey: string,
  activeTagSet: Set<string>,
) {
  return useMemo(() => {
    const docsMatchingQuery = docsByCategoryFiltered.get(activeCategoryKey) ?? [];
    if (activeTagSet.size === 0) return docsMatchingQuery;

    return docsMatchingQuery.filter((docEntry) => {
      for (const tag of docEntry.tags ?? []) {
        if (activeTagSet.has(String(tag))) return true;
      }
      return false;
    });
  }, [docsByCategoryFiltered, activeCategoryKey, activeTagSet]);
}

export function useSelectedDoc(filteredDocsInActiveCategory: ReadonlyArray<Readonly<ComponentDocEntry>>, selectedDocId: string) {
  return useMemo(() => {
    if (filteredDocsInActiveCategory.length === 0) return null;

    const explicitlySelectedDoc = filteredDocsInActiveCategory.find((docEntry) => docEntry.id === selectedDocId);

    return explicitlySelectedDoc ?? filteredDocsInActiveCategory[0];
  }, [filteredDocsInActiveCategory, selectedDocId]);
}

export function useSelectedDocComponent(selectedDoc: Readonly<ComponentDocEntry> | null) {
  return useMemo(() => (selectedDoc ? lazy(selectedDoc.load) : null), [selectedDoc]);
}

export function useInitSelectedDocId(
  allDocs: ReadonlyArray<Readonly<ComponentDocEntry>>,
  categoryTabOptions: CategoryTab[],
  setSelectedDocId: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    if (!allDocs.length) return;
    if (!categoryTabOptions.length) return;

    const firstTabKey = categoryTabOptions[0].key;
    const firstDocInFirstTab = allDocs.find((docEntry) => normalizeCategoryKey(docEntry.category) === firstTabKey) ?? allDocs[0];
    const nextId = firstDocInFirstTab?.id ?? '';

    if (!nextId) return;

    setSelectedDocId((previousSelectedId) =>
      previousSelectedId && allDocs.some((docEntry) => docEntry.id === previousSelectedId) ? previousSelectedId : nextId,
    );
  }, [allDocs, categoryTabOptions, setSelectedDocId]);
}

export function useAutoSwitchCategoryOnEmptySearchResults(
  searchText: string,
  activeCategoryKey: string,
  docsByCategoryFiltered: Map<string, ReadonlyArray<Readonly<ComponentDocEntry>>>,
  categoryTabOptions: CategoryTab[],
  setActiveCategoryKey: Dispatch<SetStateAction<string>>,
  setActiveTagSet: Dispatch<SetStateAction<Set<string>>>,
) {
  useEffect(() => {
    if (!searchText.trim()) return;
    if ((docsByCategoryFiltered.get(activeCategoryKey) ?? []).length > 0) return;

    const nextTabWithResults = categoryTabOptions.find((tab) => (docsByCategoryFiltered.get(tab.key) ?? []).length > 0);
    if (!nextTabWithResults) return;

    setActiveCategoryKey(nextTabWithResults.key);
    setActiveTagSet(new Set());
  }, [searchText, activeCategoryKey, docsByCategoryFiltered, categoryTabOptions, setActiveCategoryKey, setActiveTagSet]);
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

export function useEnsureSelectedDocIsVisible(
  filteredDocsInActiveCategory: ReadonlyArray<Readonly<ComponentDocEntry>>,
  selectedDocId: string,
  setSelectedDocId: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    const first = filteredDocsInActiveCategory[0];
    if (!first) return;

    const isSelectedInThisTab = filteredDocsInActiveCategory.some((docEntry) => docEntry.id === selectedDocId);
    if (isSelectedInThisTab) return;

    setSelectedDocId(first.id);
  }, [filteredDocsInActiveCategory, selectedDocId, setSelectedDocId]);
}