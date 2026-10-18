import { Link } from 'react-router';

import { Button } from '@components/ui';
import { EmptyState, PageHeader } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from './routes';

export function NotFound() {
  const { t } = useAppTranslation('errors');

  return (
    <div className="bg-canvas flex min-h-dvh items-center justify-center p-6">
      <EmptyState kind="no-results" titleAs="h1" title={t('notFound.title')} description={t('notFound.description')}>
        <EmptyState.Actions>
          <Button variant="outline" asChild>
            <Link to={FULL_ROUTES_PATH.HOME.INDEX}>{t('notFound.backHome')}</Link>
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  );
}

export function SettingsPlaceholder() {
  const { t } = useAppTranslation('nav');

  return <PageHeader title={t('settings')} />;
}

export function LoginPlaceholder() {
  const { t } = useAppTranslation('auth');

  return <h1 className="text-fg text-xl font-semibold">{t('login.title')}</h1>;
}
