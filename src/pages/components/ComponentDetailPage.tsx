import { useMemo, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';

import { MDXProvider } from '@mdx-js/react';
import { ChevronRight } from 'lucide-react';

import { Chip } from '@components/ui';
import { DocsLayout } from '@component-docs';
import { getComponentDocsRegistry, componentDocsErrors } from '@component-docs/registry';
import { useSelectedDocComponent } from '@component-docs/gallery';
import { mdxComponents } from '@component-docs/gallery/utils';
import { FULL_ROUTES_PATH } from '@routes';

import { useAppTranslation } from '@hooks/shared';

const ComponentDetailPage = () => {
  const { t } = useAppTranslation('components');

  const { id } = useParams<{ id: string }>();
  const allDocs = useMemo(() => getComponentDocsRegistry(), []);

  const selectedDoc = useMemo(
    () => allDocs.find((doc) => doc.id === id) ?? null,
    [allDocs, id],
  );

  const SelectedDocComponent = useSelectedDocComponent(selectedDoc);
  const tags = selectedDoc?.tags ?? [];

  // Not found
  if (!selectedDoc) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto w-full max-w-480 px-6 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-foreground text-lg font-medium">{t('detail.notFoundTitle')}</p>
            <p className="text-muted-400 mt-1 text-sm">
              {t('detail.notFoundDescription', { id })}
            </p>
            <Link
              to={FULL_ROUTES_PATH.COMPONENTS.INDEX}
              className="text-foreground mt-4 text-sm font-medium underline underline-offset-4"
            >
              {t('detail.backToGallery')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-480 px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm">
          <Link
            to={FULL_ROUTES_PATH.COMPONENTS.INDEX}
            className="text-muted-400 hover:text-foreground transition-colors"
          >
            {t('detail.breadcrumbComponents')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-300" />
          <span className="text-foreground font-medium">{selectedDoc.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">{selectedDoc.title}</h1>

          {selectedDoc.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-400">{selectedDoc.description}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Chip key={tag} variant="muted" size="xs">
                  {tag}
                </Chip>
              ))}
            </div>
          ) : null}
        </header>

        {/* MDX Validation Errors */}
        {componentDocsErrors.length > 0 ? (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive-200 p-4 text-sm">
            <div className="mb-2 font-semibold">{t('detail.mdxValidationIssues')}</div>
            <ul className="list-disc space-y-1 ps-5">
              {componentDocsErrors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* MDX Content — renders live preview, code examples, and props as natural MDX flow */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-400 text-sm">{t('detail.loadingDocumentation')}</p>
            </div>
          }
        >
          <DocsLayout variant="panel">
            <MDXProvider components={mdxComponents}>
              {SelectedDocComponent ? <SelectedDocComponent /> : null}
            </MDXProvider>
          </DocsLayout>
        </Suspense>
      </div>
    </div>
  );
};

export default ComponentDetailPage;
