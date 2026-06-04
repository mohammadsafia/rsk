import { useEffect, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';

import { Check, Copy } from 'lucide-react';

type CodeBlockProps = Readonly<ComponentPropsWithoutRef<'pre'>>;

const copyButtonStyles = [
  'absolute top-3 right-3 z-10',
  'grid h-9 w-9 place-items-center',
  'border-primary/20 rounded-xl border',
  'bg-[radial-gradient(120%_140%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent)_0%,transparent_60%),linear-gradient(180deg,color-mix(in_oklch,var(--surface)_92%,white)_0%,color-mix(in_oklch,var(--surface)_65%,var(--primary-15))_100%)]',
  'text-foreground/70 hover:text-foreground',
  'shadow-[inset_0_1px_0_color-mix(in_oklch,var(--surface)_70%,transparent),0_12px_24px_-20px_color-mix(in_oklch,var(--primary)_24%,transparent),0_2px_0_0_color-mix(in_oklch,var(--primary)_22%,transparent)]',
  'backdrop-blur',
  'transition-[transform,box-shadow,background-color,border-color,color] duration-200',
  'hover:-translate-y-px',
  'hover:border-primary/35',
  'focus-visible:ring-primary/40 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
  'active:translate-y-px',
].join(' ');

const preStyles = [
  'overflow-x-auto',
  'rounded-2xl',
  'border-primary/15 border',
  'bg-muted/20',
  'p-5',
  'pt-7',
  'text-sm',
  'leading-relaxed',
  'shadow-[inset_0_1px_0_color-mix(in_oklch,var(--surface)_70%,transparent),0_18px_50px_-38px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
  'selection:bg-primary/15 selection:text-foreground',
].join(' ');

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
        className={`${copyButtonStyles} ${!canCopy ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {copied ? <Check className="text-success h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>

      <pre {...props} className={`${preStyles} ${className ?? ''}`}>
        {children}
      </pre>
    </div>
  );
}