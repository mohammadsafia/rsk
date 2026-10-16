import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getComponentDocsRegistry, normalizeCategoryKey } from '@component-docs/registry';

import DocArticle from './components/DocArticle';
import DocsNotFound from './DocsNotFound';

const PAGE_CATEGORIES = new Set(['GUIDES', 'FOUNDATIONS']);

/** Guides and Foundations: `/docs` (introduction) and `/docs/:docId`. */
export default function DocsDocPage() {
  const { docId = 'introduction' } = useParams<{ docId: string }>();
  const entry = useMemo(
    () => getComponentDocsRegistry().find((doc) => doc.id === docId && PAGE_CATEGORIES.has(normalizeCategoryKey(doc.category))),
    [docId],
  );

  if (!entry) return <DocsNotFound />;

  return <DocArticle key={entry.id} entry={entry} />;
}
