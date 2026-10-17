import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vite-plus/test';

const REPO_ROOT = new URL('../../', import.meta.url).pathname;

describe('docs:new template', () => {
  it('emits the kit conventions', () => {
    const template = readFileSync(`${REPO_ROOT}src/component-docs/_template/component.mdx.tpl`, 'utf8');
    expect(template).toMatch(/## API/);
    expect(template).toMatch(/text-fg-muted|bg-surface/);
    expect(template).not.toMatch(/muted-foreground|primary|bg-background/);
  });
});
