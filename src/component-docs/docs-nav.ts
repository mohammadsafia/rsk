import { type ComponentDocEntry, normalizeCategoryKey } from '@component-docs/registry';

const ORDER = ['GUIDES', 'FOUNDATIONS', 'UI', 'FORMS', 'SHARED', 'TABLES', 'CALENDAR', 'CHARTS', 'HOOKS'] as const;
const LABEL_KEY: Record<(typeof ORDER)[number], string> = {
  GUIDES: 'guides',
  FOUNDATIONS: 'foundations',
  UI: 'ui',
  FORMS: 'forms',
  SHARED: 'shared',
  TABLES: 'tables',
  CALENDAR: 'calendar',
  CHARTS: 'charts',
  HOOKS: 'hooks',
};

export const docHref = (entry: Pick<ComponentDocEntry, 'id' | 'category'>) => {
  const category = normalizeCategoryKey(entry.category);
  if (entry.id === 'introduction') return '/docs';
  if (category === 'GUIDES' || category === 'FOUNDATIONS') return `/docs/${entry.id}`;
  return `/docs/components/${entry.id}`;
};

export const docsNavGroups = (entries: ReadonlyArray<ComponentDocEntry>) =>
  ORDER.map((key) => ({
    key,
    labelKey: `nav.groups.${LABEL_KEY[key]}`,
    items: entries
      .filter((entry) => normalizeCategoryKey(entry.category) === key)
      .sort((a, b) => (key === 'GUIDES' ? (a.order ?? 99) - (b.order ?? 99) : a.title.localeCompare(b.title)))
      .map((entry) => ({ id: entry.id, title: entry.title, href: docHref(entry) })),
  })).filter((group) => group.items.length > 0);

/** Flat reading order for prev/next. */
export const docsReadingOrder = (entries: ReadonlyArray<ComponentDocEntry>) => docsNavGroups(entries).flatMap((group) => group.items);
