import { Link } from 'react-router-dom';

import { Button } from '@components/ui';
import { LanguageSwitcher, Logo, ThemeSwitcher } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

const LINK =
  'text-fg-muted hover:text-fg rounded-sm text-sm transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

function LandingNav() {
  const { t } = useAppTranslation('home');

  return (
    <header data-slot="landing-nav" className="bg-canvas/95 border-border-subtle sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link
          to={FULL_ROUTES_PATH.HOME.INDEX}
          aria-label={t('nav.brand')}
          className="focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo variant="lockup" size="sm" />
        </Link>

        <nav aria-label={t('nav.primary')} className="hidden items-center gap-5 md:flex">
          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX} className={LINK}>
            {t('nav.components')}
          </Link>

          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX} className={LINK}>
            {t('nav.docs')}
          </Link>

          <a href="#tooling" className={LINK}>
            {t('nav.cli')}
          </a>
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher />

          <ThemeSwitcher />

          <Button size="sm" asChild className="ms-2">
            <Link to={FULL_ROUTES_PATH.HOME.DASHBOARD}>{t('nav.getStarted')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default LandingNav;
