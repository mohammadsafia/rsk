import { Link } from 'react-router-dom';

import { Button } from '@components/ui';
import { EmptyState } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

export default function DocsNotFound() {
  const { t } = useAppTranslation('docs');

  return (
    <div className="flex min-h-96 items-center justify-center p-6">
      <EmptyState kind="no-results" titleAs="h1" title={t('notFound.title')} description={t('notFound.description')}>
        <EmptyState.Actions>
          <Button variant="outline" asChild>
            <Link to="/docs/components">{t('notFound.action')}</Link>
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  );
}
