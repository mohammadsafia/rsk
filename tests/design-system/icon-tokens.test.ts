import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ICONS = `${ROOT}src/assets/icons/`;
const defined = new Set(
  ['src/styles/palette.css', 'src/styles/tokens.css']
    .flatMap((file) => [...readFileSync(`${ROOT}${file}`, 'utf8').matchAll(/--([a-z0-9-]+)\s*:/g)])
    .map((match) => match[1]),
);

describe('asset icons', () => {
  const files = readdirSync(ICONS).filter((name) => name.endsWith('.tsx'));

  it('reference only CSS variables the theme defines', () => {
    const undefinedVars = files.flatMap((name) =>
      [...readFileSync(`${ICONS}${name}`, 'utf8').matchAll(/var\(--([a-z0-9-]+)\)/g)]
        .map((match) => match[1])
        .filter((v) => !defined.has(v))
        .map((v) => `${name}: --${v}`),
    );
    expect(undefinedVars).toEqual([]);
  });

  it('use no fixed white/black inks (they vanish in one theme)', () => {
    const fixed = files.filter((name) => /(?:fill|stroke)="(?:white|black)"/.test(readFileSync(`${ICONS}${name}`, 'utf8')));
    expect(fixed).toEqual([]);
  });
});
