import { useState } from 'react';

import { Card, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { Check, Copy } from 'lucide-react';

import Section from '../section/Section';

const STEPS = [
  { key: 'clone', command: 'git clone https://github.com/mohammadsafia/rsk.git' },
  { key: 'install', command: 'pnpm install' },
  { key: 'start', command: 'pnpm dev' },
] as const;

function GetGoing() {
  const { t } = useAppTranslation('home');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopied(command);
  };

  return (
    <Section eyebrow={t('gettingStarted.eyebrow')} title={t('gettingStarted.title')}>
      <ol className="mt-6 grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.key}>
            <Card>
              <Card.Content className="flex flex-col gap-2">
                <span className="text-fg-muted font-mono text-xs">
                  <span dir="ltr">{String(index + 1).padStart(2, '0')}</span> · {t(`gettingStarted.${step.key}`)}
                </span>

                <div className="bg-surface-sunken border-border flex items-center gap-2 rounded-md border ps-3 pe-1">
                  <code data-slot="landing-command" dir="ltr" className="text-fg min-w-0 flex-1 truncate py-2 text-start font-mono text-xs">
                    {step.command}
                  </code>

                  <IconButton
                    size="sm"
                    aria-label={t('gettingStarted.copy', { command: step.command })}
                    onClick={() => void copy(step.command)}
                  >
                    <Conditional>
                      <Conditional.If condition={copied === step.command}>
                        <Check aria-hidden="true" className="text-success" />
                      </Conditional.If>

                      <Conditional.Else>
                        <Copy aria-hidden="true" />
                      </Conditional.Else>
                    </Conditional>
                  </IconButton>
                </div>
              </Card.Content>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default GetGoing;
