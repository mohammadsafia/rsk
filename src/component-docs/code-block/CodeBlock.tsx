import { useEffect, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';

import { IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Check, Copy } from 'lucide-react';

type CodeBlockProps = Readonly<ComponentPropsWithoutRef<'pre'>>;

const preStyles =
  'bg-code-surface text-code-foreground border-border overflow-x-auto rounded-lg border p-5 pt-7 text-start font-mono text-sm leading-relaxed';

function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');

  if (typeof node === 'object' && 'props' in node) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return extractText(el.props.children);
  }

  return '';
}

function useCopyToClipboard(text: string) {
  const [copied, setCopied] = useState(false);

  const clipboard = globalThis.navigator?.clipboard;
  const canCopy = Boolean(text) && typeof clipboard?.writeText === 'function';

  useEffect(() => {
    if (!copied) return;
    const timeout = globalThis.setTimeout(() => setCopied(false), 1200);
    return () => globalThis.clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    if (!canCopy || !clipboard) return;
    try {
      await clipboard.writeText(text);
      setCopied(true);
    } catch {
      // ignore
    }
  }

  return { copied, canCopy, copy };
}

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const { t } = useAppTranslation('components');
  const text = extractText(children).trim();
  const { copied, canCopy, copy } = useCopyToClipboard(text);

  if (!text) return null;

  return (
    <div data-slot="code-block" className="not-prose group relative my-6">
      <IconButton
        size="sm"
        variant="ghost"
        aria-label={t(copied ? 'code.copied' : 'code.copy')}
        disabled={!canCopy}
        onClick={copy}
        className="text-code-muted hover:text-code-foreground absolute end-3 top-3 z-10"
      >
        <Conditional>
          <Conditional.If condition={copied}>
            <Check aria-hidden="true" className="text-success" />
          </Conditional.If>

          <Conditional.Else>
            <Copy aria-hidden="true" />
          </Conditional.Else>
        </Conditional>
      </IconButton>

      <pre dir="ltr" {...props} className={cn(preStyles, className)}>
        {children}
      </pre>
    </div>
  );
}
