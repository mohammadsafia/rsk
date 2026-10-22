'use client';

import { Component, type FC, lazy, type ReactNode, Suspense, useState } from 'react';

import { Conditional } from '@components/utils';

import { useCommandPalette } from '@contexts';

const load = () => import('./CommandPalette');

/** Contains a failed palette load, so it never takes the page down with it. */
class LoadBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('The command palette failed to load', error);
    this.props.onError();
  }

  render() {
    return <Conditional.If condition={!this.state.failed}>{this.props.children}</Conditional.If>;
  }
}

/**
 * The command palette, loaded the first time it is asked to open (⌘K or its trigger), so an app's first load doesn't
 * carry it. After that it stays mounted and opens at once. If its chunk can't load (offline, or a deploy since the
 * tab opened), the palette closes and the next ⌘K tries again; the page stays as it was.
 */
const LazyCommandPalette: FC = () => {
  const { open, setOpen } = useCommandPalette();
  const [wanted, setWanted] = useState(open);
  // lazy() remembers a failed import, so a retry needs a fresh one.
  const [CommandPalette, setCommandPalette] = useState(() => lazy(load));
  if (open && !wanted) setWanted(true);

  const handleLoadError = () => {
    setWanted(false);
    setOpen(false);
    setCommandPalette(() => lazy(load));
  };

  return (
    <Conditional.If condition={wanted}>
      <LoadBoundary onError={handleLoadError}>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </LoadBoundary>
    </Conditional.If>
  );
};

export default LazyCommandPalette;
