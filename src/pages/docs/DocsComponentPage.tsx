import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getComponentDocsRegistry, normalizeCategoryKey } from '@component-docs/registry';

import DocArticle from './components/DocArticle';
import DocsNotFound from './DocsNotFound';

const PAGE_CATEGORIES = new Set(['GUIDES', 'FOUNDATIONS']);

export default function DocsComponentPage() {
  const { id } = useParams<{ id: string }>();
  const entry = useMemo(
    () => getComponentDocsRegistry().find((doc) => doc.id === id && !PAGE_CATEGORIES.has(normalizeCategoryKey(doc.category))),
    [id],
  );

  if (!entry) return <DocsNotFound />;

  return <DocArticle key={entry.id} entry={entry} />;
}
