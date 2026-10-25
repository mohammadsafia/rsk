'use client';

import { Button } from '@components/ui';
import { EmptyState, PageHeader } from '@components/shared';

import { KitLink } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from './routes';

export function NotFound() {
  const { t } = useAppTranslation('errors');

  return (
    <div className="bg-canvas flex min-h-dvh items-center justify-center p-6">
      <EmptyState kind="no-results" titleAs="h1" title={t('notFound.title')} description={t('notFound.description')}>
        <EmptyState.Actions>
          <Button variant="outline" asChild>
            <KitLink href={FULL_ROUTES_PATH.HOME.INDEX}>{t('notFound.backHome')}</KitLink>
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
