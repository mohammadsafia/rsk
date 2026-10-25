import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

// The docs site's highlighted code (rehype-pretty-code): its styles live in src/index.css, which the starter ships
// without them.
const indexCss = readFileSync(fileURLToPath(new URL('../../src/index.css', import.meta.url)), 'utf8');

describe('code blocks', () => {
  it('render comments in --code-muted (the GitHub theme grey is too faint on the code surface)', () => {
    expect(indexCss).toMatch(/\[style\*='--shiki-dark: #6A737D'\]\s*\{\s*color: var\(--code-muted\) !important;/);
  });

  it('always use the dark syntax palette, because --code-surface is dark in both themes', () => {
    expect(indexCss).not.toContain('var(--shiki-light)');
    expect(indexCss).toMatch(/\[data-rehype-pretty-code-figure\] code \[style\*='--shiki-dark'\] \{\s*color: var\(--shiki-dark\)/);
  });
});
