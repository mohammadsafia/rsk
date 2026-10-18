import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';

import { parseAsString, useQueryState } from 'nuqs';

import { Button } from '@components/ui';
import { CardGrid, PageHeader } from '@components/shared';
import { Conditional } from '@components/utils';
import { type ComponentDocEntry, getComponentDocsRegistry, normalizeCategoryKey } from '@component-docs/registry';
import { docHref, docsNavGroups } from '@component-docs/docs-nav';
import { THUMBNAILS } from '@component-docs/thumbnails';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { CalendarDays, ChartLine, Component, FormInput, Puzzle, Table2, Wrench } from 'lucide-react';

const PAGE_CATEGORIES = new Set(['GUIDES', 'FOUNDATIONS']);

const GLYPH: Record<string, typeof Component> = {
  UI: Component,
  FORMS: FormInput,
  SHARED: Puzzle,
  TABLES: Table2,
  CALENDAR: CalendarDays,
  CHARTS: ChartLine,
  HOOKS: Wrench,
};

function Thumb({ entry }: { entry: ComponentDocEntry }) {
  const ref = useRef<HTMLDivElement>(null);
  const render: (() => ReactNode) | undefined = THUMBNAILS[entry.id];
  const Glyph = GLYPH[normalizeCategoryKey(entry.category)] ?? Component;

  // React 18 has no `inert` prop.
  useEffect(() => ref.current?.setAttribute('inert', ''), []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="docs-card-thumb"
      data-fallback={render ? undefined : true}
      className="bg-surface-sunken border-border-subtle pointer-events-none flex h-24 items-center justify-center gap-2 overflow-hidden border-b p-3"
    >
      <Conditional>
        <Conditional.If condition={!!render}>{render?.()}</Conditional.If>

        <Conditional.Else>
          <Glyph className="text-fg-subtle size-6" strokeWidth={1.5} />
        </Conditional.Else>
      </Conditional>
    </div>
  );
}

export default function DocsComponentsPage() {
  const { t } = useAppTranslation('docs');
  const [category, setCategory] = useQueryState('category', parseAsString);

  const docs = useMemo(() => getComponentDocsRegistry().filter((doc) => !PAGE_CATEGORIES.has(normalizeCategoryKey(doc.category))), []);
  const groups = useMemo(() => docsNavGroups(docs), [docs]);
  const active = category?.toUpperCase() ?? null;
  const visible = active ? docs.filter((doc) => normalizeCategoryKey(doc.category) === active) : docs;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <PageHeader title={t('overview.title')} description={t('overview.description', { count: docs.length })} />

      <div role="group" aria-label={t('overview.title')} className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant={active ? 'outline' : 'solid'} aria-pressed={!active} onClick={() => void setCategory(null)}>
          {t('overview.all')} <span className="font-mono tabular-nums">{docs.length}</span>
        </Button>

        {groups.map((group) => (
          <Button
            key={group.key}
            size="sm"
            variant={active === group.key ? 'solid' : 'outline'}
            aria-pressed={active === group.key}
            onClick={() => void setCategory(group.key.toLowerCase())}
          >
            {t(group.labelKey)} <span className="font-mono tabular-nums">{group.items.length}</span>
          </Button>
        ))}
      </div>

      <CardGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
        {visible.map((doc) => (
          <Link
            key={doc.id}
            to={docHref(doc)}
            data-slot="docs-card"
            className={cn(
              'border-border hover:border-border-strong bg-surface block overflow-hidden rounded-lg border transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            )}
          >
            <Thumb entry={doc} />

            <div className="flex flex-col gap-0.5 p-3">
              <span className="text-fg text-sm font-semibold">{doc.title}</span>
              <span className="text-fg-muted line-clamp-2 text-xs">{doc.description}</span>
            </div>
          </Link>
        ))}
      </CardGrid>
    </div>
  );
}
