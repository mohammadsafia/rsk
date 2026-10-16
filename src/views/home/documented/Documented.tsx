import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';
import { getComponentDocsRegistry } from '@component-docs/registry';

import Section from '../section/Section';

const PAGES = ['Button', 'Dialog', 'Tabs', 'Calendar', 'Table'];

function Documented() {
  const { t } = useAppTranslation('home');
  const total = useMemo(() => getComponentDocsRegistry().length, []);

  return (
    <Section eyebrow={t('showcase.eyebrow')} title={t('showcase.title')} description={t('showcase.desc', { count: total })}>
      <div className="mt-6 grid items-start gap-8 md:grid-cols-[1fr_1.35fr]">
        <Button variant="outline" asChild className="justify-self-start">
          <Link to={FULL_ROUTES_PATH.DOCS.COMPONENTS}>{t('showcase.cta')}</Link>
        </Button>

        <div aria-hidden="true" className="bg-surface border-border overflow-hidden rounded-lg border">
          <div dir="ltr" className="border-border-subtle text-fg-subtle border-b px-3 py-2 text-start font-mono text-xs">
            {t('showcase.browserUrl')}/button
          </div>

          <div className="grid grid-cols-[7rem_1fr]">
            <ul className="border-border-subtle text-fg-muted flex flex-col gap-1.5 border-e px-3 py-3 text-xs">
              {PAGES.map((page, index) => (
                <li key={page} className={index === 0 ? 'text-fg' : undefined}>
                  {page}
                </li>
              ))}
            </ul>

            <div className="p-3">
              <p className="text-fg text-sm font-semibold">Button</p>

              <p className="text-fg-muted mb-3 text-xs">variant × tone × size</p>

              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" tabIndex={-1}>
                  Solid
                </Button>
                <Button size="sm" variant="outline" tabIndex={-1}>
                  Outline
                </Button>
                <Button size="sm" variant="ghost" tabIndex={-1}>
                  Ghost
                </Button>
                <Button size="sm" tone="accent" tabIndex={-1}>
                  Accent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default Documented;
