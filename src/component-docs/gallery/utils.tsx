import { type ComponentPropsWithoutRef } from 'react';

import Table from '@components/ui/table/Table';
import { CodeBlock } from '@component-docs';
import { Callout, DoDont, Example, PropsTable } from '@component-docs/blocks';

import { cn } from '@utils';

import { normalizeCategoryKey } from '@component-docs/registry';

import type { MDXComponents } from 'mdx/types';
import type { ComponentDocEntry } from '@component-docs/registry';
import type { CategoryTab, PreProps } from '@component-docs/gallery/types';

export function formatCategoryLabel(key: string | undefined | null): string {
  return normalizeCategoryKey(key);
}

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

  const calendarTabIndex = categoryTabs.findIndex((categoryTab) => categoryTab.key === 'CALENDAR');
  if (calendarTabIndex >= 0 && calendarTabIndex < categoryTabs.length - 1) {
    const [calendar] = categoryTabs.splice(calendarTabIndex, 1);
    categoryTabs.push(calendar);
  }

  const foundationsTabIndex = categoryTabs.findIndex((categoryTab) => categoryTab.key === 'FOUNDATIONS');
  if (foundationsTabIndex > 0) {
    const [foundations] = categoryTabs.splice(foundationsTabIndex, 1);
    categoryTabs.unshift(foundations);
  }

  return categoryTabs;
}

export function matchesSearchText(doc: Readonly<ComponentDocEntry>, queryLowercase: string) {
  const tagText = (doc.tags ?? []).join(' ');
  const searchableText = `${doc.title} ${doc.description ?? ''} ${doc.category ?? ''} ${tagText}`.toLowerCase();
  return searchableText.includes(queryLowercase);
}

export function filterDocsBySearchText(docsList: ReadonlyArray<Readonly<ComponentDocEntry>>, queryText: string) {
  const normalizedQuery = queryText.trim().toLowerCase();
  const matchingDocs = normalizedQuery ? docsList.filter((docEntry) => matchesSearchText(docEntry, normalizedQuery)) : docsList;
  return [...matchingDocs].sort(sortDocsByTitle);
}

export function sortDocsByTitle(a: Readonly<ComponentDocEntry>, b: Readonly<ComponentDocEntry>) {
  return a.title.localeCompare(b.title);
}

export function countTagsByLabel(docs: ReadonlyArray<Readonly<ComponentDocEntry>>) {
  const tagCounts = new Map<string, number>();

  for (const docEntry of docs) {
    for (const tag of docEntry.tags ?? []) {
      const tagKey = String(tag).trim();
      if (!tagKey) continue;
      tagCounts.set(tagKey, (tagCounts.get(tagKey) ?? 0) + 1);
    }
  }

  return tagCounts;
}

export const mdxComponents: MDXComponents = {
  Example,
  PropsTable,
  Callout,
  DoDont,
  pre: (props: PreProps) => <CodeBlock {...props} />,
  // Inline code (block code is wrapped by CodeBlock's LTR <pre>): keep identifiers left-to-right inside Arabic prose.
  code: ({ className, ...props }: ComponentPropsWithoutRef<'code'>) => <code dir="ltr" className={cn('font-mono', className)} {...props} />,
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="not-prose border-border my-6 overflow-x-auto rounded-lg border">
      <Table {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<'thead'>) => <Table.Header {...props} />,
  tbody: (props: ComponentPropsWithoutRef<'tbody'>) => <Table.Body {...props} />,
  tr: (props: ComponentPropsWithoutRef<'tr'>) => <Table.Row {...props} />,
  th: (props: ComponentPropsWithoutRef<'th'>) => <Table.Head {...props} />,
  td: (props: ComponentPropsWithoutRef<'td'>) => <Table.Cell {...props} />,
};
