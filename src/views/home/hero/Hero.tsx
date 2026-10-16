import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';
import { getComponentDocsRegistry } from '@component-docs/registry';

import { countDocs } from '../landing-stats';

function Hero() {
  const { t } = useAppTranslation('home');
  const counts = useMemo(() => countDocs(getComponentDocsRegistry()), []);

  const stats = [
    { value: counts.ui, label: t('stats.uiComponents') },
    { value: counts.forms, label: t('stats.formComponents') },
    { value: counts.shared, label: t('stats.sharedComponents') },
    { value: counts.total, label: t('stats.mdxDocs') },
  ];

  return (
    <section
      data-slot="landing-hero"
      aria-labelledby="landing-hero-title"
      className="mx-auto max-w-6xl px-4 pt-16 text-center md:px-6 md:pt-24"
    >
      <p className="text-fg-muted font-mono text-xs font-medium tracking-wider uppercase">{t('hero.eyebrow')}</p>

      <h1
        id="landing-hero-title"
        className="text-fg mx-auto mt-4 max-w-[18ch] text-3xl font-semibold tracking-tight md:text-4xl rtl:leading-snug"
      >
        {t('hero.titleLead')}
        <span className="text-accent">{t('hero.titleEmphasis')}</span>
        {t('hero.titleTrail')}
      </h1>

      <p className="text-fg-muted mx-auto mt-4 max-w-prose text-base">
        {t('hero.subtitle', { count: counts.ui + counts.forms + counts.shared })}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link to={FULL_ROUTES_PATH.HOME.DASHBOARD}>{t('hero.ctaPrimary')}</Link>
        </Button>

        <Button size="lg" variant="outline" asChild>
          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX}>{t('hero.ctaSecondary')}</Link>
        </Button>
      </div>

      <dl className="border-border-subtle mt-12 grid grid-cols-2 border-y text-start md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            data-slot="landing-stat"
            className="border-border-subtle flex flex-col-reverse gap-1 border-e px-5 py-4 last:border-e-0 max-md:nth-2:border-e-0"
          >
            <dt className="text-fg-muted text-sm">{stat.label}</dt>

            <dd
              data-slot="landing-stat-value"
              dir="ltr"
              className="text-fg text-start font-mono text-2xl font-medium tabular-nums rtl:text-end"
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default Hero;
