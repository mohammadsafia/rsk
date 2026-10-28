'use client';

import { Button } from '@components/ui';
import { LanguageSwitcher, Logo, ThemeSwitcher } from '@components/shared';

import { KitLink } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

const FEATURES = ['rendered', 'languages', 'kit'] as const;

/** The public front page, server-rendered for search engines. Replace its copy (landing.json) with your product's. */
function LandingPage() {
  const { t } = useAppTranslation('landing');

  return (
    <div className="bg-canvas text-fg flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-4">
        <Logo variant="lockup" />
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
        <section aria-labelledby="landing-title" className="flex max-w-2xl flex-col items-start gap-6">
          <h1 id="landing-title" className="text-4xl font-semibold tracking-tight text-balance">
            {t('hero.title')}
          </h1>
          <p className="text-fg-muted text-lg text-pretty">{t('hero.description')}</p>
          <Button asChild size="lg">
            <KitLink href={FULL_ROUTES_PATH.AUTH.LOGIN}>{t('hero.signIn')}</KitLink>
          </Button>
        </section>

        <section aria-labelledby="landing-features" className="flex flex-col gap-6">
          <h2 id="landing-features" className="text-xl font-semibold">
            {t('features.title')}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              // Plain tiles, not the kit Card: every app page's links prefetch this page, so it stays light.
              <li key={feature} className="border-border bg-surface flex flex-col gap-1 rounded-lg border p-5">
                <h3 className="text-fg font-semibold">{t(`features.${feature}.title`)}</h3>
                <p className="text-fg-muted text-sm">{t(`features.${feature}.description`)}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
