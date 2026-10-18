import { type FC, lazy, Suspense, useState } from 'react';

import { useCommandPalette } from '@contexts';

const CommandPalette = lazy(() => import('./CommandPalette'));

/**
 * The command palette, loaded the first time it is asked to open (⌘K or its trigger), so an app's first load doesn't
 * carry it. After that it stays mounted and opens at once.
 */
const LazyCommandPalette: FC = () => {
  const { open } = useCommandPalette();
  const [wanted, setWanted] = useState(open);
  if (open && !wanted) setWanted(true);

  return wanted ? (
    <Suspense fallback={null}>
      <CommandPalette />
    </Suspense>
  ) : null;
};

export default LazyCommandPalette;
