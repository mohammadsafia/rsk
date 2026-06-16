import { forwardRef, useCallback, useRef } from 'react';

import { Button, Card, Chip, Divider, Input, ScrollArea } from '@components/ui';

import { formatCategoryLabel } from '@component-docs/gallery/utils';

import { Search } from 'lucide-react';

import type { ComponentDocEntry } from '@component-docs/registry';
import type { SidebarPanelProps } from '@component-docs/gallery/types';

const TagFilterChip = ({
  tag,
  count,
  on,
  onToggle,
}: Readonly<{ tag: string; count: number; on: boolean; onToggle: (tag: string) => void }>) => (
  <Button variant="unstyled" size="unstyled" onClick={() => onToggle(tag)} aria-pressed={on}>
    <Chip variant={on ? 'default' : 'muted'} size="sm" className="cursor-pointer gap-1.5">
      <span>{tag}</span>

      <span className="text-2xs opacity-60">{count}</span>
    </Chip>
  </Button>
);

const DocListItem = forwardRef<
  HTMLButtonElement,
  Readonly<{ doc: Readonly<ComponentDocEntry>; isActive: boolean; onSelect: (id: string) => void }>
>(({ doc, isActive, onSelect }, ref) => {
  const tags = doc.tags ?? [];

  return (
    <Button
      ref={ref}
      variant="unstyled"
      size="unstyled"
      onClick={() => onSelect(doc.id)}
      data-active={isActive}
      className="bg-muted-50 hover:bg-muted-200 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground border-muted-200 flex w-full flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-all data-[active=true]:border-transparent"
    >
      <span className="text-sm font-semibold">{doc.title}</span>

      {doc.description ? <span className="text-xs leading-relaxed opacity-60">{doc.description}</span> : null}

      {tags.length ? (
        <div className="mt-1 flex items-center gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <Chip key={tag} variant="muted" size="xs">
              {tag}
            </Chip>
          ))}

          {tags.length > 3 ? <span className="text-muted-400 text-2xs">+{tags.length - 3}</span> : null}
        </div>
      ) : null}
    </Button>
  );
});

const SidebarPanel = (props: SidebarPanelProps) => {
  const {
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
  } = props;

  const hasScrolledRef = useRef(false);

  const activeItemRef = useCallback((node: HTMLButtonElement | null) => {
    if (!node || hasScrolledRef.current) return;
    const scrollContainer = node.closest('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    const containerRect = scrollContainer.getBoundingClientRect();
    const itemRect = node.getBoundingClientRect();
    const offset = itemRect.top - containerRect.top - containerRect.height / 2 + itemRect.height / 2;
    scrollContainer.scrollTop += offset;
    hasScrolledRef.current = true;
  }, []);

  return (
    <Card shadow="sm" className="border-primary-100 col-span-12 overflow-hidden border lg:col-span-4">
      <Card.Header className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <Card.Title className="text-base">{formatCategoryLabel(activeCategoryKey)}</Card.Title>

            <Card.Description className="mt-1">
              {hasActiveFilters ? `${totalFilteredInActiveCategory} of ${totalInActiveCategory}` : `${totalInActiveCategory}`} components
            </Card.Description>
          </div>

          {hasActiveFilters ? (
            <Button
              variant="unstyled"
              size="unstyled"
              onClick={clearFilters}
              className="text-destructive hover:bg-destructive-200 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card.Header>

      <Card.Content className="space-y-4 px-5 pt-4 pb-4">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2" />

          <Input
            aria-label="Search components"
            placeholder="Search components..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="py-2 ps-10 text-sm"
          />
        </div>

        {availableTagOptions.length ? (
          <div>
            <div className="text-muted-400 text-2xs mb-2.5 font-semibold tracking-wider uppercase">Filter by tag</div>

            <div className="flex flex-wrap gap-1.5">
              {availableTagOptions.slice(0, 15).map(({ tag, count }) => (
                <TagFilterChip key={tag} tag={tag} count={count} on={activeTagSet.has(tag)} onToggle={toggleTagFilter} />
              ))}
            </div>

            {availableTagOptions.length > 15 ? (
              <div className="text-muted-400 mt-2 text-xs">Showing {availableTagOptions.length} tags. Use search to narrow further.</div>
            ) : null}
          </div>
        ) : null}
      </Card.Content>

      <Divider variant="dashed" />

      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-1 p-3">
          {filteredDocsInActiveCategory.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center text-sm">No components found.</div>
          ) : (
            filteredDocsInActiveCategory.map((doc) => {
              const isActive = doc.id === selectedDocId;
              return (
                <DocListItem
                  key={doc.id}
                  ref={isActive ? activeItemRef : undefined}
                  doc={doc}
                  isActive={isActive}
                  onSelect={setSelectedDocId}
                />
              );
            })
          )}
        </div>

        <ScrollArea.Bar />
      </ScrollArea>
    </Card>
  );
};

export default SidebarPanel;
