import { Suspense } from 'react';

import { MDXProvider } from '@mdx-js/react';

import { Alert, Card, Divider, ScrollArea, Spinner, Tag } from '@components/ui';
import { EmptyState } from '@components/shared';
import { Conditional } from '@components/utils';
import { DocsProse } from '@component-docs';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';
import { componentDocsErrors } from '@component-docs/registry';
import { mdxComponents } from '@component-docs/gallery/utils';

import type { DocPanelProps } from '@component-docs/gallery/types';

const NoDoc = () => null;

const DocPanel = (props: DocPanelProps) => {
  const { hasSelected, selectedDoc, selectedDocTags, SelectedDocComponent, sidebarOpen = true } = props;
  const { t } = useAppTranslation('components');
  const Doc = SelectedDocComponent ?? NoDoc;

  return (
    <Card className={cn('col-span-12 overflow-hidden', sidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12')}>
      <ScrollArea className="h-[calc(100dvh-15rem)]">
        <Conditional.If condition={componentDocsErrors.length > 0}>
          <Alert tone="danger" className="m-4">
            <Alert.Title>{t('detail.mdxValidationIssues')}</Alert.Title>

            <Alert.Description>
              <ul className="list-disc space-y-1 ps-5">
                {componentDocsErrors.map((error, index) => (
                  <li key={`${index}-${error}`}>{error}</li>
                ))}
              </ul>
            </Alert.Description>
          </Alert>
        </Conditional.If>

        <Conditional>
          <Conditional.If condition={hasSelected && !!selectedDoc}>
            <Card.Header className="px-8 pt-6 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Card.Title className="text-2xl">{selectedDoc?.title}</Card.Title>

                  <Conditional.If condition={!!selectedDoc?.description}>
                    <Card.Description className="mt-1.5 text-sm">{selectedDoc?.description}</Card.Description>
                  </Conditional.If>
                </div>

                <Conditional.If condition={selectedDocTags.length > 0}>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {selectedDocTags.slice(0, 4).map((tagLabel) => (
                      <Tag size="sm" key={tagLabel}>
                        {tagLabel}
                      </Tag>
                    ))}

                    <Conditional.If condition={selectedDocTags.length > 4}>
                      <span dir="ltr" className="text-fg-muted self-center text-xs tabular-nums">
                        +{selectedDocTags.length - 4}
                      </span>
                    </Conditional.If>
                  </div>
                </Conditional.If>
              </div>
            </Card.Header>

            <Divider />

            <Suspense
              fallback={
                <div className="relative min-h-40">
                  <Spinner overlay label={t('detail.loadingDocumentation')} />
                </div>
              }
            >
              <DocsProse variant="panel">
                <MDXProvider components={mdxComponents}>
                  <Doc />
                </MDXProvider>
              </DocsProse>
            </Suspense>
          </Conditional.If>

          <Conditional.Else>
            <EmptyState size="sm" kind="first-use" title={t('gallery.selectPrompt')} description="" />
          </Conditional.Else>
        </Conditional>

        <ScrollArea.Bar />
      </ScrollArea>
    </Card>
  );
};

export default DocPanel;
