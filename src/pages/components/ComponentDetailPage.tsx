import { Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { MDXProvider } from '@mdx-js/react';

import { Alert, Button, Spinner, Tag } from '@components/ui';
import { EmptyState, PageHeader } from '@components/shared';
import { Conditional } from '@components/utils';
import { DocsProse } from '@component-docs';
import { componentDocsErrors, getComponentDocsRegistry } from '@component-docs/registry';
import { useSelectedDocComponent } from '@component-docs/gallery';
import { mdxComponents } from '@component-docs/gallery/utils';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

const NoDoc = () => null;

const ComponentDetailPage = () => {
  const { t } = useAppTranslation('components');

  const { id } = useParams<{ id: string }>();
  const allDocs = useMemo(() => getComponentDocsRegistry(), []);

  const selectedDoc = useMemo(() => allDocs.find((doc) => doc.id === id) ?? null, [allDocs, id]);

  const SelectedDocComponent = useSelectedDocComponent(selectedDoc);
  const Doc = SelectedDocComponent ?? NoDoc;
  const tags = selectedDoc?.tags ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Conditional>
        <Conditional.If condition={!selectedDoc}>
          <EmptyState kind="no-results" title={t('detail.notFoundTitle')} description={t('detail.notFoundDescription', { id })}>
            <EmptyState.Actions>
              <Button variant="outline" asChild>
                <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX}>{t('detail.backToGallery')}</Link>
              </Button>
            </EmptyState.Actions>
          </EmptyState>
        </Conditional.If>

        <Conditional.Else>
          <PageHeader
            title={selectedDoc?.title}
            description={selectedDoc?.description}
            breadcrumb={[{ title: t('detail.breadcrumbComponents'), href: 'components' }, { title: selectedDoc?.title ?? '' }]}
          >
            <Conditional.If condition={tags.length > 0}>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Tag size="sm" key={tag}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </Conditional.If>
          </PageHeader>

          <Conditional.If condition={componentDocsErrors.length > 0}>
            <Alert tone="danger" className="mb-6">
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
        </Conditional.Else>
      </Conditional>
    </div>
  );
};

export default ComponentDetailPage;
