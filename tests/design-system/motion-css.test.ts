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
});
