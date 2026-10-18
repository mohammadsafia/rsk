import { useEffect } from 'react';

/** How many modal surfaces are open right now; nested overlays recede the page once, not once each. */
let openSurfaces = 0;

const sync = () => {
  if (openSurfaces > 0) document.documentElement.dataset.overlayDepth = '';
  else delete document.documentElement.dataset.overlayDepth;
};

/**
 * Marks `<html data-overlay-depth>` while this modal surface is open, so the app shell recedes behind it (motion.css).
 * Calm sets the depth to 0 and reduced motion removes it in CSS, so callers need not check the mode.
 */
export function usePageDepth(open: boolean) {
  useEffect(() => {
    if (!open) return;
    openSurfaces += 1;
    sync();
    return () => {
      openSurfaces -= 1;
      sync();
    };
  }, [open]);
}
