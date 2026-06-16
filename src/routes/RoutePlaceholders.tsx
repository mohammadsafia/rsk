import { Link } from 'react-router-dom';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from './routes';

export function NotFound() {
  const { t } = useAppTranslation('errors');

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-primary text-5xl font-bold">404</p>

      <h1 className="text-foreground text-xl font-semibold">{t('notFound.title')}</h1>

      <p className="text-muted-foreground max-w-sm text-sm">{t('notFound.description')}</p>

      <Link to={FULL_ROUTES_PATH.HOME.INDEX} className="text-primary mt-2 text-sm font-medium hover:underline">
        {t('notFound.backHome')}
      </Link>
    </div>
  );
}

export function SettingsPlaceholder() {
  const { t } = useAppTranslation('nav');

  return <div className="text-foreground p-6 text-lg font-semibold">{t('settings')}</div>;
}

export function LoginPlaceholder() {
  const { t } = useAppTranslation('auth');

  return <div className="p-6">{t('login.title')}</div>;
}
