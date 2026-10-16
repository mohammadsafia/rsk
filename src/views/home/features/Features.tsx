import { useMemo } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { getComponentDocsRegistry } from '@component-docs/registry';

import { countDocs } from '../landing-stats';
import Section from '../section/Section';

const KEYS = ['componentLibrary', 'formSystem', 'dataTables', 'authentication', 'internationalization', 'errorMonitoring'] as const;

function Features() {
  const { t } = useAppTranslation('home');
  const forms = useMemo(() => countDocs(getComponentDocsRegistry()).forms, []);

  return (
    <Section eyebrow={t('features.eyebrow')} title={t('features.title')}>
      <ol className="border-border-subtle mt-6 border-t">
        {KEYS.map((key, index) => (
          <li
            key={key}
            data-slot="landing-feature"
            className="border-border-subtle grid gap-x-6 gap-y-1 border-b py-4 md:grid-cols-[3rem_14rem_1fr] md:items-baseline"
          >
            <span data-slot="landing-feature-number" dir="ltr" className="text-fg-subtle font-mono text-sm tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>

            <h3 className="text-fg text-sm font-semibold">{t(`features.${key}.title`)}</h3>

            <p className="text-fg-muted text-sm">{t(`features.${key}.desc`, { count: forms })}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default Features;
