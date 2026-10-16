import { type ReactNode, useState } from 'react';

import { Check, Copy } from 'lucide-react';

import { Button, IconButton, Tabs } from '@components/ui';
import { Conditional } from '@components/utils';
import { CodeBlock } from '@component-docs/code-block';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

export type ExampleProps = { title: string; description?: ReactNode; code?: string; className?: string; children: ReactNode };

/** A framed live example with Preview · Code. `code` is injected at build time by scripts/docs/remark-docs.ts. */
export function Example({ title, description, code = '', className, children }: ExampleProps) {
  const { t, isRTL } = useAppTranslation('docs');
  // null = follow the app direction until the reader flips it.
  const [rtlOverride, setRtlOverride] = useState<boolean | null>(null);
  const rtl = rtlOverride ?? isRTL;
  const [dark, setDark] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard unavailable (insecure origin): nothing to do.
    }
  };

  return (
    <figure data-slot="docs-example" className={cn('not-prose border-border my-6 overflow-hidden rounded-lg border', className)}>
      <Tabs defaultValue="preview">
        <div className="bg-surface border-border-subtle flex items-center gap-2 border-b px-3">
          <figcaption className="text-fg me-auto py-2 text-sm font-medium">{title}</figcaption>

          <Tabs.List variant="underline" aria-label={title}>
            <Tabs.Trigger value="preview">{t('example.preview')}</Tabs.Trigger>
            <Tabs.Trigger value="code">{t('example.code')}</Tabs.Trigger>
          </Tabs.List>

          <Button size="sm" variant="ghost" aria-pressed={rtl} onClick={() => setRtlOverride(!rtl)}>
            {t('example.rtl')}
          </Button>

          <Button size="sm" variant="ghost" aria-pressed={dark === true} onClick={() => setDark((value) => !value)}>
            {t('example.dark')}
          </Button>

          <IconButton size="sm" aria-label={t(copied ? 'example.copied' : 'example.copy')} onClick={() => void copy()}>
            <Conditional>
              <Conditional.If condition={copied}>
                <Check aria-hidden="true" className="text-success" />
              </Conditional.If>

              <Conditional.Else>
                <Copy aria-hidden="true" />
              </Conditional.Else>
            </Conditional>
          </IconButton>
        </div>

        <Conditional.If condition={!!description}>
          <p className="text-fg-muted border-border-subtle border-b px-3 py-2 text-sm">{description}</p>
        </Conditional.If>

        <Tabs.Content value="preview" className="m-0">
          <div
            data-slot="docs-example-preview"
            dir={rtl ? 'rtl' : 'ltr'}
            className={cn(
              'bg-surface-sunken text-fg flex min-h-40 flex-wrap items-center justify-center gap-3 p-8',
              '[background-image:radial-gradient(var(--border-subtle)_1px,transparent_1px)] [background-size:12px_12px]',
              dark === true && 'dark',
              dark === false && 'light',
            )}
          >
            {children}
          </div>
        </Tabs.Content>

        <Tabs.Content value="code" className="m-0">
          <CodeBlock copyable={false} className="my-0 rounded-none border-0">
            <code>{code}</code>
          </CodeBlock>
        </Tabs.Content>
      </Tabs>
    </figure>
  );
}
