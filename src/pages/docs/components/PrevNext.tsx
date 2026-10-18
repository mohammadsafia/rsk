import { useMemo } from 'react';
import { Link } from 'react-router';

import { Conditional } from '@components/utils';
import { getComponentDocsRegistry } from '@component-docs/registry';
import { docsReadingOrder } from '@component-docs/docs-nav';

import { useAppTranslation } from '@hooks/shared';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const CARD =
  'border-border hover:bg-hover focus-visible:ring-ring flex flex-col gap-0.5 rounded-lg border px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none';

export default function PrevNext({ id }: { id: string }) {
  const { t } = useAppTranslation('docs');
  const order = useMemo(() => docsReadingOrder(getComponentDocsRegistry()), []);
  const index = order.findIndex((item) => item.id === id);
  const prev = index > 0 ? order[index - 1] : undefined;
  const next = index >= 0 && index < order.length - 1 ? order[index + 1] : undefined;

  return (
    <nav
      data-slot="docs-prev-next"
      aria-label={`${t('prev')} / ${t('next')}`}
      className="border-border-subtle mt-12 flex justify-between gap-4 border-t pt-6"
    >
      <Conditional.If condition={!!prev}>
        <Link to={prev?.href ?? ''} className={CARD}>
          <span className="text-fg-muted flex items-center gap-1 text-xs">
            <ChevronLeft aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
            {t('prev')}
          </span>
          <span className="text-fg text-sm font-medium">{prev?.title}</span>
        </Link>
      </Conditional.If>

      <Conditional.If condition={!!next}>
        <Link to={next?.href ?? ''} className={`${CARD} ms-auto items-end text-end`}>
          <span className="text-fg-muted flex items-center gap-1 text-xs">
            {t('next')}
            <ChevronRight aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
          </span>
          <span className="text-fg text-sm font-medium">{next?.title}</span>
        </Link>
      </Conditional.If>
    </nav>
  );
}
