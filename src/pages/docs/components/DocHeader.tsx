import { useState } from 'react';

import { IconButton, Tag } from '@components/ui';
import { Breadcrumb } from '@components/shared';
import { Conditional } from '@components/utils';
import { type ComponentDocEntry, normalizeCategoryKey } from '@component-docs/registry';

import { useAppTranslation } from '@hooks/shared';

import { Check, Copy } from 'lucide-react';

const IMPORT_FROM: Record<string, string> = {
  UI: '@components/ui',
  FORMS: '@components/forms',
  SHARED: '@components/shared',
  TABLES: '@components/tables',
  CALENDAR: '@components/calendar',
  HOOKS: '@hooks/shared',
};

/** `import { Button } from '@components/ui';` — undefined for guides and foundations. */
export const importLineFor = (entry: Pick<ComponentDocEntry, 'title' | 'category' | 'importFrom'>) => {
  const from = entry.importFrom ?? IMPORT_FROM[normalizeCategoryKey(entry.category)];
  return from ? `import { ${entry.title} } from '${from}';` : undefined;
};

export default function DocHeader({ entry }: { entry: ComponentDocEntry }) {
  const { t } = useAppTranslation('docs');
  const importLine = importLineFor(entry);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!importLine) return;
    try {
      await navigator.clipboard.writeText(importLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard unavailable: nothing to do.
    }
  };

  return (
    <div data-slot="docs-header" className="mb-8 flex flex-col gap-3">
      <Conditional.If condition={!!importLine}>
        <Breadcrumb links={[{ title: t('nav.components'), href: 'docs/components' }, { title: entry.title }]} />
      </Conditional.If>

      <h1 className="text-fg text-3xl font-semibold tracking-tight rtl:tracking-normal">{entry.title}</h1>

      <p className="text-fg-muted max-w-prose text-base">{entry.description}</p>

      <Conditional.If condition={(entry.tags?.length ?? 0) > 0}>
        <div className="flex flex-wrap gap-1.5">
          {entry.tags?.map((tag) => (
            <Tag key={tag} size="sm">
              {tag}
            </Tag>
          ))}
        </div>
      </Conditional.If>

      <Conditional.If condition={!!importLine}>
        <div
          data-slot="docs-import"
          className="bg-surface-sunken border-border flex max-w-xl items-center gap-2 rounded-md border ps-3 pe-1"
        >
          <code dir="ltr" className="text-fg min-w-0 flex-1 truncate py-2 text-start font-mono text-xs">
            {importLine}
          </code>

          <IconButton size="sm" aria-label={t('header.copyImport')} onClick={() => void copy()}>
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
      </Conditional.If>
    </div>
  );
}
