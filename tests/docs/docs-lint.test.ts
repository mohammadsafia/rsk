import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const PROBE = [
  '---',
  'id: lint-probe',
  'title: Probe',
  'section: Components',
  'category: UI',
  'description: Probe.',
  '---',
  '',
  '<Example>',
  '  <b>x</b>',
  '</Example>',
  '',
  '## Code',
  '',
  '```tsx',
  '<b>x</b>',
  '```',
  '',
  '| Prop | Type |',
  '|---|---|',
  '| `x` | `string` |',
  '',
].join('\n');

// Lints a throwaway docs root, so the probe never sits next to real pages while other tests glob them.
const lint = (pages: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'docs-lint-'));
  try {
    for (const [file, text] of Object.entries(pages)) {
      mkdirSync(join(root, file, '..'), { recursive: true });
      writeFileSync(join(root, file), text);
    }
    execFileSync('npx', ['tsx', 'src/component-docs/scripts/lint.ts'], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env, DOCS_LINT_ROOT: root },
    });
    return '';
  } catch (error) {
    return String((error as { stderr: Buffer }).stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe('docs:lint', () => {
  it('fails a component page that breaks the anatomy', () => {
    const output = lint({ 'ui/__lint-probe.mdx': PROBE });

    expect(output).toContain('__lint-probe.mdx');
    expect(output).toMatch(/Example without a title/);
    expect(output).toMatch(/duplicated "Code" section/);
    expect(output).toMatch(/missing API \/ Accessibility \/ RTL notes section/);
    expect(output).toMatch(/markdown props table, use <PropsTable>/);
  }, 30_000);

  it('does not apply the component anatomy to guides', () => {
    const guide = PROBE.replace('category: UI', 'category: Guides')
      .replace('<Example>', '<Example title="Probe">')
      .replace(/## Code[\s\S]*$/, '## Steps\n');

    expect(lint({ 'guides/__lint-probe.mdx': guide })).toBe('');
  }, 30_000);

  it('the template emits the new page anatomy', () => {
    const template = readFileSync(`${ROOT}src/component-docs/_template/component.mdx.tpl`, 'utf8');
    expect(template).toMatch(/<Example title=/);
    expect(template).toMatch(/## API[\s\S]*## Accessibility[\s\S]*## RTL notes/);
    expect(template).not.toMatch(/^## Code/m);
  });
});
