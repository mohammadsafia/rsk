import { type ComponentDocEntry, normalizeCategoryKey } from '@component-docs/registry';
import { docHref } from '@component-docs/docs-nav';

export const foldSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟ]/g, '')
    .toLowerCase();

export type SearchItem = {
  id: string;
  group: 'guides' | 'components' | 'sections';
  title: string;
  subtitle?: string;
  href: string;
  keywords: string;
};

export const buildSearchIndex = (entries: ReadonlyArray<ComponentDocEntry>): SearchItem[] =>
  entries.flatMap((entry) => {
    const isGuide = ['GUIDES', 'FOUNDATIONS'].includes(normalizeCategoryKey(entry.category));
    const href = docHref(entry);
    const page: SearchItem = {
      id: entry.id,
      group: isGuide ? 'guides' : 'components',
      title: entry.title,
      subtitle: entry.description,
      href,
      keywords: foldSearchText([entry.title, entry.description, entry.category, ...(entry.tags ?? [])].join(' ')),
    };
    const sections = (entry.headings ?? []).map<SearchItem>((heading) => ({
      id: `${entry.id}#${heading.slug}`,
      group: 'sections',
      title: heading.text,
      subtitle: entry.title,
      href: `${href}#${heading.slug}`,
      keywords: foldSearchText(`${heading.text} ${entry.title}`),
    }));
    return [page, ...sections];
  });
