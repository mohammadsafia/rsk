/**
 * Minimal CSS custom-property reader for token tests. Only supports the flat
 * `selector { --name: value; }` blocks used in src/styles/*.css.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

const VAR_REFERENCE = /^var\(--([\w-]+)\)$/;

export function readProjectFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), 'utf8');
}

export function extractBlock(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Selector not found: ${selector}`);

  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const vars: Record<string, string> = {};

  for (const match of css.slice(open + 1, close).matchAll(/--([\w-]+)\s*:([^;]+);/g)) {
    vars[match[1]] = match[2].trim();
  }

  return vars;
}

export function resolveToken(vars: Record<string, string>, name: string, seen: Set<string> = new Set()): string {
  const value = vars[name];
  if (value === undefined) throw new Error(`Token --${name} is not defined`);

  const reference = VAR_REFERENCE.exec(value);
  if (!reference) return value;

  if (seen.has(name)) throw new Error(`Cycle at --${name}`);
  seen.add(name);

  return resolveToken(vars, reference[1], seen);
}
