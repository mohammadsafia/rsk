import { useAppTranslation } from '@hooks/shared';

import { Check } from 'lucide-react';

import Section from '../section/Section';

const LOG = ['logFetching', 'logParsing', 'logGenerating', 'logFormatting', 'logWritten'] as const;

function Tooling() {
  const { t } = useAppTranslation('home');

  return (
    <Section id="tooling" eyebrow={t('cli.eyebrow')} title={t('cli.title')} description={t('cli.desc')}>
      <pre
        data-slot="landing-terminal"
        dir="ltr"
        className="bg-surface-sunken border-border text-fg-muted mt-6 overflow-x-auto rounded-lg border px-4 py-3 text-start font-mono text-xs leading-7"
      >
        <span className="text-fg">$ pnpm dto:gen</span>
        {LOG.map((key) => (
          <span key={key} className="flex items-center gap-2">
            <Check aria-hidden="true" className="text-success size-3.5" />
            {t(`cli.${key}`)}
          </span>
        ))}
      </pre>
    </Section>
  );
}

export default Tooling;
