import { type ComponentType, lazy, type LazyExoticComponent, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router';

import { MDXProvider } from '@mdx-js/react';

import { Spinner } from '@components/ui';
import { DocsProse } from '@component-docs';
import type { ComponentDocEntry, DocComponent } from '@component-docs/registry';
import { mdxComponents } from '@component-docs/mdx-components';

import DocHeader from './DocHeader';
import OnThisPage from './OnThisPage';
import PrevNext from './PrevNext';

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

/** Scrolls to `#slug` once the MDX body (and so the heading) is in the DOM. */
function ScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  return null;
}

/** Header, MDX body, prev/next and the "On this page" outline of one docs entry. */
export default function DocArticle({ entry }: { entry: ComponentDocEntry }) {
  // Not created during render: docFor returns the module-level cached lazy component for this entry (stable identity).
  const Doc = docFor(entry);

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-10 px-6 py-10">
      {/* Docs prose is English in v1 (spec): keep it left to right inside the Arabic chrome. Examples still
          preview in the app direction. */}
      <article lang="en" dir="ltr" className="min-w-0 flex-1">
        <DocHeader entry={entry} />

        <Suspense
          fallback={
            <div className="relative min-h-40">
              <Spinner overlay />
            </div>
          }
        >
          <MDXProvider components={mdxComponents}>
            <DocsProse>
              {/* oxlint-disable-next-line react/static-components -- Doc comes from docFor's per-entry cache (see above). */}
              <Doc />
            </DocsProse>
          </MDXProvider>

          <ScrollToHash />
        </Suspense>

        <PrevNext id={entry.id} />
      </article>

      <OnThisPage headings={entry.headings} />
    </div>
  );
}
