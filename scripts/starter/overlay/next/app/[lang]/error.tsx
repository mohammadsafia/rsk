'use client';

import { Button } from '@components/ui';
import { EmptyState } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

// Starter default: a later kit version's kit:add may replace it with a block's page.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useAppTranslation('errors');

  return (
    <main className="bg-canvas flex min-h-dvh items-center justify-center p-6">
      <EmptyState kind="no-results" titleAs="h1" title={t('boundary.title')} description={t('boundary.description')}>
        <EmptyState.Actions>
          <Button onClick={reset}>{t('boundary.refresh')}</Button>
        </EmptyState.Actions>
      </EmptyState>
    </main>
  );
}
