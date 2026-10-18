import { Link, useNavigate } from 'react-router';

import { Button } from '@components/ui';
import { EmptyState } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { ArrowLeft, Home, RefreshCw } from 'lucide-react';

function ErrorBoundary() {
  const navigate = useNavigate();
  const { t } = useAppTranslation('errors');

  return (
    <div className="bg-canvas flex min-h-dvh items-center justify-center p-6 md:p-12">
      <EmptyState kind="error" titleAs="h1" title={t('boundary.title')} description={t('boundary.description')} className="max-w-lg">
        <EmptyState.Actions>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden="true" />
            {t('boundary.refresh')}
          </Button>

          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
            {t('boundary.goBack')}
          </Button>

          <Button variant="ghost" asChild>
            <Link to={FULL_ROUTES_PATH.HOME.INDEX}>
              <Home aria-hidden="true" />
              {t('boundary.home')}
            </Link>
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  );
}

export default ErrorBoundary;
