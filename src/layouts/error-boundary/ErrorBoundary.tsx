import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

function ErrorBoundary() {
  const navigate = useNavigate();
  const { t } = useAppTranslation('errors');

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="text-destructive h-8 w-8" strokeWidth={1.5} />
        </div>

        <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">{t('boundary.title')}</h1>

        <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">{t('boundary.description')}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => window.location.reload()} size="lg" variant="default">
            <RefreshCw className="me-2 h-4 w-4" />
            {t('boundary.refresh')}
          </Button>

          <Button onClick={() => navigate(-1)} size="lg" variant="ghost-muted">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('boundary.goBack')}
          </Button>

          <Button asChild size="lg" variant="ghost-muted">
            <Link to={FULL_ROUTES_PATH.HOME.INDEX}>
              <Home className="me-2 h-4 w-4" />
              {t('boundary.home')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
