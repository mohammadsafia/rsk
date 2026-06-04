import { Suspense } from 'react';

import { MDXProvider } from '@mdx-js/react';

import { Card, Chip, Divider, ScrollArea } from '@components/ui';
import { DocsLayout } from '@component-docs';

import { componentDocsErrors } from '@component-docs/registry';

import { mdxComponents } from '@component-docs/gallery/utils';

import type { DocPanelProps } from '@component-docs/gallery/types';

const DocPanel = (props: DocPanelProps) => {
  const { hasSelected, selectedDoc, selectedDocTags, SelectedDocComponent, sidebarOpen = true } = props;

  return (
    <Card shadow="sm" className={`col-span-12 overflow-hidden border border-primary-100 ${sidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
      <ScrollArea className="h-[calc(100vh-240px)]">
        {componentDocsErrors.length ? (
          <div className="border-destructive/30 bg-destructive-200 m-4 rounded-xl border p-4 text-sm">
            <div className="mb-2 font-semibold">MDX docs validation issues</div>

            <ul className="list-disc space-y-1 pl-5">
              {componentDocsErrors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasSelected && selectedDoc ? (
          <>
            <Card.Header className="px-8 pt-6 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Card.Title className="text-2xl">{selectedDoc.title}</Card.Title>

                  {selectedDoc.description ? <Card.Description className="mt-1.5 text-sm">{selectedDoc.description}</Card.Description> : null}
                </div>

                {selectedDocTags.length ? (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {selectedDocTags.slice(0, 4).map((tagLabel) => (
                      <Chip key={tagLabel} variant="default" size="xs">
                        {tagLabel}
                      </Chip>
                    ))}

                    {selectedDocTags.length > 4 ? (
                      <span className="text-muted-400 self-center text-xs">+{selectedDocTags.length - 4}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card.Header>

            <Divider />

            <Suspense fallback={<div className="text-muted-400 px-8 py-10 text-center text-sm">Loading documentation...</div>}>
              <DocsLayout variant="panel">
                <MDXProvider components={mdxComponents}>{SelectedDocComponent ? <SelectedDocComponent /> : null}</MDXProvider>
              </DocsLayout>
            </Suspense>
          </>
        ) : (
          <div className="text-muted-400 flex h-full items-center justify-center p-8 text-sm">Select a component to view its documentation.</div>
        )}

        <ScrollArea.Bar />
      </ScrollArea>
    </Card>
  );
};

export default DocPanel;