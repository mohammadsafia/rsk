import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const read = (path: string) => readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8');

describe('motion CSS contract', () => {
  it('cascade staggers the first twelve children from --motion-stagger (zero in calm)', () => {
    const css = read('src/styles/utilities.css');
    expect(css).toMatch(/@utility cascade\s*\{/);
    expect(css).toContain('nth-child(12)');
    expect(css).toMatch(/calc\(var\(--motion-stagger\) \* 11\)/);
    // The rise distance is a variable, so a list that measures its own overflow (Select) can come in from above.
    expect(css).toContain('--tw-enter-translate-y: var(--cascade-rise, 4px);');
  });

  it('cascade leaves a shimmering placeholder child its own shimmer instead of replacing it with the arrival', () => {
    const css = read('src/styles/utilities.css');
    const cascade = css.slice(css.indexOf('@utility cascade'));
    expect(cascade).toMatch(/& > :not\(:where\(\.shimmer\)\)\s*\{[^}]*animation: enter/);
  });

  it('the app shell recedes by --motion-depth while a modal surface is open, and never under reduced motion', () => {
    const css = read('src/styles/motion.css');
    expect(css).toMatch(
      /:root:has\(\[data-slot='dialog-content'\]\[data-state='open'\], \[data-slot='sheet-content'\]\[data-state='open'\]\) \[data-slot='app-shell'\]\s*\{[^}]*scale: calc\(1 - var\(--motion-depth\)\)/,
    );
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*\[data-slot='app-shell'\][^}]*scale: none/);
  });

  it('tactile squashes on press and springs back; draw-check strokes the check in; both still under reduced motion', () => {
    const css = read('src/styles/utilities.css');
    expect(css).toMatch(/@utility tactile\s*\{[\s\S]*?&:active\s*\{[^}]*scale: 0\.85/);
    expect(css).toMatch(/@utility draw-check\s*\{[\s\S]*?animation: rsk-stroke/);
    expect(read('src/styles/motion.css')).toMatch(/@keyframes rsk-stroke\s*\{[\s\S]*?stroke-dashoffset: 24/);
    const tactile = css.slice(css.indexOf('@utility tactile'), css.indexOf('@utility draw-check'));
    expect(tactile).toContain('prefers-reduced-motion: reduce');
  });

  it('shimmer sweeps a faint ink band along the inline direction, reversed in RTL, still under reduced motion', () => {
    const css = read('src/styles/utilities.css');
    const shimmer = css.slice(css.indexOf('@utility shimmer'));
    expect(shimmer).toMatch(/animation: rsk-shimmer/);
    expect(shimmer).toMatch(/\[dir='rtl'\][\s\S]*?animation-direction: reverse/);
    expect(shimmer).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*animation: none/);
    expect(read('src/styles/motion.css')).toMatch(/@keyframes rsk-shimmer/);
  });

  it('the theme switch reveals the new snapshot as a circle (a fade in calm), never per-element transitions; reveal rises sections in counting order', () => {
    const css = read('src/styles/motion.css');
    // While the theme swaps, elements' own colour transitions are frozen: the reveal is the only motion.
    expect(css).toMatch(
      /\.theme-switching \*,\s*\.theme-switching \*::before,\s*\.theme-switching \*::after\s*\{\s*transition: none !important;/,
    );
    expect(css).toMatch(/::view-transition-new\(root\)\s*\{\s*animation: rsk-theme-reveal/);
    expect(css).toMatch(/@keyframes rsk-theme-reveal[\s\S]*?clip-path: circle\(var\(--theme-reveal-r/);
    expect(css).toMatch(/\[data-motion='calm'\]::view-transition-new\(root\)\s*\{\s*animation: rsk-theme-fade/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*::view-transition-group\(\*\)/);
    const utilities = read('src/styles/utilities.css');
    expect(utilities).toMatch(/@utility reveal\s*\{[\s\S]*?--tw-enter-translate-y: 10px[\s\S]*?var\(--motion-reveal-stagger\) \* 5/);
  });

  it('reduced motion caps every enter/exit fade at fast (spec §3), however the component times it', () => {
    const css = read('src/styles/utilities.css');
    const global = css.slice(css.indexOf('/* Reduced motion: keep opacity fades'));
    expect(global).toMatch(
      /\[data-state='open'\],\s*\[data-state='closed'\]\s*\{\s*animation-duration: var\(--duration-fast\) !important;/,
    );
    for (const name of ['cascade', 'reveal']) {
      const block = css.slice(css.indexOf(`@utility ${name}`));
      expect(block.slice(0, block.indexOf('\n}\n'))).toMatch(
        /prefers-reduced-motion: reduce\)[\s\S]*animation-duration: var\(--duration-fast\) !important/,
      );
    }
  });
});
