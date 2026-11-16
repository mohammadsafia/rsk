/**
 * Minimal CSS custom-property reader for token tests. Only supports the flat
 * `selector { --name: value; }` blocks used in src/styles/*.css.
 */

import { existsSync, readFileSync } from 'node:fs';
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

/** The app's accent overrides (pnpm theme:accent), read over the kit's tokens.css by the token tests. */
export const ACCENT_FILE = 'src/app-config/accent.css';

/** `selector`'s variables in `baseCss`, with those `overlayCss` sets for the same selector on top (none: unchanged). */
export function overlayBlock(baseCss: string, overlayCss: string, selector: string): Record<string, string> {
  const base = extractBlock(baseCss, selector);
  return overlayCss.includes(`${selector} {`) ? { ...base, ...extractBlock(overlayCss, selector) } : base;
}

/** A mode's semantic tokens as the app renders them: tokens.css, then the app's accent.css if it has one. */
export function appTokens(selector: string): Record<string, string> {
  const accent = existsSync(join(REPO_ROOT, ACCENT_FILE)) ? readProjectFile(ACCENT_FILE) : '';
  return overlayBlock(readProjectFile('src/styles/tokens.css'), accent, selector);
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
