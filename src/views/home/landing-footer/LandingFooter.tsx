import { Link } from 'react-router-dom';

import { Logo } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

function LandingFooter() {
  const { t } = useAppTranslation('home');

  return (
    <footer className="border-border-subtle border-t">
      <div className="text-fg-muted mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-6 text-sm md:px-6">
        <Logo variant="lockup" size="sm" />

        <span>{t('footer.license')}</span>

        <span className="ms-auto flex gap-4">
          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX} className="hover:text-fg">
            {t('nav.components')}
          </Link>

          <a href="https://github.com/mohammadsafia/rsk" className="hover:text-fg">
            {t('footer.github')}
          </a>
        </span>
      </div>
    </footer>
  );
}

export default LandingFooter;
