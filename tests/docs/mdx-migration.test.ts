import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../src/component-docs/', import.meta.url));
const SKIP = new Set(['guides', '_template', '_fixtures', 'docs']);

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return SKIP.has(name) ? [] : walk(full);
    return name.endsWith('.mdx') ? [full] : [];
  });

const pages = walk(ROOT).map((file) => ({ file: file.slice(ROOT.length), text: readFileSync(file, 'utf8') }));

describe('component docs migration', () => {
  it('wraps demos in titled <Example> blocks', () => {
    const offenders = pages.filter(({ text }) => !/<Example\s+title=/.test(text)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('has no hand-copied "## Code" section', () => {
    const offenders = pages.filter(({ text }) => /^##\s+Code\s*$/m.test(text)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('ends component pages with API, Accessibility and RTL notes', () => {
    const offenders = pages
      .filter(({ file }) => !file.startsWith('foundations/'))
      .filter(({ text }) => !(/^##\s+API\s*$/m.test(text) && /^##\s+Accessibility\s*$/m.test(text) && /^##\s+RTL notes\s*$/m.test(text)))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('uses PropsTable instead of markdown API tables', () => {
    const offenders = pages.filter(({ text }) => /^\|\s*Prop\s*\|/m.test(text)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
