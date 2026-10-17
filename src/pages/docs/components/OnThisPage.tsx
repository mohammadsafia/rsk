import { useEffect, useState } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

type Heading = { depth: number; text: string; slug: string };

/** Distance from the top of the viewport, below the sticky top bar, at which a heading becomes current. */
const READING_LINE = 120;

export default function OnThisPage({ headings }: { headings: ReadonlyArray<Heading> }) {
  const { t } = useAppTranslation('docs');
  const [active, setActive] = useState(headings[0]?.slug);

  // The active section is the last heading above the reading line. Headings are looked up on every scroll,
  // not once on mount, because the MDX body loads lazily and usually mounts after this outline. Scroll
  // events don't bubble, so listen in the capture phase to hear the docs content scroller.
  useEffect(() => {
    const update = () => {
      let current = headings[0]?.slug;
      for (const heading of headings) {
        const node = document.getElementById(heading.slug);
        if (node && node.getBoundingClientRect().top <= READING_LINE) current = heading.slug;
      }
      setActive(current);
    };

    update();
    document.addEventListener('scroll', update, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', update, { capture: true });
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label={t('onThisPage')} className="sticky top-6 hidden w-52 shrink-0 self-start xl:block">
      <p className="text-fg-muted text-2xs mb-2 font-medium tracking-wider uppercase rtl:tracking-normal">{t('onThisPage')}</p>
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
