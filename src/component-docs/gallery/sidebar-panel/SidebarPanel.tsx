import { forwardRef, useCallback, useRef } from 'react';

import { Button, Card, Tag, Divider, Input, ScrollArea } from '@components/ui';
import { EmptyState } from '@components/shared';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

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
  <button type="button" onClick={() => onToggle(tag)} aria-pressed={on}>
    <Tag tone={on ? 'accent' : 'neutral'} size="sm" className="cursor-pointer gap-1.5">
      <span>{tag}</span>

      <span className="text-2xs opacity-60">{count}</span>
    </Tag>
  </button>
);

const DocListItem = forwardRef<
  HTMLButtonElement,
  Readonly<{ doc: Readonly<ComponentDocEntry>; isActive: boolean; onSelect: (id: string) => void }>
>(({ doc, isActive, onSelect }, ref) => {
  const tags = doc.tags ?? [];

  return (
    <button
      type="button"
      ref={ref}
      onClick={() => onSelect(doc.id)}
      data-active={isActive}
      aria-current={isActive ? 'true' : undefined}
      className="text-fg-muted hover:bg-hover hover:text-fg data-[active=true]:bg-hover data-[active=true]:text-fg focus-visible:ring-ring flex w-full flex-col items-start gap-1 rounded-md px-3 py-2.5 text-start transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="text-fg text-sm font-medium">{doc.title}</span>

      <Conditional.If condition={!!doc.description}>
        <span className="text-xs leading-relaxed">{doc.description}</span>
      </Conditional.If>

      <Conditional.If condition={tags.length > 0}>
        <div className="mt-1 flex items-center gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <Tag size="sm" key={tag}>
              {tag}
            </Tag>
          ))}

          <Conditional.If condition={tags.length > 3}>
            <span dir="ltr" className="text-fg-subtle text-2xs tabular-nums">
              +{tags.length - 3}
            </span>
          </Conditional.If>
        </div>
      </Conditional.If>
    </button>
  );
});

const SidebarPanel = (props: SidebarPanelProps) => {
  const { t, direction } = useAppTranslation('components');
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
    <Card className="col-span-12 overflow-hidden lg:col-span-4">
      <Card.Header className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <Card.Title className="text-base">{formatCategoryLabel(activeCategoryKey)}</Card.Title>

            <Card.Description className="mt-1">
              <Conditional>
                <Conditional.If condition={hasActiveFilters}>
                  {t('gallery.countFiltered', { shown: totalFilteredInActiveCategory, count: totalInActiveCategory })}
                </Conditional.If>

                <Conditional.Else>{t('gallery.count', { count: totalInActiveCategory })}</Conditional.Else>
              </Conditional>
            </Card.Description>
          </div>

          <Conditional.If condition={hasActiveFilters}>
            <Button variant="ghost" tone="danger" size="sm" onClick={clearFilters}>
              {t('common:clearFilters')}
            </Button>
          </Conditional.If>
        </div>
      </Card.Header>

      <Card.Content className="space-y-4 px-5 pt-4 pb-4">
        <div className="relative">
          <Search aria-hidden="true" className="text-fg-subtle pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />

          <Input
            type="search"
            dir={direction}
            aria-label={t('gallery.search')}
            placeholder={t('gallery.search')}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="ps-9"
          />
        </div>

        <Conditional.If condition={availableTagOptions.length > 0}>
          <div>
            <div className="text-fg-muted text-2xs mb-2.5 font-semibold tracking-wider uppercase rtl:tracking-normal">
              {t('gallery.filterByTag')}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableTagOptions.slice(0, 15).map(({ tag, count }) => (
                <TagFilterChip key={tag} tag={tag} count={count} on={activeTagSet.has(tag)} onToggle={toggleTagFilter} />
              ))}
            </div>

            <Conditional.If condition={availableTagOptions.length > 15}>
              <div className="text-fg-muted mt-2 text-xs">{t('gallery.tagsShown', { count: availableTagOptions.length })}</div>
            </Conditional.If>
          </div>
        </Conditional.If>
      </Card.Content>

      <Divider variant="dashed" />

      <ScrollArea className="h-[calc(100dvh-24rem)]">
        <div className="space-y-1 p-3">
          <Conditional>
            <Conditional.If condition={filteredDocsInActiveCategory.length === 0}>
              <EmptyState size="sm" kind="no-results" title={t('gallery.noResults')} />
            </Conditional.If>

            <Conditional.Else>
              {filteredDocsInActiveCategory.map((doc) => {
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
              })}
            </Conditional.Else>
          </Conditional>
        </div>

        <ScrollArea.Bar />
      </ScrollArea>
    </Card>
  );
};

export default SidebarPanel;
