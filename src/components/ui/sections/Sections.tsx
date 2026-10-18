import { type ComponentPropsWithoutRef, createContext, type FC, type ReactNode, useContext } from 'react';

import { UNSAFE_RouteContext as RouteContext } from 'react-router';

import { useRevealOnce } from '@hooks/motion';

import { cn } from '@utils';

export type SectionMarkerValue = 'auto' | false;

const SectionsContext = createContext(false);

/**
 * A group whose structural children are numbered 01, 02, … by CSS counters (hidden children are skipped). On the first
 * visit to a route in a session, the sections rise in counting order (never on back/forward or revisits).
 */
/**
 * Which page this is, for the once-per-session reveal: the matched route pattern ("/patients/:id"), so every patient's
 * profile counts as one page; outside a router, the path without a trailing slash.
 */
const useRevealKey = () => {
  const { matches } = useContext(RouteContext);
  const pattern = matches
    .map((match) => match.route.path)
    .filter(Boolean)
    .join('/')
    .replace(/\/{2,}/g, '/');
  if (pattern) return pattern;
  return typeof window === 'undefined' ? '' : window.location.pathname.replace(/(.)\/+$/, '$1');
};

const Sections: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => {
  const reveal = useRevealOnce(useRevealKey());

  return (
    <SectionsContext.Provider value={true}>
      <div data-slot="sections" data-reveal={reveal || undefined} className={cn('sections', reveal && 'reveal', className)} {...props} />
    </SectionsContext.Provider>
  );
};

/** Portalled overlays (dialog, sheet, toast) are outside the page's counter, so they must not ask for a number. */
const SectionsReset: FC<{ children: ReactNode }> = ({ children }) => (
  <SectionsContext.Provider value={false}>{children}</SectionsContext.Provider>
);

/** The Ledger structural number before a heading: 01, 02, … from the CSS counter, only inside <Sections>. Decorative. */
const SectionMarker: FC<{ marker?: SectionMarkerValue; className?: string }> = ({ marker = 'auto', className }) => {
  const numbered = useContext(SectionsContext);
  if (marker === false || !numbered) return null;
  return <span aria-hidden="true" data-slot="section-marker" data-kind="number" className={cn('section-number', className)} />;
};

export { SectionMarker, Sections, SectionsReset };
