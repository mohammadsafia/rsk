import { type ComponentType, lazy, type LazyExoticComponent, Suspense } from 'react';

import { MDXProvider } from '@mdx-js/react';

import { Spinner } from '@components/ui';
import { DocsProse } from '@component-docs';
import type { ComponentDocEntry, DocComponent } from '@component-docs/registry';
import { mdxComponents } from '@component-docs/gallery/utils';

// One lazy component per doc, kept for the session. A lazy() created during render is discarded while the tree is
// still suspended (React drops never-committed state), which would suspend forever.
const docCache = new Map<string, LazyExoticComponent<ComponentType<Record<string, unknown>>>>();

const docFor = (entry: ComponentDocEntry): LazyExoticComponent<DocComponent> => {
  let doc = docCache.get(entry.id);
  if (!doc) {
    doc = lazy(entry.load);
    docCache.set(entry.id, doc);
  }
  return doc;
};

/** Header + MDX body of one docs entry. */
export default function DocArticle({ entry }: { entry: ComponentDocEntry }) {
  const Doc = docFor(entry);

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-10 px-6 py-10">
      <article className="min-w-0 flex-1">
        <div data-slot="docs-header" className="mb-8 flex flex-col gap-2">
          <h1 className="text-fg text-3xl font-semibold tracking-tight rtl:tracking-normal">{entry.title}</h1>
          <p className="text-fg-muted text-base">{entry.description}</p>
        </div>

        <Suspense
          fallback={
            <div className="relative min-h-40">
              <Spinner overlay />
            </div>
          }
        >
          <MDXProvider components={mdxComponents}>
            <DocsProse variant="panel">
              <Doc />
            </DocsProse>
          </MDXProvider>
        </Suspense>
      </article>
    </div>
  );
}
