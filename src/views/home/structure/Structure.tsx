import { useAppTranslation } from '@hooks/shared';

import Section from '../section/Section';

const ALIASES = [
  ['@components/ui', 'ui'],
  ['@components/forms', 'forms'],
  ['@components/shared', 'shared'],
  ['@hooks/shared', 'hooks'],
  ['@layouts', 'layouts'],
  ['@routes', 'routes'],
] as const;

function Structure() {
  const { t } = useAppTranslation('home');

  return (
    <Section eyebrow={t('architecture.eyebrow')} title={t('architecture.title')} description={t('architecture.desc')}>
      <ul className="bg-border-subtle border-border-subtle mt-6 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 md:grid-cols-3">
        {ALIASES.map(([alias, key]) => (
          <li key={alias} className="bg-surface px-4 py-3">
            <code data-slot="landing-alias" dir="ltr" className="text-accent block text-start font-mono text-sm">
              {alias}
            </code>

            <span className="text-fg-muted text-xs">{t(`structure.aliases.${key}`)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default Structure;
