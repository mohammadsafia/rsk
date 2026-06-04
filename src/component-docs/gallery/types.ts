import type { ComponentPropsWithoutRef, ComponentType, Dispatch, LazyExoticComponent, SetStateAction } from 'react';

import type { ComponentDocEntry } from '@component-docs/registry';

export type PreProps = ComponentPropsWithoutRef<'pre'>;

export type CategoryTab = Readonly<{
  key: string;
  label: string;
}>;

export type SidebarPanelProps = Readonly<{
  activeCategoryKey: string;
  hasActiveFilters: boolean;
  totalFilteredInActiveCategory: number;
  totalInActiveCategory: number;
  clearFilters: () => void;

  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;

  availableTagOptions: Array<{ tag: string; count: number }>;
  activeTagSet: Set<string>;
  toggleTagFilter: (tag: string) => void;

  filteredDocsInActiveCategory: ReadonlyArray<Readonly<ComponentDocEntry>>;
  selectedDocId: string;
  setSelectedDocId: Dispatch<SetStateAction<string>>;
}>;

export type DocPanelProps = Readonly<{
  hasSelected: boolean;
  selectedDoc: Readonly<ComponentDocEntry> | null;
  selectedDocTags: string[];
  SelectedDocComponent: LazyExoticComponent<ComponentType<any>> | null;
  sidebarOpen?: boolean;
}>;
