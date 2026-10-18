import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const root = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url));

describe('a11y audit script', () => {
  it('is committed, wired to pnpm a11y:audit, and covers light/dark × en/ar with WCAG 2.2 AA tags', () => {
    expect(existsSync(root('scripts/a11y/audit.mjs'))).toBe(true);
    const pkg = JSON.parse(readFileSync(root('package.json'), 'utf8'));
    expect(pkg.scripts['a11y:audit']).toBe('node scripts/a11y/audit.mjs');
    const source = readFileSync(root('scripts/a11y/audit.mjs'), 'utf8');
    for (const needle of ["'light'", "'dark'", "'en'", "'ar'", "'wcag22aa'", 'process.exitCode = 1']) expect(source).toContain(needle);
  });

  it('finds the pages itself (following same-site links), so the starter audits its own routes', () => {
    const source = readFileSync(root('scripts/a11y/audit.mjs'), 'utf8');
    expect(source).toContain('discoverRoutes');
  });
});
