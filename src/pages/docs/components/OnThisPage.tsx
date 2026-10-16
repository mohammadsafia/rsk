import { useEffect, useState } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

type Heading = { depth: number; text: string; slug: string };

export default function OnThisPage({ headings }: { headings: ReadonlyArray<Heading> }) {
  const { t } = useAppTranslation('docs');
  const [active, setActive] = useState(headings[0]?.slug);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = headings.map((heading) => document.getElementById(heading.slug)).filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label={t('onThisPage')} className="sticky top-6 hidden w-52 shrink-0 self-start xl:block">
      <p className="text-fg-subtle text-2xs mb-2 font-medium tracking-wider uppercase rtl:tracking-normal">{t('onThisPage')}</p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {headings.map((heading) => (
          <li key={heading.slug} className={cn(heading.depth === 3 && 'ps-3')}>
            <a
              href={`#${heading.slug}`}
              aria-current={active === heading.slug ? 'location' : undefined}
              className="text-fg-muted hover:text-fg aria-[current=location]:text-fg transition-colors aria-[current=location]:font-medium"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
