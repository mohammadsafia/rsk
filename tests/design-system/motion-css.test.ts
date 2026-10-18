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

  it('the app shell recedes by --motion-depth under a modal surface, and never under reduced motion', () => {
    const css = read('src/styles/motion.css');
    expect(css).toMatch(/\[data-overlay-depth\] \[data-slot='app-shell'\]\s*\{[^}]*scale: calc\(1 - var\(--motion-depth\)\)/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*\[data-overlay-depth\] \[data-slot='app-shell'\][^}]*scale: none/);
  });
});
