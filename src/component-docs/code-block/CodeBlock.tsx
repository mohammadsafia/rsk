import { useEffect, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';

import { Check, Copy } from 'lucide-react';

type CodeBlockProps = Readonly<ComponentPropsWithoutRef<'pre'>>;

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
  const text = extractText(children).trim();
  const { copied, canCopy, copy } = useCopyToClipboard(text);

  if (!text) return null;

  return (
    <div className="not-prose group relative my-6">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        disabled={!canCopy}
        className={`absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-xl border border-border bg-code-surface text-code-foreground transition-all duration-200 hover:-translate-y-px hover:text-foreground ${!canCopy ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {copied ? <Check className="text-success h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>

      <pre
        {...props}
        className={`overflow-x-auto rounded-2xl border border-border bg-code-surface p-5 pt-7 text-sm leading-relaxed ${className ?? ''}`}
      >
        {children}
      </pre>
    </div>
  );
}
