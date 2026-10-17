# UI Kit Primitives — Plan A (Batches 0–3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the token, action, status and input primitives in `src/components/ui/` the Graphite Instrument look and the shared `variant` × `tone` × `size` API, migrating every call site in the same change (clean break).

**Architecture:** Batch 0 finalizes tokens (duplicate removal, solid hover steps, status-on-tint contrast). A tested, rule-driven codemod (`scripts/design-system/codemods/`) rewrites literal JSX props at call sites using the approved mapping tables; anything dynamic or judgment-dependent is reported and fixed by hand from explicit tables in this plan. TypeScript is the completeness check: once a component's CVA variants change, every stale value fails `tsc -b`. Each component task ends with its folder at zero forbidden patterns.

**Tech Stack:** React 18, TypeScript 5.9, Tailwind 4.3 (`@theme inline`, `@utility`), CVA, Radix UI, react-i18next, Vite+ (`vp`: Vitest 5, Oxlint, Oxfmt), happy-dom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-ui-kit-primitives-design.md` (addendum; §2–§7, §11–§12) and its parent `docs/superpowers/specs/2026-10-15-ui-kit-design-system-design.md` (§6 conventions). Plan B (Batches 4–6) follows this plan.

## Global Constraints

- Branch `feat/ui-kit-primitives`. Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Package commands: `P() { corepack pnpm@10.34.7 "$@"; }` (global pnpm is 9.x; repo pins 10.34.7).
- Tests import from `vite-plus/test`. DOM tests start with `// @vitest-environment happy-dom` and call `cleanup` in `afterEach`.
- Component conventions (parent spec §6 / `forge:create-component`): kebab-case folder, PascalCase file, `index.ts` default re-export, tier barrel; every sub-component takes `className`, merges with `cn()`, spreads `...props`, sets `data-slot`; `type` not `interface`; `import type`; alias imports in group order; `Conditional.If` instead of `&&`/ternaries **in JSX**; `handle*` handlers; default export last; React 18 `forwardRef` bridge kept where the file already uses it.
- Styling: semantic tokens only; no hex/rgb/oklch in `.tsx`/`.mdx`; no arbitrary length values (`p-[24px]`); no colored side-stripe borders; solid fills never use `bg-hover`/`bg-pressed`.
- Data values (IDs, amounts, times) rendered as one value are wrapped in `dir="ltr"`.
- After every task that removes violations: `P ds:baseline` (it refuses increases) and commit the baseline.
- Plan decisions not spelled out in the addendum (keep them):
  - **IconButton takes its icon as `children`** (not an `icon` prop) so `size="icon"` call sites convert without restructuring.
  - **`RadioDot` becomes `RadioGroup.Dot`** (a non-interactive indicator inside the radio-group module) instead of being replaced by `RadioGroup.Item`: its only real users (two table filters) render it inside a Command list where radio semantics would be wrong.
  - **ToggleGroup** is restyled in Batch 3 (the addendum omitted it): `variant` `outline` (default) · `ghost`, `size` `sm` · `md` · `lg`, on-state `bg-accent-subtle text-accent`; map `default` → `ghost`, size `default` → `md`.
  - **Tag** is either toggleable (`onClick` + `selected`, rendered as a `<button>`) or removable (`onRemove`), never both — nesting a remove button inside a button is invalid HTML.
  - The **root `Tooltip.Provider`** (addendum §8) is installed in Batch 1 because `IconButton` needs it.
  - Field "clear ×" buttons in `forms/`/`shared/` get the minimal edit to `IconButton` with their existing English `title` as `aria-label`; translating those labels is SP3 work.

## Review Focus

1. **Nested interactive elements.** `IconButton asChild` wrapping a `<span>` inside another button (Combobox/FormSelect clear buttons) must not render a `<button>` inside a `<button>`. → Task 3 test: `IconButton asChild` renders the child element, not a button.
2. **A loading button must not submit twice.** `<Button type="submit" loading>` must be `disabled` so Enter/clicks don't resubmit. → Task 3 test asserts `disabled` and `aria-busy`.
3. **Invalid fields still look invalid on hover.** The field hover border must not override the invalid border. → Task 8 test asserts the hover class is scoped with `not-aria-invalid`.
4. **Switch thumb direction in RTL.** The thumb must travel toward the inline end in Arabic. → Task 9 test asserts the RTL translate classes are present on the thumb for both sizes.
5. **A removable Tag announces what it removes.** Screen-reader users must hear "Remove Penicillin", not just "Remove". → Task 5 test asserts the remove button's accessible name includes the tag text.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/styles/tokens.css`, `src/styles/theme.css`, `src/lib/constants/DesignTokens.ts` | Token cleanup + new hover steps + status darkening | 1 |
| `tests/design-system/color.ts`, `tests/design-system/contrast.test.ts` | Alpha compositing + new contrast pairs | 1 |
| `scripts/design-system/codemods/migrate-props.ts` | Generic JSX literal-prop rewriter (pure) | 2 |
| `scripts/design-system/codemods/rules.ts` | Per-component mapping rules (grows per task) | 2–10 |
| `scripts/design-system/codemods/migrate.ts` | CLI: apply a rule set to `src/**/*.{tsx,mdx}` | 2 |
| `tests/design-system/codemods/migrate-props.test.ts` | Engine + rule tests | 2–10 |
| `src/components/ui/button/*`, `src/components/ui/icon-button/*` | Button + IconButton | 3 |
| `src/bootstrap.tsx` (+ test) | Root `Tooltip.Provider` | 3 |
| `src/components/ui/badge/*` | Badge | 4 |
| `src/components/ui/tag/*` (new), `ui/chip` (deleted) | Tag | 5 |
| `src/components/ui/alert/*` | Alert | 6 |
| `src/components/ui/{progress,skeleton,divider}/*` | Progress, Skeleton, Divider | 7 |
| `src/components/ui/input/*` | Field shape (`fieldVariants`) + Input | 8 |
| `src/components/ui/{checkbox,checkbox-group,radio-group,switch}/*`, `ui/radio-dot` (deleted) | Choice controls | 9 |
| `src/components/ui/{select,command,toggle-group}/*` | Menus + ToggleGroup | 10 |
| `tests/design-system/forbidden-patterns.test.ts` | "Plan A folders are clean" assertion | 11 |

### Task 1: Batch 0 — token cleanup, solid hover steps, status-on-tint contrast

**Files:**
- Modify: `src/styles/tokens.css` (light block lines 23–26, 34, 37, 40; dark block lines 80–83)
- Modify: `src/styles/theme.css:24-27`
- Modify: `src/lib/constants/DesignTokens.ts:22-25`
- Modify: `src/component-docs/foundations/FoundationScales.tsx:44,79`
- Modify: `tests/design-system/color.ts` (add `compositeOver`)
- Test: `tests/design-system/contrast.test.ts`, `tests/design-system/color.test.ts`

**Interfaces:**
- Consumes: existing token test harness (`parseOklch`, `oklchToSrgb`, `contrastRatio`, `extractBlock`, `resolveToken`, `readProjectFile`).
- Produces: tokens `fg-hover`, `fg-pressed`, `accent-hover`, `danger-hover` (removed: `inverse`, `inverse-fg`, `inverse-hover`, `inverse-pressed`); Tailwind colors `bg-fg-hover`, `bg-fg-pressed`, `bg-accent-hover`, `bg-danger-hover`; `compositeOver(top: Oklch, bottom: [number, number, number]): [number, number, number]` in `tests/design-system/color.ts`.

- [ ] **Step 1: Write the failing tests**

In `tests/design-system/color.test.ts`, add `compositeOver` to the `./color` import and append:

```ts
describe('compositeOver', () => {
  it('returns the top color when it is opaque', () => {
    expect(compositeOver(parseOklch('oklch(1 0 0)'), [0, 0, 0])).toEqual(oklchToSrgb(parseOklch('oklch(1 0 0)')));
  });

  it('blends a translucent color over the background in gamma-encoded sRGB', () => {
    const [r, g, b] = compositeOver(parseOklch('oklch(1 0 0 / 25%)'), [0, 0, 0]);
    [r, g, b].forEach((channel) => expect(channel).toBeCloseTo(0.25, 3));
  });
});
```

In `tests/design-system/contrast.test.ts`, replace the four lines

```ts
  ['inverse-fg', 'inverse', TEXT],
  ['inverse-fg', 'inverse-hover', TEXT],
  ['inverse-fg', 'inverse-pressed', TEXT],
  ['fg-inverse', 'inverse', TEXT],
```

with

```ts
  ['fg-inverse', 'fg', TEXT],
  ['fg-inverse', 'fg-hover', TEXT],
  ['fg-inverse', 'fg-pressed', TEXT],
  ['accent-fg', 'accent-hover', TEXT],
  ['danger-fg', 'danger-hover', TEXT],
```

and append this block at the end of the file:

```ts
/** Status text on its own tint (Badge soft, Alert soft). Dark tints are translucent, so they are composited over surface first. */
const TINT_PAIRS = ['success', 'warning', 'danger', 'info'] as const;

describe('status text on its own tint (WCAG AA text)', () => {
  for (const mode of ['.light', '.dark'] as const) {
    const vars = extractBlock(tokensCss, mode);
    const surface = oklchToSrgb(parseOklch(resolveToken(vars, 'surface')));

    for (const status of TINT_PAIRS) {
      it(`${mode} ${status} on ${status}-subtle ≥ ${TEXT}:1`, () => {
        const text = oklchToSrgb(parseOklch(resolveToken(vars, status)));
        const tint = compositeOver(parseOklch(resolveToken(vars, `${status}-subtle`)), surface);
        expect(contrastRatio(text, tint)).toBeGreaterThanOrEqual(TEXT);
      });
    }
  }
});
```

Add `compositeOver` to the `./color` import at the top of `contrast.test.ts`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run tests/design-system`
Expected: FAIL — `compositeOver is not a function` / `Token --fg-hover is not defined` / light `success on success-subtle` below 4.5.

- [ ] **Step 3: Implement**

Append to `tests/design-system/color.ts`:

```ts
/** Alpha-composites `top` over an opaque sRGB `bottom` the way browsers do (gamma-encoded sRGB). */
export function compositeOver(top: Oklch, bottom: Rgb): Rgb {
  const topRgb = oklchToSrgb(top);
  return topRgb.map((channel, index) => channel * top.alpha + bottom[index] * (1 - top.alpha)) as Rgb;
}
```

In `src/styles/tokens.css`, light block (`:root, .light`): replace

```css
  --inverse: oklch(0.205 0.006 271.1);
  --inverse-fg: oklch(1 0 0);
  --inverse-hover: oklch(0.29 0.007 271.1);
  --inverse-pressed: oklch(0.34 0.008 271.1);
```

with

```css
  --fg-hover: oklch(0.29 0.007 271.1);
  --fg-pressed: oklch(0.34 0.008 271.1);
```

and replace the three light status lines and add the hover steps after `--accent-fg`:

| Old (light) | New (light) |
|---|---|
| `--success: oklch(0.536 0.137 157.2);` | `--success: oklch(0.5 0.13 157.2);` |
| `--warning: oklch(0.561 0.125 70.4);` | `--warning: oklch(0.53 0.12 70.4);` |
| `--danger: oklch(0.576 0.184 35.5);` | `--danger: oklch(0.55 0.18 35.5);` |
| `--accent-fg: oklch(1 0 0);` | `--accent-fg: oklch(1 0 0);` + new line `--accent-hover: oklch(0.37 0.13 14.9);` |
| `--danger-fg: oklch(1 0 0);` | `--danger-fg: oklch(1 0 0);` + new line `--danger-hover: oklch(0.48 0.17 35.5);` |

Dark block (`.dark`): replace

```css
  --inverse: oklch(0.928 0.003 264.5);
  --inverse-fg: oklch(0.173 0.004 264.5);
  --inverse-hover: oklch(0.86 0.004 264.5);
  --inverse-pressed: oklch(0.8 0.005 264.5);
```

with

```css
  --fg-hover: oklch(0.86 0.004 264.5);
  --fg-pressed: oklch(0.8 0.005 264.5);
```

and add `--accent-hover: oklch(0.75 0.11 12);` after the dark `--accent-fg` line and `--danger-hover: oklch(0.76 0.17 37.1);` after the dark `--danger-fg` line.

In `src/styles/theme.css`, replace

```css
  --color-inverse: var(--inverse);
  --color-inverse-fg: var(--inverse-fg);
  --color-inverse-hover: var(--inverse-hover);
  --color-inverse-pressed: var(--inverse-pressed);
```

with

```css
  --color-fg-hover: var(--fg-hover);
  --color-fg-pressed: var(--fg-pressed);
```

and add `--color-accent-hover: var(--accent-hover);` after `--color-accent-fg: var(--accent-fg);` and `--color-danger-hover: var(--danger-hover);` after `--color-danger-fg: var(--danger-fg);`.

In `src/lib/constants/DesignTokens.ts`, replace the four `inverse*` entries with:

```ts
  { token: 'fg-hover', group: 'action', description: 'Primary action fill on hover (bg-fg solid step)' },
  { token: 'fg-pressed', group: 'action', description: 'Primary action fill while pressed' },
```

and add after the `accent-fg` entry:

```ts
  { token: 'accent-hover', group: 'accent', description: 'Solid accent fill on hover' },
```

and after the `danger-fg` entry:

```ts
  { token: 'danger-hover', group: 'status', description: 'Solid danger fill on hover' },
```

In `src/component-docs/foundations/FoundationScales.tsx`, replace `bg-inverse text-inverse-fg` with `bg-fg text-fg-inverse` (line 44) and `bg-inverse text-inverse-fg hover:bg-inverse-hover active:bg-inverse-pressed` with `bg-fg text-fg-inverse hover:bg-fg-hover active:bg-fg-pressed` (line 79).

- [ ] **Step 4: Run tests to verify they pass**

Run: `P exec vp test --run && P exec tsc -b`
Expected: all tests PASS (contrast now includes 5 new pairs per mode + 8 tint pairs); `tsc` exit 0.

Run: `grep -rn "inverse" src --include='*.css' --include='*.tsx' --include='*.ts' | grep -v "fg-inverse"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/theme.css src/lib/constants/DesignTokens.ts src/component-docs/foundations/FoundationScales.tsx tests/design-system/color.ts tests/design-system/color.test.ts tests/design-system/contrast.test.ts
git commit -m "feat(design-system): fold inverse into fg, add solid hover steps, fix status-on-tint contrast

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Prop-migration codemod engine

**Files:**
- Create: `scripts/design-system/codemods/migrate-props.ts`
- Create: `scripts/design-system/codemods/rules.ts`
- Create: `scripts/design-system/codemods/migrate.ts`
- Modify: `package.json` (`scripts.ds:migrate`)
- Test: `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: `listSourceFiles(repoRoot: string): string[]` from `tests/design-system/forbidden-patterns.ts`.
- Produces:
  - `type AttrValue = string | true`
  - `type TagRule = { tag: string; renameTo?: string; importRename?: { source: string; from: string; to: string }; keys: ReadonlyArray<string>; transform: (attrs: Readonly<Record<string, string>>) => Record<string, AttrValue> | 'manual' }`
  - `migrateSource(source: string, rules: ReadonlyArray<TagRule>, file?: string): { output: string; changed: number; manual: string[] }`
  - `RULE_SETS: Record<string, ReadonlyArray<TagRule>>` in `rules.ts` (empty object now; later tasks add keys `button`, `badge`, `tag`, `alert`, `feedback`, `menus`)
  - CLI `P ds:migrate <set>` — rewrites `src/**/*.{tsx,mdx}` (not tests), prints `changed N tags in M files` and every `MANUAL file:line <tag>` entry.

Engine behavior: finds `<Tag` openings followed by whitespace, `/` or `>`; scans to the tag's closing `>` while respecting `{…}` nesting and quoted strings (class strings contain `>`); collects **literal** attributes (`name="value"`) for the rule's `keys`; if any managed key is an expression (`name={…}`) or the transform returns `'manual'`, the tag is reported and its props left untouched; otherwise the managed literal attributes are removed and the transform's output is inserted right after the tag name (`true` → bare attribute). `renameTo` renames the opening tag and every `</Tag>` in the file; `importRename` swaps the identifier inside `import { … } from '<source>'`.

- [ ] **Step 1: Write the failing test**

Create `tests/design-system/codemods/migrate-props.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { migrateSource, type TagRule } from '../../../scripts/design-system/codemods/migrate-props';

const pillRule: TagRule = {
  tag: 'Pill',
  keys: ['variant', 'size'],
  transform: (attrs) => {
    if (attrs.variant === 'weird') return 'manual';
    const out: Record<string, string | true> = {};
    if (attrs.variant === 'loud') out.tone = 'danger';
    if (attrs.size === 'full') out.fullWidth = true;
    return out;
  },
};

describe('migrateSource', () => {
  it('rewrites literal props and keeps everything else', () => {
    const { output, changed } = migrateSource('<Pill variant="loud" size="full" onClick={() => go(a > b)}>Hi</Pill>', [pillRule]);
    expect(output).toBe('<Pill tone="danger" fullWidth onClick={() => go(a > b)}>Hi</Pill>');
    expect(changed).toBe(1);
  });

  it('handles multi-line tags whose class strings contain ">"', () => {
    const source = '<Pill\n  className="[&>svg]:size-4"\n  variant="loud"\n/>';
    // The removed attribute leaves one stray space; `vp fmt` normalizes whitespace after every migration.
    expect(migrateSource(source, [pillRule]).output).toBe('<Pill tone="danger"\n  className="[&>svg]:size-4"\n \n/>');
  });

  it('does not touch tags with a longer name', () => {
    expect(migrateSource('<PillGroup variant="loud" />', [pillRule]).changed).toBe(0);
  });

  it('reports expression-valued managed props as manual', () => {
    const result = migrateSource('<Pill variant={on ? "loud" : "soft"} />', [pillRule], 'a.tsx');
    expect(result.changed).toBe(0);
    expect(result.manual).toEqual(['a.tsx:1 <Pill variant={on ? "loud" : "soft"} />']);
  });

  it('reports transforms that return manual', () => {
    expect(migrateSource('<Pill variant="weird" />', [pillRule], 'b.tsx').manual).toHaveLength(1);
  });

  it('renames tags and imports', () => {
    const rule: TagRule = { ...pillRule, tag: 'Chip', renameTo: 'Tag', importRename: { source: '@components/ui', from: 'Chip', to: 'Tag' } };
    const source = "import { Button, Chip } from '@components/ui';\n<Chip variant=\"loud\">x</Chip>";
    expect(migrateSource(source, [rule]).output).toBe("import { Button, Tag } from '@components/ui';\n<Tag tone=\"danger\">x</Tag>");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run tests/design-system/codemods`
Expected: FAIL — `Cannot find module '../../../scripts/design-system/codemods/migrate-props'`.

- [ ] **Step 3: Implement the engine, rules registry and CLI**

Create `scripts/design-system/codemods/migrate-props.ts`:

```ts
/**
 * Rewrites literal JSX props at call sites according to per-component rules.
 * Expression-valued props and rule-declared edge cases are reported for manual migration.
 */

export type AttrValue = string | true;

export type TagRule = {
  tag: string;
  renameTo?: string;
  importRename?: { source: string; from: string; to: string };
  keys: ReadonlyArray<string>;
  transform: (attrs: Readonly<Record<string, string>>) => Record<string, AttrValue> | 'manual';
};

const QUOTES = new Set(['"', "'", '`']);

function findTagEnd(source: string, from: number): number {
  let depth = 0;
  let quote: string | null = null;

  for (let index = from; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== '\\') quote = null;
      continue;
    }
    if (QUOTES.has(char)) quote = char;
    else if (char === '{') depth++;
    else if (char === '}') depth--;
    else if (char === '>' && depth === 0) return index;
  }

  return -1;
}

/** Replaces everything inside {…} with spaces (same length) so attribute regexes only see top-level syntax. */
function maskExpressions(text: string): string {
  let depth = 0;
  let masked = '';
  for (const char of text) {
    if (char === '{') {
      depth++;
      masked += ' ';
    } else if (char === '}') {
      depth--;
      masked += ' ';
    } else masked += depth > 0 ? ' ' : char;
  }
  return masked;
}

const serialize = (attrs: Record<string, AttrValue>) =>
  Object.entries(attrs)
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${value}"`))
    .join('');

function renameImport(source: string, { source: from, from: oldName, to: newName }: NonNullable<TagRule['importRename']>): string {
  const pattern = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*'${from.replace(/[/@]/g, (c) => `\\${c}`)}'`, 'g');
  return source.replace(pattern, (statement: string, names: string) => {
    const list = names.split(',').map((name) => name.trim()).filter(Boolean);
    if (!list.includes(oldName)) return statement;
    const next = [...new Set(list.map((name) => (name === oldName ? newName : name)))];
    return statement.replace(names, ` ${next.join(', ')} `);
  });
}

export function migrateSource(source: string, rules: ReadonlyArray<TagRule>, file = '<source>'): { output: string; changed: number; manual: string[] } {
  let output = source;
  let changed = 0;
  const manual: string[] = [];

  for (const rule of rules) {
    const opening = new RegExp(`<${rule.tag.replace('.', '\\.')}(?=[\\s/>])`, 'g');
    let match: RegExpExecArray | null;
    let cursor = 0;
    let rebuilt = '';

    while ((match = opening.exec(output))) {
      const headStart = match.index + match[0].length;
      const end = findTagEnd(output, headStart);
      if (end < 0) break;

      const head = output.slice(headStart, end);
      const masked = maskExpressions(head);
      const literal = new Map<string, { value: string; start: number; end: number }>();
      for (const attr of masked.matchAll(/\s([A-Za-z][\w-]*)="([^"]*)"/g)) {
        literal.set(attr[1], { value: attr[2], start: attr.index ?? 0, end: (attr.index ?? 0) + attr[0].length });
      }
      const expressionKeys = [...masked.matchAll(/\s([A-Za-z][\w-]*)=(?=\s)/g)].map((attr) => attr[1]);

      const tagName = rule.renameTo ?? rule.tag;
      const line = output.slice(0, match.index).split('\n').length;
      const managed = Object.fromEntries(rule.keys.filter((key) => literal.has(key)).map((key) => [key, literal.get(key)!.value]));
      const result = rule.keys.some((key) => expressionKeys.includes(key)) ? 'manual' : rule.transform(managed);

      let newHead = head;
      if (result === 'manual') {
        manual.push(`${file}:${line} <${rule.tag}${head.replace(/\s+/g, ' ')}>`);
      } else {
        const removals = rule.keys
          .filter((key) => literal.has(key))
          .map((key) => literal.get(key)!)
          .sort((a, b) => b.start - a.start);
        for (const { start, end: attrEnd } of removals) newHead = newHead.slice(0, start) + newHead.slice(attrEnd);
        newHead = serialize(result) + newHead;
        changed++;
      }

      rebuilt += output.slice(cursor, match.index) + `<${tagName}` + newHead;
      cursor = end;
      opening.lastIndex = end;
    }

    output = rebuilt + output.slice(cursor);
    if (rule.renameTo) {
      output = output.replaceAll(`</${rule.tag}>`, `</${rule.renameTo}>`);
      if (rule.importRename) output = renameImport(output, rule.importRename);
    }
  }

  return { output, changed, manual };
}
```

Create `scripts/design-system/codemods/rules.ts`:

```ts
import type { TagRule } from './migrate-props';

/** Rule sets applied with `pnpm ds:migrate <set>`. Each Plan A task adds its set. */
export const RULE_SETS: Record<string, ReadonlyArray<TagRule>> = {};
```

Create `scripts/design-system/codemods/migrate.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listSourceFiles } from '../../../tests/design-system/forbidden-patterns';
import { migrateSource } from './migrate-props';
import { RULE_SETS } from './rules';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const setName = process.argv[2] ?? '';
const rules = RULE_SETS[setName];

if (!rules) {
  console.error(`Unknown rule set "${setName}". Known: ${Object.keys(RULE_SETS).join(', ') || '(none)'}`);
  process.exit(1);
}

let changedTags = 0;
let changedFiles = 0;
const manual: string[] = [];

for (const file of listSourceFiles(repoRoot)) {
  const path = join(repoRoot, file);
  const source = readFileSync(path, 'utf8');
  const result = migrateSource(source, rules, file);
  manual.push(...result.manual);
  if (result.output !== source) {
    writeFileSync(path, result.output);
    changedTags += result.changed;
    changedFiles++;
  }
}

console.log(`changed ${changedTags} tags in ${changedFiles} files`);
manual.forEach((entry) => console.log(`MANUAL ${entry}`));
```

Modify `package.json` `scripts` — add after `"ds:baseline"`:

```json
    "ds:migrate": "tsx scripts/design-system/codemods/migrate.ts"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `P exec vp test --run tests/design-system/codemods && P exec tsc -p tsconfig.scripts.json`
Expected: PASS (6 tests); tsc exit 0.

Run: `P ds:migrate nope`
Expected: `Unknown rule set "nope". Known: (none)` and exit 1.

- [ ] **Step 5: Commit**

```bash
P exec vp fmt scripts/design-system tests/design-system package.json
git add scripts/design-system/codemods tests/design-system/codemods package.json
git commit -m "build(design-system): add rule-driven JSX prop migration codemod

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Batch 1 — Button + IconButton, root Tooltip provider, full Button-family migration

**Files:**
- Modify: `src/components/ui/button/Button.tsx` (full rewrite)
- Create: `src/components/ui/icon-button/IconButton.tsx`, `src/components/ui/icon-button/index.ts`
- Modify: `src/components/ui/index.ts` (export icon-button)
- Modify: `src/bootstrap.tsx`, `src/bootstrap.test.tsx`
- Modify: `scripts/design-system/codemods/rules.ts` (add `button` set)
- Modify (manual call sites): see the table in Step 7
- Delete: `src/components/shared/{loading-button,form-submit-button,link-button,tooltip-button}/`, their barrel lines in `src/components/shared/index.ts`, and docs `src/component-docs/shared/{LoadingButton,FormSubmitButton,LinkButton}.mdx`, `src/component-docs/ui/TooltipButton.mdx`
- Modify: `src/locales/{en,ar}/common.json`, `src/locales/{en,ar}/components.json`
- Replace: `src/component-docs/ui/Button.mdx`; Create: `src/component-docs/ui/IconButton.mdx`
- Test: `src/components/ui/button/Button.test.tsx`, `src/components/ui/icon-button/IconButton.test.tsx`, `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes (Task 1): Tailwind colors `fg`, `fg-inverse`, `fg-hover`, `fg-pressed`, `accent`, `accent-fg`, `accent-hover`, `danger`, `danger-fg`, `danger-hover`, `border-strong`, `hover`; utilities `focus-ring`, `state-press`, `h-control-*`. (Task 2): `TagRule`, `AttrValue`, `RULE_SETS`, `P ds:migrate`.
- Produces:
  - `Button` (default export) and named `buttonVariants`, `type ButtonVariants = VariantProps<typeof buttonVariants>`, `type ButtonProps` with `variant?: 'solid' | 'outline' | 'ghost' | 'link'`, `tone?: 'neutral' | 'accent' | 'danger'`, `size?: 'sm' | 'md' | 'lg'`, `fullWidth?: boolean`, `loading?: boolean`, `asChild?: boolean`; renders `data-slot="button"`, `data-variant`, `data-tone`.
  - `IconButton` with `IconButtonProps = Omit<ButtonProps, 'aria-label' | 'fullWidth'> & { 'aria-label': string; tooltip?: boolean }` (icon passed as `children`; default `variant="ghost"`; `tooltip` default `true` shows the label in a `Tooltip`).
  - `RULE_SETS.button`, `BUTTON_VARIANTS` in `rules.ts`.
  - i18n keys `common.openCalendar`, `components.gallery.toggleSidebar`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/button/Button.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { MemoryRouter, Link } from 'react-router-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button } from '@components/ui';

afterEach(cleanup);

describe('Button', () => {
  it('defaults to solid / neutral / md', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.dataset.variant).toBe('solid');
    expect(button.dataset.tone).toBe('neutral');
    expect(button.className).toContain('h-control-md');
  });

  it('exposes variant and tone', () => {
    render(
      <Button variant="ghost" tone="danger">
        Remove
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Remove' });
    expect([button.dataset.variant, button.dataset.tone]).toEqual(['ghost', 'danger']);
  });

  it('loading keeps the label, sets aria-busy and blocks resubmits', () => {
    render(
      <Button type="submit" loading>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Save/ });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.querySelector('[data-slot="button-spinner"]')).not.toBeNull();
  });

  it('asChild renders the child element with button styling', () => {
    render(
      <MemoryRouter>
        <Button asChild variant="outline">
          <Link to="/patients">Patients</Link>
        </Button>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Patients' });
    expect(link.getAttribute('href')).toBe('/patients');
    expect(link.dataset.slot).toBe('button');
    expect(link.dataset.variant).toBe('outline');
  });
});
```

Create `src/components/ui/icon-button/IconButton.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { IconButton, Tooltip } from '@components/ui';

afterEach(cleanup);

const Icon = () => <svg aria-hidden="true" />;

/** Compile-time contract: `tsc -b` fails if aria-label stops being required. Never executed. */
export const iconButtonTypeContract = () => (
  <>
    {/* @ts-expect-error aria-label is required */}
    <IconButton>
      <Icon />
    </IconButton>
  </>
);

describe('IconButton', () => {
  it('is a square ghost button named by aria-label', () => {
    render(
      <Tooltip.Provider>
        <IconButton aria-label="Delete">
          <Icon />
        </IconButton>
      </Tooltip.Provider>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.dataset.slot).toBe('icon-button');
    expect(button.dataset.variant).toBe('ghost');
    expect(button.className).toContain('w-control-md');
  });

  it('shows its label as a tooltip on keyboard focus', async () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <IconButton aria-label="Duplicate">
          <Icon />
        </IconButton>
      </Tooltip.Provider>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Duplicate' }));
    expect((await screen.findByRole('tooltip')).textContent).toContain('Duplicate');
  });

  it('asChild renders the child element instead of a nested button', () => {
    render(
      <button type="button">
        Field
        <IconButton asChild tooltip={false} aria-label="Clear">
          <span>×</span>
        </IconButton>
      </button>,
    );
    const clear = screen.getByLabelText('Clear');
    expect(clear.tagName).toBe('SPAN');
    expect(clear.closest('button')?.textContent).toContain('Field');
  });
});
```

Append to `tests/design-system/codemods/migrate-props.test.ts` (add `import { RULE_SETS } from '../../../scripts/design-system/codemods/rules';`):

```ts
describe('button rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.button, 'x.tsx');

  it.each([
    ['<Button variant="default">', '<Button>'],
    ['<Button variant="destructive">', '<Button tone="danger">'],
    ['<Button variant="outline">', '<Button variant="outline">'],
    ['<Button variant="secondary">', '<Button variant="outline">'],
    ['<Button variant="ghost-muted-primary">', '<Button variant="ghost" tone="accent">'],
    ['<Button variant="outline-destructive">', '<Button variant="outline" tone="danger">'],
    ['<Button variant="link">', '<Button variant="link" tone="accent">'],
    ['<Button size="xs">', '<Button size="sm">'],
    ['<Button size="default">', '<Button>'],
    ['<Button size="full">', '<Button fullWidth>'],
    ['<LoadingButton variant="muted" loading>', '<Button variant="outline" loading>'],
  ])('%s → %s', (input, expected) => {
    expect(run(input).output).toBe(expected);
  });

  it('reports icon sizes and unstyled for manual migration', () => {
    expect(run('<Button size="icon">').manual).toHaveLength(1);
    expect(run('<Button variant="unstyled">').manual).toHaveLength(1);
  });

  it('fails loudly on unknown variants', () => {
    expect(() => run('<Button variant="sparkly">')).toThrow('Unknown Button variant "sparkly"');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/button src/components/ui/icon-button tests/design-system/codemods`
Expected: FAIL — `data-variant` undefined on the old Button; `IconButton` is not exported; `RULE_SETS.button` is undefined.

- [ ] **Step 3: Rewrite Button**

Replace `src/components/ui/button/Button.tsx` with:

```tsx
import { type ComponentProps, type FC, forwardRef } from 'react';

import { Slot, Slottable } from '@radix-ui/react-slot';

import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Loader2Icon } from 'lucide-react';

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent font-medium whitespace-nowrap select-none',
    'focus-ring state-press [&_svg]:size-4 [&_svg]:shrink-0',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        solid: '',
        outline: 'bg-transparent',
        ghost: 'bg-transparent',
        link: 'h-auto! px-0! underline-offset-4 hover:underline',
      },
      tone: {
        neutral: '',
        accent: '',
        danger: '',
      },
      size: {
        sm: 'h-control-sm px-2.5 text-xs',
        md: 'h-control-md px-3 text-sm',
        lg: 'h-control-lg px-4 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'solid', tone: 'neutral', className: 'bg-fg text-fg-inverse hover:bg-fg-hover active:bg-fg-pressed' },
      { variant: 'solid', tone: 'accent', className: 'bg-accent text-accent-fg hover:bg-accent-hover' },
      { variant: 'solid', tone: 'danger', className: 'bg-danger text-danger-fg hover:bg-danger-hover' },
      { variant: 'outline', tone: 'neutral', className: 'border-border-strong text-fg hover:bg-hover' },
      { variant: 'outline', tone: 'accent', className: 'border-accent text-accent hover:bg-hover' },
      { variant: 'outline', tone: 'danger', className: 'border-danger text-danger hover:bg-hover' },
      { variant: 'ghost', tone: 'neutral', className: 'text-fg-muted hover:bg-hover hover:text-fg' },
      { variant: 'ghost', tone: 'accent', className: 'text-accent hover:bg-hover' },
      { variant: 'ghost', tone: 'danger', className: 'text-danger hover:bg-hover' },
      { variant: 'link', tone: 'neutral', className: 'text-fg' },
      { variant: 'link', tone: 'accent', className: 'text-accent' },
      { variant: 'link', tone: 'danger', className: 'text-danger' },
    ],
    defaultVariants: {
      variant: 'solid',
      tone: 'neutral',
      size: 'md',
      fullWidth: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = ComponentProps<'button'> &
  ButtonVariants & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button: FC<ButtonProps> = ({
  ref,
  className,
  variant,
  tone,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const Comp = asChild ? Slot : 'button';
  const isDisabled = Boolean(disabled) || loading;

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant ?? 'solid'}
      data-tone={tone ?? 'neutral'}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      disabled={asChild ? undefined : isDisabled}
      className={cn(buttonVariants({ variant, tone, size, fullWidth }), className)}
      {...props}
    >
      <Conditional.If condition={loading}>
        <Loader2Icon data-slot="button-spinner" className="animate-spin" aria-label={t('loading')} />
      </Conditional.If>

      <Slottable>{children}</Slottable>
    </Comp>
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => Button({ ...props, ref }));
```

Check `src/components/ui/button/index.ts` still re-exports the default as `Button` plus `buttonVariants`, `ButtonProps`, `ButtonVariants` (it already exports `* from './Button'` and the default; keep it).

- [ ] **Step 4: Create IconButton and the root Tooltip provider**

Create `src/components/ui/icon-button/IconButton.tsx`:

```tsx
import { type FC, forwardRef } from 'react';

import { Button, type ButtonProps, Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

export type IconButtonProps = Omit<ButtonProps, 'aria-label' | 'fullWidth'> & {
  'aria-label': string;
  tooltip?: boolean;
};

const SQUARE_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-control-sm',
  md: 'w-control-md',
  lg: 'w-control-lg',
};

const IconButton: FC<IconButtonProps> = ({ ref, variant = 'ghost', size, tooltip = true, className, ...props }) => {
  const button = (
    <Button
      ref={ref}
      data-slot="icon-button"
      variant={variant}
      size={size}
      className={cn(SQUARE_SIZE[size ?? 'md'], 'px-0', className)}
      {...props}
    />
  );

  return (
    <Conditional.If condition={tooltip} fallback={button}>
      <Tooltip>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>

        <Tooltip.Content>{props['aria-label']}</Tooltip.Content>
      </Tooltip>
    </Conditional.If>
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => IconButton({ ...props, ref }));
```

Create `src/components/ui/icon-button/index.ts`:

```ts
export { default as IconButton } from './IconButton';
export * from './IconButton';
```

In `src/components/ui/index.ts`, add `export * from './icon-button';` directly after `export * from './button';`.

In `src/bootstrap.tsx`, add `import { Tooltip } from '@components/ui';` after the `@contexts` import and wrap the router:

```tsx
            <NuqsAdapter>
              <Tooltip.Provider delayDuration={300}>
                <RouterProvider router={ROUTER} future={{ v7_startTransition: true }} />
              </Tooltip.Provider>
            </NuqsAdapter>
```

In `src/bootstrap.test.tsx`, add after the `@contexts` mock:

```tsx
vi.mock('@components/ui', () => ({
  Tooltip: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));
```

- [ ] **Step 5: Add the button rule set**

Replace `scripts/design-system/codemods/rules.ts` with:

```ts
import type { AttrValue, TagRule } from './migrate-props';

/** Old Button variant → new { variant, tone } (addendum §5). Omitted keys mean the defaults (solid / neutral). */
export const BUTTON_VARIANTS: Readonly<Record<string, { variant?: 'outline' | 'ghost' | 'link'; tone?: 'accent' | 'danger' }>> = {
  default: {},
  icon: {},
  success: {},
  destructive: { tone: 'danger' },
  outline: { variant: 'outline' },
  secondary: { variant: 'outline' },
  muted: { variant: 'outline' },
  'outline-muted': { variant: 'outline' },
  'outline-success': { variant: 'outline' },
  'surface-primary': { variant: 'outline', tone: 'accent' },
  'outline-destructive': { variant: 'outline', tone: 'danger' },
  ghost: { variant: 'ghost' },
  'ghost-muted': { variant: 'ghost' },
  'soft-muted': { variant: 'ghost' },
  'ghost-primary': { variant: 'ghost', tone: 'accent' },
  'ghost-muted-primary': { variant: 'ghost', tone: 'accent' },
  'soft-primary': { variant: 'ghost', tone: 'accent' },
  'quiet-primary': { variant: 'ghost', tone: 'accent' },
  'ghost-destructive': { variant: 'ghost', tone: 'danger' },
  'ghost-muted-destructive': { variant: 'ghost', tone: 'danger' },
  link: { variant: 'link', tone: 'accent' },
};

const BUTTON_SIZES: Readonly<Record<string, 'sm' | 'lg' | null>> = { xs: 'sm', sm: 'sm', default: null, lg: 'lg' };

const MANUAL_BUTTON_SIZES = new Set(['icon', 'icon-sm', 'unstyled']);

const buttonRule = (tag: string, renameTo?: string): TagRule => ({
  tag,
  renameTo,
  keys: ['variant', 'size'],
  transform: (attrs) => {
    if (MANUAL_BUTTON_SIZES.has(attrs.size ?? '') || attrs.variant === 'unstyled') return 'manual';

    const mapped = BUTTON_VARIANTS[attrs.variant ?? 'default'];
    if (!mapped) throw new Error(`Unknown Button variant "${attrs.variant}"`);

    const out: Record<string, AttrValue> = {};
    if (mapped.variant) out.variant = mapped.variant;
    if (mapped.tone) out.tone = mapped.tone;

    if (attrs.size === 'full') out.fullWidth = true;
    else if (attrs.size !== undefined) {
      if (!(attrs.size in BUTTON_SIZES)) throw new Error(`Unknown Button size "${attrs.size}"`);
      const size = BUTTON_SIZES[attrs.size];
      if (size) out.size = size;
    }

    return out;
  },
});

/** Rule sets applied with `pnpm ds:migrate <set>`. Each Plan A task adds its set. */
export const RULE_SETS: Record<string, ReadonlyArray<TagRule>> = {
  button: [buttonRule('Button'), buttonRule('LoadingButton', 'Button')],
};
```

Run: `P exec vp test --run src/components/ui/button src/components/ui/icon-button tests/design-system/codemods`
Expected: PASS (Button 4, IconButton 3, codemod 6 + 13).

- [ ] **Step 6: Run the codemod**

Run: `P ds:migrate button`
Expected: `changed 180 tags in 22 files` followed by 30 `MANUAL` lines (they are exactly the rows of the table in Step 7, plus `CalendarPicker.mdx:154`, `Button.mdx`, `FormSubmitButton.tsx` and `ConfirmDialog.tsx:227`, which Step 7/8 also cover).

- [ ] **Step 7: Migrate the manual call sites**

Apply each row (line numbers are pre-codemod; the codemod does not change line counts). "IconButton" means: rename the opening and closing tag to `IconButton`, delete `size="icon"` (→ default `md`) or `size="icon-sm"`/`size="unstyled"` (→ `size="sm"`), map `variant` with the Button table (`ghost` is IconButton's default and may be omitted), remove `title`, keep every other prop, and add `IconButton` to the file's `@components/ui` import (remove `Button`/`TooltipButton` imports that become unused).

| # | Call site | Becomes |
|---|---|---|
| 1 | `src/component-docs/gallery/sidebar-panel/SidebarPanel.tsx:18`, `:34`, `:104` (`variant="unstyled" size="unstyled"`) | native `<button type="button" …>` keeping `ref`, `onClick`, `aria-pressed`, `data-*` and `className`; drop `variant`/`size`; closing tags `</button>` |
| 2 | `src/component-docs/hooks/UseRowEditing.mdx:132`, `:136`, `:144`, `:155` | `IconButton` (keep their `aria-label`s); add `IconButton` to the MDX `import { … } from '@components/ui'` line |
| 3 | `src/component-docs/shared/PrimeDropdown.mdx:38` | `<IconButton variant="outline" aria-label="Settings">` |
| 4 | `src/component-docs/tables/DataTable.mdx:277` | `<IconButton size="sm" aria-label="Row actions">` |
| 5 | `src/components/forms/form-multi-combobox/FormMultiCombobox.tsx:167` | `<IconButton asChild tone="danger" size="sm" tooltip={false} aria-label="Clear" …>` (keep `onPointerDown`/`onClick`) |
| 6 | `src/components/shared/action-panel/ActionPanel.tsx:50` | `<IconButton size="sm" className={cn(className)} aria-label={t('goBack')} onClick={handleClick} {...props}>` |
| 7 | `src/components/shared/date-navigation/DateNavigation.tsx:18`, `:22` | `<IconButton variant="outline" aria-label={t('previous')} onClick={handlePrevious}>` / `aria-label={t('next')} onClick={handleNext}`; delete `className="md:h-9 md:w-9 md:py-2"`; add `import { useAppTranslation } from '@hooks/shared';` and `const { t } = useAppTranslation('common');` as the component's first hook |
| 8 | `src/components/shared/file-uploader/FileUploader.tsx:228`, `:255` | `<IconButton … tone="danger" size="sm" tooltip={false} type="button" aria-label={t('clear')} onClick={…}>` (`:228` keeps `className="shrink-0"`) |
| 9 | `src/components/shared/file-uploader/FileUploader.tsx:312` | `<IconButton className="absolute inset-e-1 inset-bs-1 hidden group-hover/file-uploader-image-preview:flex" variant="outline" tone="danger" size="sm" tooltip={false} type="button" aria-label={t('clear')} onClick={…}>` |
| 10 | `src/components/shared/language-switcher/LanguageSwitcher.tsx:14` | `IconButton` with `aria-label={t('switchLanguage')}`; drop `title`; keep `className` and the language-code child |
| 11 | `src/components/shared/theme-switcher/ThemeSwitcher.tsx:17` | `IconButton` (keep `aria-label`, `className`, children) |
| 12 | `src/components/ui/calendar/Calendar.tsx:26` (day cell) | native `<button type="button" …>` keeping all `data-*` and the `cn(...)` className, with `'inline-flex size-8 items-center justify-center rounded-full'` prepended as the first `cn` argument; drop `variant`/`size`; remove `Button` from the file's `@components/ui` import (it still imports `buttonVariants`, `Select`) |
| 13 | `src/layouts/dashboard-header/DashboardHeader.tsx:46` | `<IconButton className="relative" aria-label={t('notifications')}>` |
| 14 | `src/layouts/dashboard-sidebar-drawer/DashboardSidebarDrawer.tsx:21` | `<IconButton className={cn('md:hidden', props.className)} onClick={props.onCollapse} aria-label={…existing…}>` |
| 15 | `src/layouts/dashboard-sidebar-drawer/DashboardSidebarDrawer.tsx:37` | `<IconButton variant="outline" size="sm" className={cn('bg-surface absolute -inset-e-4 top-20 z-50 hidden rounded-full …rest of the existing classes minus h-8 w-8, bg-background, border-border, text-muted-foreground, hover:bg-hover, hover:text-foreground…', props.className)} …>` |
| 16 | `src/pages/components/ComponentsGalleryPage.tsx:145` | `<IconButton size="sm" aria-label={t('gallery.toggleSidebar')} onClick={toggleSidebar} className="mt-1">` |
| 17 | `src/component-docs/calendar/CalendarGrid.mdx:185`, `:189`, `:503` (`TooltipButton`) | `<IconButton size="sm" type="button" aria-label="Reschedule" onClick={onClose}>` / `aria-label="Close"` (×2); fix the MDX import |
| 18 | `src/components/calendar/calendar-grid/calendar-grid-chrome/CalendarGridChrome.tsx:41`, `:47` (`TooltipButton`) | `<IconButton size="sm" type="button" aria-label="Previous" onClick={goPrev}>` / `aria-label="Next" onClick={goNext}` |
| 19 | `src/components/calendar/calendar-picker/CalendarPicker.tsx:209` (`TooltipButton`) | `<IconButton size="sm" type="button" aria-label={triggerTooltip ?? t('openCalendar')}>`; add `useAppTranslation('common')` hook + import |
| 20 | `src/components/forms/form-date-picker/FormDatePicker.tsx:238`, `src/components/forms/form-date-range/FormDateRange.tsx:255` (`TooltipButton`) | `<IconButton tabIndex={-1} tone="danger" size="sm" aria-label="Clear" onClick={handleClear}>` |
| 21 | `src/components/forms/form-select/FormSelect.tsx:94`, `src/components/ui/time-picker/TimePicker.tsx:75` (`TooltipButton asChild`) | `<IconButton asChild tone="danger" size="sm" aria-label="Clear" …>` (keep handlers) |
| 22 | `src/components/shared/combobox/Combobox.tsx:88` (`TooltipButton asChild title={title}`) | `<IconButton asChild tone="danger" size="sm" aria-label={title ?? 'Clear'} …>` |
| 23 | `src/components/shared/file-card/FileCard.tsx:141` (`TooltipButton`) | `<IconButton size="sm" type="button" aria-label={t('actions')}>` |
| 24 | `src/components/shared/file-uploader/FileUploader.tsx:193`, `:199` (`TooltipButton asChild`) | `<IconButton asChild size="sm" type="button" aria-label={t('download')} onClick={onDownload}>` / `<IconButton asChild tone="danger" size="sm" type="button" aria-label={t('clear')} onClick={…}>` |
| 25 | `src/pages/components/components.data.demos.tsx:595`, `:608`, `:613` (`TooltipButton`) | `<IconButton variant="outline" aria-label="Confirm">` / `<IconButton variant="outline" tone="danger" aria-label="Delete">` / `<Button onClick={onSubmit}>Submit Form</Button>`; remove `TooltipButton` from its `@components/shared` import |
| 26 | `src/component-docs/calendar/CalendarPicker.mdx:154` | no change — `variant={value ? 'outline' : 'ghost'}` is valid in the new API |

Add i18n keys:
- `src/locales/en/common.json`: `"openCalendar": "Open calendar"`; `src/locales/ar/common.json`: `"openCalendar": "فتح التقويم"`.
- `src/locales/en/components.json` under `gallery`: `"toggleSidebar": "Toggle sidebar"`; `src/locales/ar/components.json` under `gallery`: `"toggleSidebar": "إظهار أو إخفاء الشريط الجانبي"`.

- [ ] **Step 8: Remove the wrappers and fix their remaining users**

- `src/components/shared/confirm-dialog/ConfirmDialog.tsx`:
  - line 5 → `import { Button, type ButtonVariants, Dialog } from '@components/ui';`; delete line 7 (`import { LoadingButton } from '@components/shared';`).
  - replace `primaryVariant?: ButtonVariants['variant'];` with `primaryTone?: ButtonVariants['tone'];` and its JSDoc `@see` target with `confirmDialogVariantToButtonToneMapping`.
  - replace the mapping with:

    ```ts
    const confirmDialogVariantToButtonToneMapping: Record<ConfirmDialogVariant, ButtonVariants['tone']> = {
      destructive: 'danger',
      success: 'neutral',
      warning: 'neutral',
      info: 'neutral',
    };
    ```
  - rename the destructured prop `primaryVariant` → `primaryTone` and the JSDoc "Override with `primaryVariant`" → "Override with `primaryTone`".
  - line 227 → `tone={primaryTone ?? confirmDialogVariantToButtonToneMapping[variant]}` (replacing the `variant={…}` expression).
- `src/components/shared/prime-dialog/PrimeDialog.tsx`: line 3 → `import { Button, type ButtonProps, Dialog } from '@components/ui';`; delete line 5; replace both `Omit<LoadingButtonProps, 'loading'>` with `Omit<ButtonProps, 'loading'>`.
- `src/components/shared/form-submit-buttons/FormSubmitButtons.tsx`: line 5 → `import { ConfirmDialog } from '@components/shared';`; replace the `<FormSubmitButton … />` element (lines 65–70) with:

  ```tsx
          <Button type="submit" className="lg:ms-0" size="lg" loading={props.defaultPrimaryLoading}>
            {props.defaultPrimaryText || (props.defaultPrimaryCreateUpdate ? 'Update' : 'Create')}
          </Button>
  ```
- Delete `src/components/shared/loading-button/`, `src/components/shared/form-submit-button/`, `src/components/shared/link-button/`, `src/components/shared/tooltip-button/`, and remove their four `export * from './…';` lines from `src/components/shared/index.ts`.
- Delete `src/component-docs/shared/LoadingButton.mdx`, `src/component-docs/shared/FormSubmitButton.mdx`, `src/component-docs/shared/LinkButton.mdx`, `src/component-docs/ui/TooltipButton.mdx`.
- In `src/component-docs/shared/ConfirmDialog.mdx`, replace every `primaryVariant` with `primaryTone` (and any example value such as `"destructive"` with `"danger"`).

Run: `grep -rn "LoadingButton\|FormSubmitButton\b\|LinkButton\|TooltipButton\|size=\"icon\|size=\"unstyled\|variant=\"unstyled" src`
Expected: no output.

- [ ] **Step 9: Replace the Button docs and add IconButton docs**

Replace `src/component-docs/ui/Button.mdx` with:

````mdx
---
id: button
title: Button
section: Components
category: UI
description: 'Actions with three weights (solid, outline, ghost, link) and three tones (neutral, accent, danger).'
tags: [ui, button, actions]
---

import { Button } from '@components/ui';

## Demo

<div className="grid gap-4">
  <div className="flex flex-wrap items-center gap-2">
    <Button>Save</Button>
    <Button tone="accent">Approve</Button>
    <Button tone="danger">Delete</Button>
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="outline">Export</Button>
    <Button variant="outline" tone="accent">Assign</Button>
    <Button variant="outline" tone="danger">Revoke</Button>
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="ghost">Cancel</Button>
    <Button variant="ghost" tone="accent">Details</Button>
    <Button variant="ghost" tone="danger">Remove</Button>
    <Button variant="link" tone="accent">View chart</Button>
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <Button size="sm">Small</Button>
    <Button>Medium</Button>
    <Button size="lg">Large</Button>
    <Button loading>Saving</Button>
    <Button disabled>Disabled</Button>
  </div>
  <Button fullWidth>Full width</Button>
</div>

## Choosing variant and tone

- **`variant` is visual weight.** One `solid` button per view for the primary action; `outline` for secondary actions; `ghost` for low-emphasis and toolbar actions; `link` for inline navigation.
- **`tone` is meaning.** `neutral` (default) for ordinary actions, `accent` for the Oxblood brand action, `danger` for destructive ones. Success-colored buttons do not exist — a successful action is just the primary action.
- **Icon-only actions use `IconButton`**, which requires an `aria-label` and shows it as a tooltip.
- Use `asChild` to render a router `Link` with button styling. Use `className` only for layout (width, margin, position), never for color.

## Imports

```tsx
import { Button } from '@components/ui';
```

## Code

```tsx
<Button>Save</Button>
<Button tone="accent">Approve</Button>
<Button variant="outline" tone="danger">Revoke</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="link" tone="accent">View chart</Button>
<Button size="sm" loading>Saving</Button>
<Button type="submit" loading={isSubmitting}>Save</Button>
<Button asChild variant="outline">
  <Link to="/patients">Patients</Link>
</Button>
```
````

Create `src/component-docs/ui/IconButton.mdx`:

````mdx
---
id: icon-button
title: IconButton
section: Components
category: UI
description: 'Square icon-only action with a required accessible label that doubles as its tooltip.'
tags: [ui, button, icon, actions, tooltip]
---

import { IconButton } from '@components/ui';
import { Copy, Pencil, Trash2 } from 'lucide-react';

## Demo

<div className="flex flex-wrap items-center gap-2">
  <IconButton size="sm" aria-label="Edit">
    <Pencil />
  </IconButton>
  <IconButton variant="outline" aria-label="Duplicate">
    <Copy />
  </IconButton>
  <IconButton variant="solid" tone="danger" size="lg" aria-label="Delete">
    <Trash2 />
  </IconButton>
</div>

## Rules

- `aria-label` is required by the type and becomes the tooltip text; pass `tooltip={false}` only when the button sits inside another trigger.
- Same `variant` / `tone` / `size` as `Button`; the default variant is `ghost`.
- Use `asChild` (with `tooltip={false}`) when the icon must render as a non-button element inside another button, such as a field's clear control.

## Imports

```tsx
import { IconButton } from '@components/ui';
```

## Code

```tsx
<IconButton aria-label="Edit">
  <Pencil />
</IconButton>
<IconButton variant="outline" tone="danger" aria-label="Delete">
  <Trash2 />
</IconButton>
```
````

- [ ] **Step 10: Verify**

Run: `P exec vp fmt src scripts tests && P exec tsc -b && P exec vp test --run && P docs:lint`
Expected: tsc exit 0 (proves no call site uses a removed variant/size or a deleted wrapper); all tests PASS; `Component docs lint passed`.

Run: `P ds:baseline`
Expected: `Wrote … violations` (counts drop: every `removed-button-variant` disappears, `prime-component` is unchanged). Then `P exec vp test --run tests/design-system/forbidden-patterns.test.ts` → PASS.

Run: `P exec vp check`
Expected: `Found 0 errors`, warning count not higher than before this task.

- [ ] **Step 11: Commit**

```bash
git add -A src scripts tests/design-system
git commit -m "feat(ui): Button variant × tone × size API, IconButton, root tooltip provider

Migrates all Button call sites (codemod + manual table), removes LoadingButton,
FormSubmitButton, LinkButton and TooltipButton.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Batch 2 — Badge (and FileCard.StatusPill → Badge)

**Files:**
- Modify: `src/components/ui/badge/Badge.tsx` (full rewrite)
- Modify: `src/components/shared/file-card/FileCard.tsx` (`StatusPill: typeof Chip;` → `typeof Badge`, `FileCard.StatusPill = Chip;` → `Badge`, import)
- Modify (manual): `src/pages/members/MembersPage.tsx:51-55,123`
- Modify: `scripts/design-system/codemods/rules.ts` (add `badge` set)
- Modify: `src/component-docs/ui/Badge.mdx`, `src/component-docs/shared/FileCard.mdx` (prose)
- Test: `src/components/ui/badge/Badge.test.tsx`, `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens; Task 2 engine.
- Produces: `Badge` with `variant?: 'dot' | 'soft'` (default `dot`), `tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'` (default `neutral`), `size?: 'sm' | 'md'` (default `md`); renders `<span data-slot="badge" data-variant data-tone>`; `badgeVariants`, `BadgeProps`, `BadgeVariants`. `RULE_SETS.badge` (rules for `Badge` and `FileCard.StatusPill`).

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/badge/Badge.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Badge } from '@components/ui';

afterEach(cleanup);

describe('Badge', () => {
  it('defaults to a neutral dot badge', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect([badge.dataset.variant, badge.dataset.tone]).toEqual(['dot', 'neutral']);
    expect(badge.querySelector('[data-slot="badge-dot"]')).not.toBeNull();
  });

  it('soft badges have no dot and carry their tone', () => {
    render(
      <Badge variant="soft" tone="danger">
        Overdue
      </Badge>,
    );
    const badge = screen.getByText('Overdue');
    expect(badge.dataset.tone).toBe('danger');
    expect(badge.querySelector('[data-slot="badge-dot"]')).toBeNull();
    expect(badge.className).toContain('bg-danger-subtle');
  });

  it('sizes map to the scale', () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small').className).toContain('h-5');
  });
});
```

Append to `tests/design-system/codemods/migrate-props.test.ts`:

```ts
describe('badge rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.badge, 'x.tsx').output;

  it.each([
    ['<Badge variant="default">', '<Badge>'],
    ['<Badge variant="muted" size="xs">', '<Badge size="sm">'],
    ['<Badge variant="destructive" size="lg">', '<Badge tone="danger" size="md">'],
    ['<Badge variant="accent">', '<Badge tone="accent">'],
    ['<FileCard.StatusPill variant="success">', '<FileCard.StatusPill variant="soft" tone="success">'],
    ['<FileCard.StatusPill variant="destructive">', '<FileCard.StatusPill variant="soft" tone="danger">'],
    ['<FileCard.StatusPill variant="default">', '<FileCard.StatusPill variant="soft" tone="accent">'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/badge tests/design-system/codemods`
Expected: FAIL — `data-variant` undefined; `RULE_SETS.badge` undefined.

- [ ] **Step 3: Implement**

Replace `src/components/ui/badge/Badge.tsx` with:

```tsx
import { type ComponentPropsWithoutRef } from 'react';

import { Conditional } from '@components/utils';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

export const badgeVariants = cva('inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium whitespace-nowrap', {
  variants: {
    variant: {
      dot: 'border-border text-fg border',
      soft: '',
    },
    tone: {
      neutral: '',
      accent: '',
      success: '',
      warning: '',
      danger: '',
      info: '',
    },
    size: {
      sm: 'h-5 px-1.5 text-2xs',
      md: 'h-5.5 px-2 text-xs',
    },
  },
  compoundVariants: [
    { variant: 'dot', tone: 'neutral', className: '*:data-[slot=badge-dot]:bg-fg-muted' },
    { variant: 'dot', tone: 'accent', className: '*:data-[slot=badge-dot]:bg-accent' },
    { variant: 'dot', tone: 'success', className: '*:data-[slot=badge-dot]:bg-success' },
    { variant: 'dot', tone: 'warning', className: '*:data-[slot=badge-dot]:bg-warning' },
    { variant: 'dot', tone: 'danger', className: '*:data-[slot=badge-dot]:bg-danger' },
    { variant: 'dot', tone: 'info', className: '*:data-[slot=badge-dot]:bg-info' },
    { variant: 'soft', tone: 'neutral', className: 'bg-surface-sunken text-fg' },
    { variant: 'soft', tone: 'accent', className: 'bg-accent-subtle text-accent' },
    { variant: 'soft', tone: 'success', className: 'bg-success-subtle text-success' },
    { variant: 'soft', tone: 'warning', className: 'bg-warning-subtle text-warning' },
    { variant: 'soft', tone: 'danger', className: 'bg-danger-subtle text-danger' },
    { variant: 'soft', tone: 'info', className: 'bg-info-subtle text-info' },
  ],
  defaultVariants: {
    variant: 'dot',
    tone: 'neutral',
    size: 'md',
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export type BadgeProps = ComponentPropsWithoutRef<'span'> & BadgeVariants;

const Badge = ({ className, variant, tone, size, children, ...props }: BadgeProps) => (
  <span
    data-slot="badge"
    data-variant={variant ?? 'dot'}
    data-tone={tone ?? 'neutral'}
    className={cn(badgeVariants({ variant, tone, size }), className)}
    {...props}
  >
    <Conditional.If condition={(variant ?? 'dot') === 'dot'}>
      <span data-slot="badge-dot" aria-hidden="true" className="size-1.5 shrink-0 rounded-full" />
    </Conditional.If>

    {children}
  </span>
);

export default Badge;
```

In `scripts/design-system/codemods/rules.ts`, add above `RULE_SETS`:

```ts
const BADGE_TONES: Readonly<Record<string, string | null>> = {
  default: null,
  secondary: null,
  muted: null,
  neutral: null,
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  destructive: 'danger',
};

const BADGE_SIZES: Readonly<Record<string, 'sm' | 'md'>> = { default: 'sm', xs: 'sm', sm: 'sm', md: 'md', lg: 'md' };

/** Chip variants (also used by FileCard.StatusPill) → tone. */
const CHIP_TONES: Readonly<Record<string, string | null>> = {
  default: 'accent',
  secondary: null,
  muted: null,
  success: 'success',
  destructive: 'danger',
  warning: 'warning',
  accent: 'info',
};

const CHIP_SIZES: Readonly<Record<string, 'sm' | 'md'>> = { xxs: 'sm', xs: 'sm', sm: 'sm', default: 'md', md: 'md', lg: 'md' };

const lookup = <T,>(table: Readonly<Record<string, T>>, value: string, label: string): T => {
  if (!(value in table)) throw new Error(`Unknown ${label} "${value}"`);
  return table[value];
};

const badgeRule: TagRule = {
  tag: 'Badge',
  keys: ['variant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    const tone = lookup(BADGE_TONES, attrs.variant ?? 'default', 'Badge variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) out.size = lookup(BADGE_SIZES, attrs.size, 'Badge size');
    return out;
  },
};

const statusPillRule: TagRule = {
  tag: 'FileCard.StatusPill',
  keys: ['variant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = { variant: 'soft' };
    const tone = lookup(CHIP_TONES, attrs.variant ?? 'default', 'StatusPill variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) out.size = lookup(CHIP_SIZES, attrs.size, 'StatusPill size');
    return out;
  },
};
```

and add `badge: [badgeRule, statusPillRule],` to `RULE_SETS`.

In `src/components/shared/file-card/FileCard.tsx`: replace `Chip` with `Badge` in its `@components/ui` import, in `StatusPill: typeof Chip;` and in `FileCard.StatusPill = Chip;`.

- [ ] **Step 4: Migrate and update docs**

Run: `P ds:migrate badge`
Expected: `changed 36 tags in 3 files` and one `MANUAL src/pages/members/MembersPage.tsx:123 <Badge variant={STATUS_VARIANT[…]}>`.

Fix `src/pages/members/MembersPage.tsx`: replace the map at lines 51–55 with

```ts
const STATUS_TONE: Record<Member['status'], 'success' | 'warning' | 'danger'> = {
  Active: 'success',
  Invited: 'warning',
  Suspended: 'danger',
};
```

and line 123's `<Badge variant={STATUS_VARIANT[row.original.status]}>` with `<Badge tone={STATUS_TONE[row.original.status]}>`.

In `src/component-docs/ui/Badge.mdx`, replace the description frontmatter with `description: 'Static status label: a tone dot (default) or a soft tint; never interactive — use Tag for that.'` and, under `## Demo`, make sure the rendered set covers every tone in both variants:

```mdx
<div className="flex flex-wrap gap-2">
  <Badge>Draft</Badge>
  <Badge tone="accent">Assigned</Badge>
  <Badge tone="success">Active</Badge>
  <Badge tone="warning">Pending</Badge>
  <Badge tone="danger">Overdue</Badge>
  <Badge tone="info">Referred</Badge>
</div>
<div className="flex flex-wrap gap-2">
  <Badge variant="soft">Draft</Badge>
  <Badge variant="soft" tone="accent">Assigned</Badge>
  <Badge variant="soft" tone="success">Active</Badge>
  <Badge variant="soft" tone="warning">Pending</Badge>
  <Badge variant="soft" tone="danger">Overdue</Badge>
  <Badge variant="soft" tone="info">Referred</Badge>
  <Badge variant="soft" tone="success" size="sm">sm</Badge>
</div>
```

In `src/component-docs/shared/FileCard.mdx` line 344, replace the StatusPill table row text with `| \`<FileCard.StatusPill>\` | alias of \`Badge\` | Soft status badge: \`tone\` (neutral / accent / success / warning / danger / info) and \`size\` (sm / md) |`.

- [ ] **Step 5: Run tests and verify**

Run: `P exec vp fmt src scripts tests && P exec vp test --run && P exec tsc -b && P docs:lint && P ds:baseline`
Expected: tests PASS; tsc 0; docs lint passes; baseline written. Then `P exec vp test --run tests/design-system/forbidden-patterns.test.ts` → PASS and `node -e "const b=require('./tests/design-system/forbidden-patterns.baseline.json');console.log(Object.keys(b).filter(f=>f.startsWith('src/components/ui/badge/')))"` → `[]`.

- [ ] **Step 6: Commit**

```bash
git add -A src scripts tests/design-system
git commit -m "feat(ui): Badge dot/soft × tone API; FileCard.StatusPill becomes a soft Badge

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Batch 2 — Tag replaces Chip

**Files:**
- Create: `src/components/ui/tag/Tag.tsx`, `src/components/ui/tag/index.ts`
- Modify: `src/components/ui/index.ts` (`export * from './chip';` → `export * from './tag';`)
- Delete: `src/components/ui/chip/`, `src/component-docs/ui/Chip.mdx`
- Create: `src/component-docs/ui/Tag.mdx`
- Modify: `src/locales/{en,ar}/common.json`
- Modify: `scripts/design-system/codemods/rules.ts` (add `tag` set)
- Modify (manual): `src/component-docs/gallery/sidebar-panel/SidebarPanel.tsx:19`, `src/pages/components/ComponentsGalleryPage.tsx:162`
- Test: `src/components/ui/tag/Tag.test.tsx`, `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: Task 4 `CHIP_TONES`, `CHIP_SIZES`, `lookup` in `rules.ts`; Task 1 tokens.
- Produces: `Tag` with `TagProps = ToggleTagProps | RemovableTagProps` where both share `tone?` (as Badge), `size?: 'sm' | 'md'` (default `md`), `children: ReactNode`; toggle: `onClick?: MouseEventHandler<HTMLButtonElement>`, `selected?: boolean`; removable: `onRemove: () => void`. Renders `data-slot="tag"`; the remove control has `data-slot="tag-remove"`. i18n `common.remove`, `common.removeItem`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/tag/Tag.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tag } from '@components/ui';

// i18n has no path alias (it lives at the src root); load real English strings for accessible names.
import '../../../i18n';

afterEach(cleanup);

describe('Tag', () => {
  it('renders a static tag as a span', () => {
    render(<Tag>Asthma</Tag>);
    expect(screen.getByText('Asthma').tagName).toBe('SPAN');
  });

  it('a removable tag names what it removes and calls onRemove', () => {
    const handleRemove = vi.fn();
    render(<Tag onRemove={handleRemove}>Penicillin</Tag>);
    const remove = screen.getByRole('button', { name: 'Remove Penicillin' });
    fireEvent.click(remove);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('a toggle tag is a button exposing aria-pressed', () => {
    render(
      <Tag selected onClick={() => undefined}>
        Cardiology
      </Tag>,
    );
    expect(screen.getByRole('button', { name: 'Cardiology' }).getAttribute('aria-pressed')).toBe('true');
  });
});
```

Append to `tests/design-system/codemods/migrate-props.test.ts`:

```ts
describe('tag rules', () => {
  it('renames Chip to Tag with tones and sizes', () => {
    const source = "import { Chip } from '@components/ui';\n<Chip variant=\"muted\" size=\"xs\">a</Chip>\n<Chip variant=\"default\">b</Chip>";
    expect(migrateSource(source, RULE_SETS.tag).output).toBe(
      "import { Tag } from '@components/ui';\n<Tag size=\"sm\">a</Tag>\n<Tag tone=\"accent\">b</Tag>",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/tag tests/design-system/codemods`
Expected: FAIL — `Tag` is not exported; `RULE_SETS.tag` undefined.

- [ ] **Step 3: Implement**

Create `src/components/ui/tag/Tag.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC, type MouseEventHandler, type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { X } from 'lucide-react';

export const tagVariants = cva('bg-surface inline-flex shrink-0 items-center gap-1 rounded-md border font-medium whitespace-nowrap', {
  variants: {
    tone: {
      neutral: 'border-border text-fg',
      accent: 'border-border text-accent',
      success: 'border-border text-success',
      warning: 'border-border text-warning',
      danger: 'border-border text-danger',
      info: 'border-border text-info',
    },
    size: {
      sm: 'h-5 px-1.5 text-2xs',
      md: 'h-6 px-2 text-xs',
    },
    interactive: {
      true: 'focus-ring cursor-pointer hover:bg-hover',
      false: '',
    },
    selected: {
      true: 'border-accent bg-accent-subtle text-accent hover:bg-accent-subtle',
      false: '',
    },
    removable: {
      true: 'pe-0.5',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    size: 'md',
    interactive: false,
    selected: false,
    removable: false,
  },
});

type TagBaseProps = Omit<ComponentPropsWithoutRef<'span'>, 'onClick'> &
  Pick<VariantProps<typeof tagVariants>, 'tone' | 'size'> & {
    children: ReactNode;
  };

type ToggleTagProps = TagBaseProps & {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  selected?: boolean;
  onRemove?: never;
};

type RemovableTagProps = TagBaseProps & {
  onRemove: () => void;
  onClick?: never;
  selected?: never;
};

export type TagProps = ToggleTagProps | RemovableTagProps;

const Tag: FC<TagProps> = ({ className, tone, size, children, onClick, selected, onRemove, ...props }) => {
  const { t } = useAppTranslation('common');

  const removeLabel = typeof children === 'string' ? t('removeItem', { item: children }) : t('remove');
  const isToggle = Boolean(onClick);

  const classes = cn(
    tagVariants({ tone, size, interactive: isToggle, selected: Boolean(selected), removable: Boolean(onRemove) }),
    className,
  );

  return (
    <Conditional>
      <Conditional.If condition={isToggle}>
        <button type="button" data-slot="tag" aria-pressed={selected} onClick={onClick} className={classes}>
          {children}
        </button>
      </Conditional.If>

      <Conditional.Else>
        <span data-slot="tag" className={classes} {...props}>
          {children}

          <Conditional.If condition={Boolean(onRemove)}>
            <button
              type="button"
              data-slot="tag-remove"
              aria-label={removeLabel}
              onClick={onRemove}
              className="focus-ring text-fg-muted hover:bg-hover hover:text-fg inline-flex size-4 items-center justify-center rounded-sm"
            >
              <X aria-hidden="true" className="size-3" />
            </button>
          </Conditional.If>
        </span>
      </Conditional.Else>
    </Conditional>
  );
};

export default Tag;
```

Create `src/components/ui/tag/index.ts`:

```ts
export { default as Tag } from './Tag';
export * from './Tag';
```

In `src/components/ui/index.ts`, replace `export * from './chip';` with `export * from './tag';`.

Add i18n keys — `src/locales/en/common.json`: `"remove": "Remove"`, `"removeItem": "Remove {{item}}"`; `src/locales/ar/common.json`: `"remove": "إزالة"`, `"removeItem": "إزالة {{item}}"`.

In `scripts/design-system/codemods/rules.ts`, add above `RULE_SETS`:

```ts
const chipRule: TagRule = {
  tag: 'Chip',
  renameTo: 'Tag',
  importRename: { source: '@components/ui', from: 'Chip', to: 'Tag' },
  keys: ['variant', 'size'],
  transform: (attrs) => {
    if (attrs.size === 'unstyled') return 'manual';
    const out: Record<string, AttrValue> = {};
    const tone = lookup(CHIP_TONES, attrs.variant ?? 'default', 'Chip variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) {
      const size = lookup(CHIP_SIZES, attrs.size, 'Chip size');
      if (size !== 'md') out.size = size;
    }
    return out;
  },
};
```

and add `tag: [chipRule],` to `RULE_SETS`.

- [ ] **Step 4: Migrate, fix the manual site, replace docs**

Run: `P ds:migrate tag`
Expected: `changed 40 tags in 9 files` and exactly two `MANUAL` lines: `SidebarPanel.tsx:19 <Chip variant={on ? 'default' : 'muted'} size="sm" …>` and `ComponentsGalleryPage.tsx:162 <Chip variant={isActive ? 'default' : 'muted'} size="default">`.

Edit them (the codemod already renamed the tags and imports): `SidebarPanel.tsx:19` → `<Tag tone={on ? 'accent' : 'neutral'} size="sm" …>` (keep the remaining props); `ComponentsGalleryPage.tsx:162` → `<Tag tone={isActive ? 'accent' : 'neutral'}>`.

Delete `src/components/ui/chip/` and `src/component-docs/ui/Chip.mdx`. Create `src/component-docs/ui/Tag.mdx`:

````mdx
---
id: tag
title: Tag
section: Components
category: UI
description: 'Interactive label: a toggle (selected / onClick) or a removable token (onRemove). Use Badge for static status.'
tags: [ui, tag, chip, filter, token]
---

import { Tag } from '@components/ui';

## Demo

<div className="flex flex-wrap items-center gap-2">
  <Tag>Asthma</Tag>
  <Tag tone="accent">Cardiology</Tag>
  <Tag onRemove={() => undefined}>Penicillin</Tag>
  <Tag selected onClick={() => undefined}>Selected filter</Tag>
  <Tag size="sm">Small</Tag>
</div>

## Rules

- A tag is either a toggle (`onClick`, optional `selected` → `aria-pressed`) or removable (`onRemove`), never both.
- The remove button is announced as "Remove {text}" (translated) when the tag's content is plain text.
- 6px corners, hairline border — no pill shapes.

## Imports

```tsx
import { Tag } from '@components/ui';
```

## Code

```tsx
<Tag onRemove={() => removeAllergy(id)}>Penicillin</Tag>
<Tag selected={isActive} onClick={toggleFilter}>Cardiology</Tag>
```
````

Run: `grep -rn "Chip\b" src --include='*.tsx' --include='*.ts' --include='*.mdx' | grep -v "FilterChip"`
Expected: no output.

- [ ] **Step 5: Run tests and verify**

Run: `P exec vp fmt src scripts tests && P exec vp test --run && P exec tsc -b && P docs:lint && P ds:baseline && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: all PASS; tsc 0; docs lint passes.

- [ ] **Step 6: Commit**

```bash
git add -A src scripts tests/design-system
git commit -m "feat(ui): Tag (toggle or removable) replaces Chip

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Batch 2 — Alert

**Files:**
- Modify: `src/components/ui/alert/Alert.tsx` (full rewrite)
- Modify: `scripts/design-system/codemods/rules.ts` (add `alert` set)
- Modify: `src/component-docs/ui/Alert.mdx` (description)
- Test: `src/components/ui/alert/Alert.test.tsx`, `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens; Task 2 engine.
- Produces: `Alert` compound (`Alert.Title`, `Alert.Description`) with `variant?: 'soft' | 'outline'` (default `soft`), `tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'` (default `neutral`); `role="alert"` for danger, `role="status"` otherwise; `data-variant`, `data-tone`. `RULE_SETS.alert`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/alert/Alert.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Alert } from '@components/ui';

afterEach(cleanup);

describe('Alert', () => {
  it('danger alerts interrupt (role=alert)', () => {
    render(
      <Alert tone="danger">
        <Alert.Title>Claim rejected</Alert.Title>
      </Alert>,
    );
    expect(screen.getByRole('alert').dataset.tone).toBe('danger');
  });

  it('other tones are polite (role=status)', () => {
    render(
      <Alert tone="warning" variant="outline">
        <Alert.Title>Insurance expires soon</Alert.Title>
      </Alert>,
    );
    const alert = screen.getByRole('status');
    expect([alert.dataset.variant, alert.dataset.tone]).toEqual(['outline', 'warning']);
  });

  it('outline alerts carry no side stripe', () => {
    render(
      <Alert tone="info" variant="outline">
        <Alert.Title>Synced</Alert.Title>
      </Alert>,
    );
    expect(screen.getByRole('status').className).not.toMatch(/border-(s|l|inline-start)-/);
  });
});
```

Append to `tests/design-system/codemods/migrate-props.test.ts`:

```ts
describe('alert rules', () => {
  it.each([
    ['<Alert variant="default">', '<Alert>'],
    ['<Alert variant="destructive">', '<Alert tone="danger">'],
    ['<Alert variant="outline">', '<Alert variant="outline">'],
    ['<Alert variant="outline-info">', '<Alert variant="outline" tone="info">'],
    ['<Alert variant="outline-destructive">', '<Alert variant="outline" tone="danger">'],
  ])('%s → %s', (input, expected) => {
    expect(migrateSource(input, RULE_SETS.alert).output).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/alert tests/design-system/codemods`
Expected: FAIL — no `role="status"`; `RULE_SETS.alert` undefined.

- [ ] **Step 3: Implement**

Replace `src/components/ui/alert/Alert.tsx` with:

```tsx
import { type FC, type HTMLAttributes, type ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type TitleProps = HTMLAttributes<HTMLHeadingElement>;

type DescriptionProps = HTMLAttributes<HTMLDivElement>;

type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    children: ReactNode;
  };

type AlertComponent = FC<AlertProps> & {
  Title: FC<TitleProps>;
  Description: FC<DescriptionProps>;
};

const alertVariants = cva(
  [
    'grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 rounded-lg border p-3 text-sm',
    '[&>svg]:mt-0.5 [&>svg]:size-4 *:data-[slot=alert-description]:col-start-2 *:data-[slot=alert-title]:col-start-2',
  ],
  {
    variants: {
      variant: {
        soft: '',
        outline: 'bg-surface border-border',
      },
      tone: {
        neutral: '',
        info: '',
        success: '',
        warning: '',
        danger: '',
      },
    },
    compoundVariants: [
      { variant: 'soft', tone: 'neutral', className: 'bg-surface-sunken border-border [&>svg]:text-fg-muted' },
      { variant: 'soft', tone: 'info', className: 'bg-info-subtle border-info/30 [&>svg]:text-info' },
      { variant: 'soft', tone: 'success', className: 'bg-success-subtle border-success/30 [&>svg]:text-success' },
      { variant: 'soft', tone: 'warning', className: 'bg-warning-subtle border-warning/30 [&>svg]:text-warning' },
      { variant: 'soft', tone: 'danger', className: 'bg-danger-subtle border-danger/30 [&>svg]:text-danger' },
      { variant: 'outline', tone: 'neutral', className: '[&>svg]:text-fg-muted' },
      { variant: 'outline', tone: 'info', className: '[&>svg]:text-info' },
      { variant: 'outline', tone: 'success', className: '[&>svg]:text-success' },
      { variant: 'outline', tone: 'warning', className: '[&>svg]:text-warning' },
      { variant: 'outline', tone: 'danger', className: '[&>svg]:text-danger' },
    ],
    defaultVariants: {
      variant: 'soft',
      tone: 'neutral',
    },
  },
);

const Title: FC<TitleProps> = ({ className, ...props }) => (
  <h5 data-slot="alert-title" className={cn('text-fg leading-snug font-semibold', className)} {...props} />
);

const Description: FC<DescriptionProps> = ({ className, ...props }) => (
  <div data-slot="alert-description" className={cn('text-fg-muted [&_p]:leading-relaxed', className)} {...props} />
);

const Alert: AlertComponent = ({ className, variant, tone, ...props }) => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    data-slot="alert"
    data-variant={variant ?? 'soft'}
    data-tone={tone ?? 'neutral'}
    className={cn(alertVariants({ variant, tone }), className)}
    {...props}
  />
);

Alert.Title = Title;
Alert.Description = Description;

export default Alert;
```

In `scripts/design-system/codemods/rules.ts`, add above `RULE_SETS`:

```ts
const ALERT_VARIANTS: Readonly<Record<string, { variant?: 'outline'; tone?: string }>> = {
  default: {},
  info: { tone: 'info' },
  success: { tone: 'success' },
  warning: { tone: 'warning' },
  destructive: { tone: 'danger' },
  outline: { variant: 'outline' },
  'outline-info': { variant: 'outline', tone: 'info' },
  'outline-success': { variant: 'outline', tone: 'success' },
  'outline-destructive': { variant: 'outline', tone: 'danger' },
};

const alertRule: TagRule = {
  tag: 'Alert',
  keys: ['variant'],
  transform: (attrs) => {
    const mapped = lookup(ALERT_VARIANTS, attrs.variant ?? 'default', 'Alert variant');
    const out: Record<string, AttrValue> = {};
    if (mapped.variant) out.variant = mapped.variant;
    if (mapped.tone) out.tone = mapped.tone;
    return out;
  },
};
```

and add `alert: [alertRule],` to `RULE_SETS`.

- [ ] **Step 4: Migrate and update docs**

Run: `P ds:migrate alert`
Expected: `changed 16 tags in 1 files`, no `MANUAL` lines.

In `src/component-docs/ui/Alert.mdx`, set `description: 'Inline message with a tone (neutral, info, success, warning, danger) in soft or outline style; danger alerts use role=alert.'` and replace any prose naming the old variants (`outline-info`, `destructive`, …) with the tone/variant names.

- [ ] **Step 5: Run tests and verify**

Run: `P exec vp fmt src scripts tests && P exec vp test --run && P exec tsc -b && P docs:lint && P ds:baseline && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add -A src scripts tests/design-system
git commit -m "feat(ui): Alert soft/outline × tone, polite status role, no side stripe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Batch 2 — Progress, Skeleton, Divider

**Files:**
- Modify: `src/components/ui/progress/Progress.tsx`, `src/components/ui/skeleton/Skeleton.tsx`, `src/components/ui/divider/Divider.tsx` (full rewrites)
- Modify: `scripts/design-system/codemods/rules.ts` (add `feedback` set)
- Modify: `src/component-docs/ui/{Progress,Skeleton,Divider}.mdx` (descriptions)
- Test: `src/components/ui/progress/Progress.test.tsx`, `src/components/ui/skeleton/Skeleton.test.tsx`, `src/components/ui/divider/Divider.test.tsx`, `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens; Task 2 engine; `lookup` from Task 4.
- Produces: `Progress` (`value: number`, `fullValue?: number` default 100, `tone?: 'accent' | 'neutral' | 'success' | 'danger'` default `accent`, `size?: 'sm' | 'md' | 'lg'` default `md`); `Skeleton` (`shape?: 'line' | 'circle' | 'block'` default `line`, `size?: 'sm' | 'md' | 'lg'` default `md`, `aria-hidden`, `data-shape`, `data-size`); `Divider` (unchanged props; adds `aria-orientation`). `RULE_SETS.feedback`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/progress/Progress.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Progress } from '@components/ui';

afterEach(cleanup);

describe('Progress', () => {
  it('reports its value and scales the fill from the inline start', () => {
    render(<Progress value={40} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    const fill = bar.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
    expect(fill.style.transform).toBe('scaleX(0.4)');
    expect(fill.className).toContain('origin-left');
    expect(fill.className).toContain('rtl:origin-right');
  });

  it('clamps out-of-range values and exposes its tone', () => {
    render(<Progress value={180} tone="danger" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.dataset.tone).toBe('danger');
    expect(bar.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!.style.transform).toBe('scaleX(1)');
  });
});
```

Create `src/components/ui/skeleton/Skeleton.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Skeleton } from '@components/ui';

afterEach(cleanup);

describe('Skeleton', () => {
  it('is hidden from assistive technology and defaults to a medium line', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstElementChild as HTMLElement;
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect([skeleton.dataset.shape, skeleton.dataset.size]).toEqual(['line', 'md']);
  });

  it('circle and block shapes size themselves', () => {
    const { container } = render(
      <>
        <Skeleton shape="circle" size="lg" />
        <Skeleton shape="block" size="sm" />
      </>,
    );
    const [circle, block] = Array.from(container.children) as HTMLElement[];
    expect(circle.className).toContain('size-10');
    expect(block.className).toContain('h-16');
  });
});
```

Create `src/components/ui/divider/Divider.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Divider } from '@components/ui';

afterEach(cleanup);

describe('Divider', () => {
  it('announces its orientation and uses the border token', () => {
    render(<Divider orientation="vertical" />);
    const divider = screen.getByRole('separator');
    expect(divider.getAttribute('aria-orientation')).toBe('vertical');
    expect(divider.className).toContain('bg-border');
  });
});
```

Append to `tests/design-system/codemods/migrate-props.test.ts`:

```ts
describe('feedback rules', () => {
  it.each([
    ['<Progress value={30} variant="default" indicatorVariant="default"/>', '<Progress value={30}/>'],
    ['<Progress value={60} variant="success" indicatorVariant="success"/>', '<Progress tone="success" value={60}/>'],
    ['<Progress value={90} variant="destructive" size="lg"/>', '<Progress tone="danger" size="lg" value={90}/>'],
    ['<Skeleton shape="text" size="xs" />', '<Skeleton size="sm" />'],
    ['<Skeleton shape="avatar" size="xl" />', '<Skeleton shape="circle" size="lg" />'],
    ['<Skeleton shape="banner" size="md" variant="card" />', '<Skeleton shape="block" />'],
    ['<Switch variant="success" size="lg" />', '<Switch size="md" />'],
    ['<Checkbox variant="secondary" />', '<Checkbox />'],
  ])('%s → %s', (input, expected) => {
    expect(migrateSource(input, RULE_SETS.feedback).output.replace(/\s+/g, ' ')).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/progress src/components/ui/skeleton src/components/ui/divider tests/design-system/codemods`
Expected: FAIL — transform uses `translateX`; Skeleton has no `data-shape`; Divider lacks `aria-orientation`; `RULE_SETS.feedback` undefined.

- [ ] **Step 3: Implement**

Replace `src/components/ui/progress/Progress.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const progressVariants = cva('bg-border relative w-full overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const progressIndicatorVariants = cva('duration-base ease-out h-full w-full origin-left rounded-full transition-transform rtl:origin-right', {
  variants: {
    tone: {
      accent: 'bg-accent',
      neutral: 'bg-fg',
      success: 'bg-success',
      danger: 'bg-danger',
    },
  },
  defaultVariants: {
    tone: 'accent',
  },
});

type ProgressProps = Omit<ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value' | 'max'> &
  VariantProps<typeof progressVariants> &
  VariantProps<typeof progressIndicatorVariants> & {
    value: number;
    fullValue?: number;
  };

const Progress: FC<ProgressProps> = ({ className, value, fullValue = 100, size, tone, ...props }) => {
  const ratio = Math.min(1, Math.max(0, value / fullValue));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone ?? 'accent'}
      value={Math.min(value, fullValue)}
      max={fullValue}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={progressIndicatorVariants({ tone })}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </ProgressPrimitive.Root>
  );
};

export default Progress;
```

Replace `src/components/ui/skeleton/Skeleton.tsx` with:

```tsx
import { type FC, type HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const skeletonVariants = cva('bg-border-subtle animate-pulse', {
  variants: {
    shape: {
      line: 'w-full rounded-sm',
      circle: 'shrink-0 rounded-full',
      block: 'w-full rounded-md',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { shape: 'line', size: 'sm', className: 'h-3' },
    { shape: 'line', size: 'md', className: 'h-3.5' },
    { shape: 'line', size: 'lg', className: 'h-4.5' },
    { shape: 'circle', size: 'sm', className: 'size-6' },
    { shape: 'circle', size: 'md', className: 'size-8' },
    { shape: 'circle', size: 'lg', className: 'size-10' },
    { shape: 'block', size: 'sm', className: 'h-16' },
    { shape: 'block', size: 'md', className: 'h-24' },
    { shape: 'block', size: 'lg', className: 'h-40' },
  ],
  defaultVariants: {
    shape: 'line',
    size: 'md',
  },
});

type SkeletonProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>;

const Skeleton: FC<SkeletonProps> = ({ className, shape, size, ...props }) => (
  <div
    aria-hidden="true"
    data-slot="skeleton"
    data-shape={shape ?? 'line'}
    data-size={size ?? 'md'}
    className={cn(skeletonVariants({ shape, size }), className)}
    {...props}
  />
);

export default Skeleton;
```

Replace `src/components/ui/divider/Divider.tsx` with:

```tsx
import { type ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

export const dividerVariants = cva('m-0 border-0', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-auto w-px self-stretch',
    },
    variant: {
      solid: 'bg-border',
      dashed: 'border-border border-t border-dashed bg-transparent',
    },
  },
  compoundVariants: [
    {
      orientation: 'vertical',
      variant: 'dashed',
      className: 'border-s border-t-0',
    },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
  },
});

export type DividerVariants = VariantProps<typeof dividerVariants>;

export type DividerProps = ComponentPropsWithoutRef<'hr'> & DividerVariants;

const Divider = ({ className, orientation, variant, ...props }: DividerProps) => (
  <hr
    data-slot="divider"
    aria-orientation={orientation ?? 'horizontal'}
    className={cn(dividerVariants({ orientation, variant }), className)}
    {...props}
  />
);

export default Divider;
```

In `scripts/design-system/codemods/rules.ts`, add above `RULE_SETS` (the Switch and Checkbox rules live here because their only change is removing `variant`; Task 9 restyles those components):

```ts
const PROGRESS_TONES: Readonly<Record<string, string | null>> = {
  default: null,
  accent: null,
  success: 'success',
  destructive: 'danger',
  secondary: 'neutral',
};

const progressRule: TagRule = {
  tag: 'Progress',
  keys: ['variant', 'indicatorVariant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    const tone = lookup(PROGRESS_TONES, attrs.indicatorVariant ?? attrs.variant ?? 'default', 'Progress variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) out.size = attrs.size;
    return out;
  },
};

const SKELETON_SHAPES: Readonly<Record<string, string | null>> = {
  text: null,
  avatar: 'circle',
  banner: 'block',
  thumbnail: 'block',
  square: 'block',
  rectangle: 'block',
  squareSharp: 'block',
  rectangleSharp: 'block',
};

const SKELETON_SIZES: Readonly<Record<string, string | null>> = { xs: 'sm', sm: 'sm', default: null, md: null, lg: 'lg', xl: 'lg' };

const skeletonRule: TagRule = {
  tag: 'Skeleton',
  keys: ['variant', 'size', 'shape'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    const shape = lookup(SKELETON_SHAPES, attrs.shape ?? 'text', 'Skeleton shape');
    if (shape) out.shape = shape;
    const size = lookup(SKELETON_SIZES, attrs.size ?? 'default', 'Skeleton size');
    if (size) out.size = size;
    return out;
  },
};

const switchRule: TagRule = {
  tag: 'Switch',
  keys: ['variant', 'size'],
  transform: (attrs) => (attrs.size === undefined ? {} : { size: attrs.size === 'sm' ? 'sm' : 'md' }),
};

const checkboxRule: TagRule = {
  tag: 'Checkbox',
  keys: ['variant'],
  transform: () => ({}),
};
```

and add `feedback: [progressRule, skeletonRule, switchRule, checkboxRule],` to `RULE_SETS`.

> `Switch`/`Checkbox` keep compiling between Task 7 and Task 9 because removing `variant` from a call site is valid against both the old and the new component types.

- [ ] **Step 4: Migrate and update docs**

Run: `P ds:migrate feedback`
Expected: `changed 114 tags in 8 files`, no `MANUAL` lines.

Update the `description` frontmatter of `src/component-docs/ui/Progress.mdx` (`'Linear progress with a tone (accent, neutral, success, danger) and three thicknesses; fills from the inline start, RTL-aware.'`), `Skeleton.mdx` (`'Loading placeholder: line, circle or block in three sizes; hidden from assistive technology.'`) and `Divider.mdx` (`'Hairline separator, horizontal or vertical, solid or dashed.'`), and remove prose that names removed props (`indicatorVariant`, skeleton `variant`, the eight old shapes).

- [ ] **Step 5: Run tests and verify**

Run: `P exec vp fmt src scripts tests && P exec vp test --run && P exec tsc -b && P docs:lint && P ds:baseline && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add -A src scripts tests/design-system
git commit -m "feat(ui): Progress tone + RTL-correct fill, Skeleton shapes, Divider tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Batch 3 — field shape + Input

**Files:**
- Modify: `src/components/ui/input/Input.tsx` (full rewrite), `src/components/ui/input/index.ts`
- Modify: `src/component-docs/ui/Input.mdx`
- Test: `src/components/ui/input/Input.test.tsx`

**Interfaces:**
- Consumes: Task 1 tokens; utilities `focus-ring-input`, `state-invalid`, `h-control-*`.
- Produces: `fieldVariants` (CVA, `size?: 'sm' | 'md' | 'lg'`, default `md`) and `type FieldVariants`, exported from `@components/ui` — reused by Select (Task 10) and, in Plan B, TimePicker and FormattedNumber. `Input` with `size?`, `invalid?: boolean` (renders `aria-invalid="true"`).

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/input/Input.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { fieldVariants, Input } from '@components/ui';

afterEach(cleanup);

describe('Input', () => {
  it('invalid renders aria-invalid for assistive tech and the invalid style', () => {
    render(<Input aria-label="National ID" invalid />);
    expect(screen.getByLabelText('National ID').getAttribute('aria-invalid')).toBe('true');
  });

  it('size maps to control heights', () => {
    render(<Input aria-label="Search" size="sm" />);
    expect(screen.getByLabelText('Search').className).toContain('h-control-sm');
  });

  it('hover never overrides the invalid border', () => {
    expect(fieldVariants()).toContain('hover:not-disabled:not-aria-invalid:border-fg-muted');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run src/components/ui/input`
Expected: FAIL — `fieldVariants` is not exported / `aria-invalid` is null.

- [ ] **Step 3: Implement**

Replace `src/components/ui/input/Input.tsx` with:

```tsx
import { type ComponentProps, type FC, forwardRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

/** The shared field shape: Input, Select trigger, TimePicker trigger, FormattedNumber (spec addendum §7). */
export const fieldVariants = cva(
  [
    'border-border-strong bg-surface text-fg flex w-full min-w-0 items-center rounded-md border transition-colors outline-none',
    'placeholder:text-fg-muted hover:not-disabled:not-aria-invalid:border-fg-muted',
    'focus-ring-input state-invalid',
    'disabled:border-border disabled:bg-surface-sunken disabled:text-fg-subtle disabled:pointer-events-none',
  ],
  {
    variants: {
      size: {
        sm: 'h-control-sm px-2.5 text-xs',
        md: 'h-control-md px-3 text-sm',
        lg: 'h-control-lg px-3 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type FieldVariants = VariantProps<typeof fieldVariants>;

type InputProps = Omit<ComponentProps<'input'>, 'size'> &
  FieldVariants & {
    invalid?: boolean;
  };

const Input: FC<InputProps> = ({ ref, className, size, invalid, ...props }) => (
  <input
    ref={ref}
    data-slot="input"
    aria-invalid={invalid || undefined}
    className={cn(fieldVariants({ size }), 'file:border-0 file:bg-transparent file:text-sm file:font-medium', className)}
    {...props}
  />
);

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLInputElement, InputProps>((props, ref) => Input({ ...props, ref }));
```

Replace `src/components/ui/input/index.ts` with:

```ts
export { default as Input } from './Input';
export * from './Input';
```

In `src/component-docs/ui/Input.mdx`, set `description: 'Text field in three sizes with invalid and disabled states; shares its shape with Select, TimePicker and FormattedNumber.'` and make the demo show `<Input placeholder="Patient name" />`, `<Input size="sm" placeholder="Search" />`, `<Input size="lg" placeholder="Search" />`, `<Input invalid defaultValue="2981-44" />` and `<Input disabled value="Locked" />`.

- [ ] **Step 4: Run tests and verify**

Run: `P exec vp fmt src && P exec vp test --run && P exec tsc -b && P docs:lint && P ds:baseline && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: all PASS (tsc proves no call site passes a numeric `size` to Input).

- [ ] **Step 5: Commit**

```bash
git add -A src tests/design-system
git commit -m "feat(ui): shared field shape and Input size/invalid

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Batch 3 — Checkbox, CheckboxGroup, RadioGroup (+ Dot), Switch

**Files:**
- Modify: `src/components/ui/checkbox/Checkbox.tsx`, `src/components/ui/checkbox/index.ts`
- Modify: `src/components/ui/checkbox-group/CheckboxGroup.tsx`
- Modify: `src/components/ui/radio-group/RadioGroup.tsx`
- Modify: `src/components/ui/switch/Switch.tsx`
- Delete: `src/components/ui/radio-dot/` (+ its line in `src/components/ui/index.ts`), `src/component-docs/ui/RadioDot.mdx`
- Modify: `src/components/tables/data-table-filters/async-select-filter/AsyncSelectFilter.tsx:5,129`, `src/components/tables/data-table-filters/select-filter/SelectFilter.tsx:5,110`
- Modify: `src/component-docs/ui/{Checkbox,CheckboxGroup,RadioGroup,Switch}.mdx`
- Test: `src/components/ui/checkbox/Checkbox.test.tsx`, `src/components/ui/radio-group/RadioGroup.test.tsx`, `src/components/ui/switch/Switch.test.tsx`

**Interfaces:**
- Consumes: Task 1 tokens (`accent`, `accent-fg`, `accent-subtle`, `border-strong`); Task 7 already removed `variant` from Switch/Checkbox call sites.
- Produces: `Checkbox` (Radix props; no `variant`; supports `checked="indeterminate"`); named `checkboxBoxClassName`; `CheckboxGroup` (`.Item`, `.Indicator` unchanged API); `RadioGroup` (`.Item`, `.Indicator`, new `.Dot` with `{ checked?: boolean; className?: string }`); `Switch` (`size?: 'sm' | 'md'`, no `variant`).

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/checkbox/Checkbox.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Checkbox } from '@components/ui';

afterEach(cleanup);

describe('Checkbox', () => {
  it('indeterminate is announced as mixed', () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" />);
    expect(screen.getByRole('checkbox', { name: 'Select all' }).getAttribute('aria-checked')).toBe('mixed');
  });

  it('checked state uses the accent', () => {
    render(<Checkbox aria-label="Agree" defaultChecked />);
    expect(screen.getByRole('checkbox', { name: 'Agree' }).className).toContain('data-[state=checked]:bg-accent');
  });
});
```

Create `src/components/ui/radio-group/RadioGroup.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { RadioGroup } from '@components/ui';

afterEach(cleanup);

describe('RadioGroup.Dot', () => {
  it('is a decorative indicator reflecting its state', () => {
    const { container } = render(
      <>
        <RadioGroup.Dot checked />
        <RadioGroup.Dot />
      </>,
    );
    const [on, off] = Array.from(container.children) as HTMLElement[];
    expect(on.getAttribute('aria-hidden')).toBe('true');
    expect([on.dataset.state, off.dataset.state]).toEqual(['checked', 'unchecked']);
  });
});
```

Create `src/components/ui/switch/Switch.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Switch } from '@components/ui';

afterEach(cleanup);

describe('Switch', () => {
  it('is a switch that toggles aria-checked (Space activates it natively as a <button>)', () => {
    render(<Switch aria-label="SMS reminders" />);
    const control = screen.getByRole('switch', { name: 'SMS reminders' });
    expect(control.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
  });

  it.each(['sm', 'md'] as const)('the %s thumb travels toward the inline end in RTL', (size) => {
    render(<Switch aria-label={`switch-${size}`} size={size} />);
    const thumb = screen.getByRole('switch', { name: `switch-${size}` }).querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
    expect(thumb.className).toMatch(/rtl:data-\[state=checked\]:-translate-x-/);
    expect(thumb.className).toContain('rtl:-translate-x-0.5');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/checkbox src/components/ui/radio-group src/components/ui/switch`
Expected: FAIL — `RadioGroup.Dot` undefined; checkbox has `data-[state=checked]:bg-primary`; switch thumb has no `rtl:` classes.

- [ ] **Step 3: Implement**

Replace `src/components/ui/checkbox/Checkbox.tsx` with:

```tsx
import { type ComponentProps, type FC, forwardRef } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { Check, Minus } from 'lucide-react';

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;

/** The 16px checkbox square, shared with CheckboxGroup.Indicator. State comes from Radix `data-state`. */
export const checkboxBoxClassName = [
  'border-border-strong bg-surface text-accent-fg flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
  'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
  'data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent',
].join(' ');

const Checkbox: FC<CheckboxProps> = ({ ref, className, checked, ...props }) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-slot="checkbox"
    checked={checked}
    className={cn(checkboxBoxClassName, 'focus-ring cursor-pointer disabled:pointer-events-none disabled:opacity-50', className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center">
      <Conditional.If condition={checked === 'indeterminate'} fallback={<Check className="size-3" strokeWidth={3} />}>
        <Minus className="size-3" strokeWidth={3} />
      </Conditional.If>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

Checkbox.displayName = 'Checkbox';

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, CheckboxProps>((props, ref) => Checkbox({ ...props, ref }));
```

Replace `src/components/ui/checkbox/index.ts` with:

```ts
export { default as Checkbox } from './Checkbox';
export * from './Checkbox';
```

In `src/components/ui/checkbox-group/CheckboxGroup.tsx`, add `import { checkboxBoxClassName } from '@components/ui';` (after the Radix import) and replace the two class lists:

- `Item`'s `cn(…)` arguments (all six strings before `className`) → 

  ```ts
      'group/checkbox-item border-border bg-surface text-fg flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
      'focus-ring hover:not-disabled:border-border-strong',
      'data-[state=checked]:border-accent data-[state=checked]:bg-accent-subtle',
      'disabled:pointer-events-none disabled:opacity-50',
  ```
- `Indicator`'s `cn(…)` arguments (all five strings before `className`) → `checkboxBoxClassName,`

Replace `src/components/ui/radio-group/RadioGroup.tsx` with:

```tsx
import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@utils';

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

type RadioGroupIndicatorProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Indicator>;

type RadioGroupDotProps = {
  checked?: boolean;
  className?: string;
};

type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

type RadioGroupComponent = FC<RadioGroupProps> & {
  Item: FC<RadioGroupItemProps>;
  Indicator: FC<RadioGroupIndicatorProps>;
  Dot: FC<RadioGroupDotProps>;
};

/** The 16px radio circle; `data-state="checked"` draws the accent ring and dot. */
const radioCircleClassName = [
  'border-border-strong bg-surface flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
  'after:size-2 after:rounded-full data-[state=checked]:border-accent data-[state=checked]:after:bg-accent',
].join(' ');

const Item: FC<RadioGroupItemProps> = ({ ref, className, children, ...props }) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    data-slot="radio-group-item"
    className={cn(
      'group/radio-item border-border bg-surface text-fg flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
      'focus-ring hover:not-disabled:border-border-strong',
      'data-[state=checked]:border-accent data-[state=checked]:bg-accent-subtle',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
  </RadioGroupPrimitive.Item>
);

const Indicator = ({ className, children, ...props }: RadioGroupIndicatorProps) => (
  <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className={cn(radioCircleClassName, className)} forceMount {...props}>
    {children}
  </RadioGroupPrimitive.Indicator>
);

/** Non-interactive radio visual for custom single-select lists (e.g. table filters). */
const Dot: FC<RadioGroupDotProps> = ({ checked = false, className }) => (
  <span
    data-slot="radio-group-dot"
    data-state={checked ? 'checked' : 'unchecked'}
    aria-hidden="true"
    className={cn(radioCircleClassName, className)}
  />
);

const RadioGroup: RadioGroupComponent = ({ className, ...props }) => (
  <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid w-full gap-3', className)} {...props} />
);

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
RadioGroup.Item = forwardRef<HTMLButtonElement, RadioGroupItemProps>((props, ref) => Item({ ...props, ref }));
RadioGroup.Indicator = Indicator;
RadioGroup.Dot = Dot;

RadioGroup.displayName = 'RadioGroup';
RadioGroup.Item.displayName = 'RadioGroupItem';
Indicator.displayName = 'RadioGroupIndicator';
Dot.displayName = 'RadioGroupDot';

export default RadioGroup;
```

Replace `src/components/ui/switch/Switch.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const switchRootVariants = cva(
  [
    'peer bg-border inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
    'focus-ring data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-3.5 w-6.5',
        md: 'h-4.5 w-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const switchThumbVariants = cva(
  'bg-fg-muted data-[state=checked]:bg-accent-fg duration-fast pointer-events-none block rounded-full transition-transform',
  {
    variants: {
      size: {
        sm: 'size-2.5 translate-x-0.5 data-[state=checked]:translate-x-3 rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-3',
        md: 'size-3.5 translate-x-0.5 data-[state=checked]:translate-x-3.5 rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-3.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & VariantProps<typeof switchRootVariants>;

const Switch: FC<SwitchProps> = ({ className, size, ...props }) => (
  <SwitchPrimitives.Root data-slot="switch" className={cn(switchRootVariants({ size }), className)} {...props}>
    <SwitchPrimitives.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
  </SwitchPrimitives.Root>
);

export default Switch;
```

- [ ] **Step 4: Remove RadioDot and update its users**

- Delete `src/components/ui/radio-dot/` and remove `export * from './radio-dot';` from `src/components/ui/index.ts`; delete `src/component-docs/ui/RadioDot.mdx`.
- `AsyncSelectFilter.tsx:5` and `SelectFilter.tsx:5`: `import { Checkbox, RadioDot } from '@components/ui';` → `import { Checkbox, RadioGroup } from '@components/ui';`.
- `AsyncSelectFilter.tsx:129`: `<RadioDot checked={isChecked} />` → `<RadioGroup.Dot checked={isChecked} />`; `SelectFilter.tsx:110`: `<RadioDot checked={isSelected} />` → `<RadioGroup.Dot checked={isSelected} />`.
- Update descriptions: `Checkbox.mdx` → `'16px checkbox with checked and indeterminate states in the Oxblood accent.'`; `CheckboxGroup.mdx` → `'Option cards with a checkbox indicator; selected cards take the accent tint.'`; `RadioGroup.mdx` → `'Option cards with a radio indicator; RadioGroup.Dot is the non-interactive indicator for custom lists.'` (add a `<RadioGroup.Dot checked />` example); `Switch.mdx` → `'On/off switch in two sizes; checked uses the accent and the thumb follows text direction.'`; remove prose about removed `variant` values.

Run: `grep -rn "RadioDot" src`
Expected: no output.

- [ ] **Step 5: Run tests and verify**

Run: `P exec vp fmt src && P exec vp test --run && P exec tsc -b && P docs:lint && P ds:baseline && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add -A src tests/design-system
git commit -m "feat(ui): accent choice controls, RTL-correct Switch, RadioGroup.Dot replaces RadioDot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Batch 3 — Select, Command, ToggleGroup

**Files:**
- Modify: `src/components/ui/select/Select.tsx` (class strings + Trigger props)
- Modify: `src/components/ui/command/Command.tsx` (class strings)
- Modify: `src/components/ui/toggle-group/ToggleGroup.tsx` (full rewrite)
- Modify: `scripts/design-system/codemods/rules.ts` (add `menus` set)
- Modify: `src/component-docs/ui/{Select,Command,ToggleGroup}.mdx`
- Test: `src/components/ui/select/Select.test.tsx`, `src/components/ui/command/Command.test.tsx`, `src/components/ui/toggle-group/ToggleGroup.test.tsx`, `tests/design-system/codemods/migrate-props.test.ts`

**Interfaces:**
- Consumes: Task 8 `fieldVariants`, `FieldVariants`; Task 1 tokens; Task 2 engine.
- Produces: `Select.Trigger` gains `size?: 'sm' | 'md' | 'lg'` and `invalid?: boolean`; restyled Select/Command (APIs otherwise unchanged); `ToggleGroup` with `variant?: 'outline' | 'ghost'` (default `outline`), `size?: 'sm' | 'md' | 'lg'` (default `md`); `RULE_SETS.menus`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/select/Select.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Select } from '@components/ui';

afterEach(cleanup);

const renderSelect = (open: boolean) =>
  render(
    <Select defaultValue="haddad" defaultOpen={open}>
      <Select.Trigger aria-label="Doctor" size="sm" invalid>
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="aziz">
          <Select.Text>Dr. Aziz</Select.Text>
        </Select.Item>
        <Select.Item value="haddad">
          <Select.Text>Dr. Haddad</Select.Text>
        </Select.Item>
      </Select.Content>
    </Select>,
  );

describe('Select', () => {
  it('the trigger uses the field shape and reports invalid', () => {
    renderSelect(false);
    const trigger = screen.getByRole('combobox', { name: 'Doctor' });
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.className).toContain('h-control-sm');
  });

  it('the selected item is marked selected', () => {
    renderSelect(true);
    expect(screen.getByRole('option', { name: 'Dr. Haddad' }).getAttribute('aria-selected')).toBe('true');
  });
});
```

Create `src/components/ui/command/Command.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Command } from '@components/ui';

afterEach(cleanup);

describe('Command', () => {
  it('is a raised surface with mono shortcut hints', () => {
    const { container } = render(
      <Command>
        <Command.List>
          <Command.Item>
            Duplicate <Command.Shortcut>⌘D</Command.Shortcut>
          </Command.Item>
        </Command.List>
      </Command>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain('bg-surface-raised');
    expect(screen.getByText('⌘D').className).toContain('font-mono');
  });
});
```

Create `src/components/ui/toggle-group/ToggleGroup.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ToggleGroup } from '@components/ui';

afterEach(cleanup);

describe('ToggleGroup', () => {
  it('defaults to outline items at control height and marks the active item', () => {
    render(
      <ToggleGroup type="single" defaultValue="week" aria-label="Range">
        <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
        <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
      </ToggleGroup>,
    );
    const week = screen.getByRole('radio', { name: 'Week' });
    expect(week.dataset.state).toBe('on');
    expect(week.className).toContain('border-border-strong');
    expect(week.className).toContain('h-control-md');
  });
});
```

Append to `tests/design-system/codemods/migrate-props.test.ts`:

```ts
describe('menus rules', () => {
  it.each([
    ['<ToggleGroup type="single" variant="default" size="default">', '<ToggleGroup variant="ghost" type="single">'],
    ['<ToggleGroup type="single" variant="outline" size="lg">', '<ToggleGroup size="lg" type="single">'],
    ['<ToggleGroup.Item value="a" size="sm">', '<ToggleGroup.Item size="sm" value="a">'],
  ])('%s → %s', (input, expected) => {
    expect(migrateSource(input, RULE_SETS.menus).output.replace(/\s+/g, ' ')).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `P exec vp test --run src/components/ui/select src/components/ui/command src/components/ui/toggle-group tests/design-system/codemods`
Expected: FAIL — trigger lacks `aria-invalid`/`h-control-sm`; Command root is `bg-popover`; ToggleGroup items lack `h-control-md`; `RULE_SETS.menus` undefined.

- [ ] **Step 3: Implement Select**

In `src/components/ui/select/Select.tsx`:
- Add `import { fieldVariants, type FieldVariants } from '@components/ui';` after the Radix import.
- `type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger>;` → `type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> & FieldVariants & { invalid?: boolean };`
- Replace `SelectTrigger` with:

  ```tsx
  const SelectTrigger: FC<SelectTriggerProps> = ({ ref, className, size, invalid, children, ...props }) => (
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      aria-invalid={invalid || undefined}
      className={cn(
        fieldVariants({ size }),
        'group/select-trigger relative cursor-pointer gap-2 text-start data-[placeholder]:text-fg-muted data-[state=open]:border-ring',
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  );
  ```
- `SelectIcon` default icon: replace `size={20}` and its `cn(…)` strings with `className={cn('text-fg-muted size-4 shrink-0 transition-transform group-data-[state=open]/select-trigger:rotate-180 group-disabled/select-trigger:text-fg-subtle', className)}`.
- `SelectScrollUpButton`/`SelectScrollDownButton`: `'flex cursor-default items-center justify-center py-1'` → `'text-fg-muted flex cursor-default items-center justify-center py-1'`.
- `SelectContent`: first class string `'bg-popover text-popover-foreground border-muted-200 relative z-50 max-h-96 overflow-hidden rounded-md border shadow-xs'` → `'bg-surface-raised text-fg shadow-raised relative z-50 max-h-96 overflow-hidden rounded-lg p-1'` (keep the animation and popper strings).
- `SelectLabel`: `'px-2 py-1.5 text-sm font-semibold'` → `'text-fg-muted px-2 py-1.5 text-xs font-medium'`.
- `SelectItem`: replace its five class strings with:

  ```ts
        'relative flex h-control-sm w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none',
        'data-highlighted:bg-hover data-[state=checked]:font-medium',
        'data-disabled:pointer-events-none data-disabled:text-fg-subtle',
  ```
- `SelectIndicator` default icon: `<CheckIcon size={16} className={cn(className)} />` → `<CheckIcon className={cn('text-accent ms-auto size-4', className)} />`.
- `SelectSeparator`: `'bg-muted-200 h-px w-full'` → `'bg-border-subtle -mx-1 my-1 h-px'`.

- [ ] **Step 4: Implement Command**

In `src/components/ui/command/Command.tsx`, replace these class strings:

| Old | New |
|---|---|
| `"border-b-muted-200 flex items-center gap-2 border-b px-3"` | `"border-border-subtle flex items-center gap-2 border-b px-3"` |
| `"text-muted-foreground shrink-0"` (Search icon) | `"text-fg-muted shrink-0"` |
| `'flex w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:pointer-events-none'` | `'placeholder:text-fg-muted flex h-control-lg w-full bg-transparent text-sm outline-none disabled:pointer-events-none'` |
| `"py-6 text-center text-sm"` | `"text-fg-muted py-6 text-center text-sm"` |
| `'text-foreground **:[[cmdk-group-heading]]:overflow-hidden'` | `'text-fg p-1 **:[[cmdk-group-heading]]:overflow-hidden'` |
| `'**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium'` | same string + `' **:[[cmdk-group-heading]]:text-fg-muted'` |
| the five `CommandItem` strings | `'group/command-item relative flex h-control-sm w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none'`, `'data-[selected=true]:bg-hover data-[checked=true]:font-medium'`, `'data-[disabled=true]:pointer-events-none data-[disabled=true]:text-fg-subtle'` |
| `{children ?? <CheckIcon size={16} />}` | `{children ?? <CheckIcon className="text-accent size-4" />}` |
| `'ms-auto text-xs tracking-widest'` | `'text-fg-muted ms-auto font-mono text-2xs'` |
| `'bg-muted-200 h-px w-full'` | `'bg-border-subtle -mx-1 my-1 h-px'` |
| `'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md shadow-xs'` | `'bg-surface-raised text-fg flex h-full w-full flex-col overflow-hidden rounded-lg'` |

(`CommandDialog` keeps `Dialog.Panel`; Plan B moves it to the new `Dialog.Content`.)

- [ ] **Step 5: Implement ToggleGroup and its rule**

Replace `src/components/ui/toggle-group/ToggleGroup.tsx` with:

```tsx
import { type ComponentPropsWithoutRef, createContext, type FC, type ReactNode, useContext } from 'react';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const toggleVariants = cva(
  [
    'text-fg-muted inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors [&_svg]:size-4',
    'focus-ring hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-50',
    'data-[state=on]:bg-accent-subtle data-[state=on]:text-accent',
  ],
  {
    variants: {
      variant: {
        outline: 'border-border-strong data-[state=on]:border-accent border',
        ghost: '',
      },
      size: {
        sm: 'h-control-sm px-2.5 text-xs',
        md: 'h-control-md px-3 text-sm',
        lg: 'h-control-lg px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  },
);

type ToggleGroupContextValue = VariantProps<typeof toggleVariants>;

type ToggleGroupItemProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants> & {
    children: ReactNode;
  };

type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    children: ReactNode;
  };

const ToggleGroupContext = createContext<ToggleGroupContextValue>({ variant: 'outline', size: 'md' });

const Item: FC<ToggleGroupItemProps> = ({ className, children, variant, size, ...props }) => {
  const context = useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant: variant ?? context.variant, size: size ?? context.size }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
};

const ToggleGroup: FC<ToggleGroupProps> & { Item: FC<ToggleGroupItemProps> } = ({ className, variant, size, children, ...props }) => (
  <ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn('flex items-center gap-1', className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant: variant ?? 'outline', size: size ?? 'md' }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
);

ToggleGroup.Item = Item;

export default ToggleGroup;
```

In `scripts/design-system/codemods/rules.ts`, add above `RULE_SETS`:

```ts
const TOGGLE_VARIANTS: Readonly<Record<string, 'ghost' | null>> = { default: 'ghost', outline: null };

const TOGGLE_SIZES: Readonly<Record<string, 'sm' | 'lg' | null>> = { default: null, sm: 'sm', lg: 'lg' };

const toggleRule = (tag: string): TagRule => ({
  tag,
  keys: ['variant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    if (attrs.variant !== undefined) {
      const variant = lookup(TOGGLE_VARIANTS, attrs.variant, 'ToggleGroup variant');
      if (variant) out.variant = variant;
    }
    if (attrs.size !== undefined) {
      const size = lookup(TOGGLE_SIZES, attrs.size, 'ToggleGroup size');
      if (size) out.size = size;
    }
    return out;
  },
});
```

and add `menus: [toggleRule('ToggleGroup'), toggleRule('ToggleGroup.Item')],` to `RULE_SETS`.

- [ ] **Step 6: Migrate and update docs**

Run: `P ds:migrate menus`
Expected: `changed 36 tags in 1 files` (ToggleGroup.mdx), no `MANUAL` lines.

Update descriptions: `Select.mdx` → `'Single-select menu whose trigger shares the field shape (size, invalid); raised menu with accent check.'` (add `<Select.Trigger size="sm" invalid>` to a demo); `Command.mdx` → `'Searchable command list on a raised surface with mono shortcut hints.'`; `ToggleGroup.mdx` → `'Group of pressable toggles (outline or ghost, three sizes); active items take the accent tint.'`.

- [ ] **Step 7: Run tests and verify**

Run: `P exec vp fmt src scripts tests && P exec vp test --run && P exec tsc -b && P docs:lint && P ds:baseline && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add -A src scripts tests/design-system
git commit -m "feat(ui): Select field trigger, raised menus for Select/Command, ToggleGroup tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Plan A exit — clean folders guard, audits, four-way review

**Files:**
- Modify: `tests/design-system/forbidden-patterns.test.ts`
- Modify: any file the audits below flag (only within Plan A folders)

**Interfaces:**
- Consumes: everything above.
- Produces: an executable exit criterion — Plan A's `ui/` folders can never regain forbidden patterns.

- [ ] **Step 1: Write the guard test**

Append to `tests/design-system/forbidden-patterns.test.ts`:

```ts
/** Plan A (SP2 batches 0–3) primitives must stay free of every forbidden pattern. */
const CLEAN_UI_FOLDERS = [
  'button',
  'icon-button',
  'badge',
  'tag',
  'alert',
  'progress',
  'skeleton',
  'divider',
  'input',
  'checkbox',
  'checkbox-group',
  'radio-group',
  'switch',
  'select',
  'command',
  'toggle-group',
] as const;

describe('clean primitives', () => {
  it('Plan A ui folders contain no forbidden patterns', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) =>
      CLEAN_UI_FOLDERS.some((folder) => file.startsWith(`src/components/ui/${folder}/`)),
    );
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Prove it can fail, then pass**

Run: `echo 'export const Probe = () => <div className="bg-primary-15" />;' >> src/components/ui/badge/Badge.tsx && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL listing `src/components/ui/badge/Badge.tsx` (in both the ratchet and the clean-folders test).

Run: `git checkout src/components/ui/badge/Badge.tsx && P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: PASS.

- [ ] **Step 3: Audits**

Run the project skills on the Plan A folders (`src/components/ui/{button,icon-button,badge,tag,alert,progress,skeleton,divider,input,checkbox,checkbox-group,radio-group,switch,select,command,toggle-group}`): `forge:audit-rtl`, `forge:audit-dark-mode`, `forge:audit-a11y`, and `forge:i18n-sync` (en/ar parity for `common.json` and `components.json`). Fix every finding inside those folders with a test first where the finding is behavioral; record any finding outside Plan A scope in the ledger for SP3.

- [ ] **Step 4: Four-way visual review**

Start `P exec vp dev --open false --port 3123` in the background. With the playwright-cli skill, for theme `dark`/`light` (`localStorage['vite-ui-theme']` as a JSON string) × language `en`/`ar` (`localStorage['i18nextLng']`), screenshot `http://localhost:3123/components/button`, `/components/badge`, `/components/tag`, `/components/alert`, `/components/input`, `/components/select`, and `/dashboard` to `.superpowers/screens/sp2a-<theme>-<lang>-<page>.png`. Check against the approved mockups (`button-matrix`, `status-family-v2`, `inputs-family`): neutral solid primary, Oxblood only for accent/selection/focus, solid hover steps (no washed-out buttons), no side stripes, RTL Switch thumbs and Progress fills moving the right way. Stop the server.

- [ ] **Step 5: Full gate**

Run: `P exec vp check && P exec vp test --run && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && P exec vp build && P docs:lint`
Expected: `Found 0 errors` (warning count ≤ the count before Plan A), all tests PASS, both tsc 0, build `✓ built in`, docs lint passes.

- [ ] **Step 6: Commit**

```bash
git add -A src tests/design-system
git commit -m "test(design-system): guard Plan A primitives against forbidden patterns

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

