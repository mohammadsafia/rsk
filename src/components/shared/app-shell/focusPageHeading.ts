// Loaded on the first navigation only (AppShell.Content imports it then), so it adds nothing to a page's first load.

/** How long a lazily loaded page's heading is waited for. */
const HEADING_WAIT_MS = 3000;
/** How soon the main region takes the focus while the page has no heading yet. */
const INTERIM_FOCUS_MS = 100;

/** The page's first h1, skipping the previous page's, which Suspense keeps hidden (display: none) while the next loads. */
const visibleHeading = (main: HTMLElement): HTMLElement | null => {
  for (const heading of main.querySelectorAll<HTMLElement>('h1')) {
    let hidden = false;
    for (let node: HTMLElement | null = heading; node && node !== main; node = node.parentElement)
      if (node.style.display === 'none' || node.hidden) hidden = true;
    if (!hidden) return heading;
  }
  return null;
};

/**
 * Moves the focus to the page's first h1 inside `main`, else to `main` itself. A lazily loaded page renders its
 * heading later: `main` holds the focus meanwhile and hands it to the heading when it appears. Focus the person or
 * the page moved anywhere else (an autofocused field) is left alone. Returns the cleanup.
 */
export function focusPageHeading(main: HTMLElement, startedOn: Element | null): () => void {
  // Still ours to move: where it was before the navigation, nowhere, or on the region we focused.
  const ours = () => [startedOn, document.body, main, null].includes(document.activeElement);

  const focusHeading = (): boolean => {
    if (!ours()) return true;
    const heading = visibleHeading(main);
    if (!heading) return false;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus();
    return true;
  };
  if (focusHeading()) return () => {};

  const observer = new MutationObserver(() => {
    if (focusHeading()) stop();
  });
  const interim = setTimeout(() => {
    if (ours()) main.focus({ preventScroll: true });
  }, INTERIM_FOCUS_MS);
  const timer = setTimeout(() => stop(), HEADING_WAIT_MS);
  const stop = () => {
    observer.disconnect();
    clearTimeout(interim);
    clearTimeout(timer);
  };
  observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden'] });
  return stop;
}
