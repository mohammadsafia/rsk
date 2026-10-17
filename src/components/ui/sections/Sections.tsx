import { type ComponentPropsWithoutRef, createContext, type FC, type ReactNode, useContext } from 'react';

import { cn } from '@utils';

export type SectionMarkerValue = 'auto' | false;

const SectionsContext = createContext(false);

/** A group whose structural children are numbered 01, 02, … by CSS counters (hidden children are skipped). */
const Sections: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => (
  <SectionsContext.Provider value={true}>
    <div data-slot="sections" className={cn('sections', className)} {...props} />
  </SectionsContext.Provider>
);

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
