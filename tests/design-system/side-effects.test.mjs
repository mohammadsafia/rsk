// tests/design-system/side-effects.test.mjs — package.json "sideEffects" names every module whose import must run.
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseSync } from '@babel/core';
import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const listed = pkg.sideEffects ?? [];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
// src/, plus a Next app's app/ (its layouts and pages are modules too).
const all = ['src', 'app'].filter((dir) => existsSync(path.join(ROOT, dir))).flatMap((dir) => walk(path.join(ROOT, dir)));
// CLI scripts under component-docs/scripts run with tsx and are never bundled, so they are not modules here.
const sources = all.filter(
  (file) => /\.(ts|tsx)$/.test(file) && !/\.(test|d)\.tsx?$/.test(file) && !/test-utils|component-docs\/scripts\//.test(file),
);

/**
 * Effects that only matter to code that uses the module's exports. When those are used the module is kept and the
 * effect runs, so they need no sideEffects entry.
 */
const TIED_TO_EXPORTS = {
  './src/lib/hooks/motion/useFlight.ts': 'records the last press from load, for useFlight; only its users read it',
  './src/types/DataTable.ts': "import '@tanstack/react-table' only makes the file's declare-module augmentation apply (types)",
};

/**
 * Generated files whose effect depends on what was generated: src/blocks/index.ts registers the added blocks' menu
 * labels only when a block has menu entries. Tied to exports too (the menu always uses its blockNav).
 */
const GENERATED = {
  './src/blocks/index.ts': "registers added blocks' menu labels; the menu always uses its blockNav, so it is always kept",
};
const MARKERS = new Set(['server-only', 'client-only']);
const rel = (file) => `./${path.relative(ROOT, file).split(path.sep).join('/')}`;

/** Whether a package.json sideEffects entry covers a file ("*.css" matches by extension; "./src/x.ts" exactly). */
const covers = (entry, file) => (entry.startsWith('./') ? entry === rel(file) : file.endsWith(entry.replace('*', '')));

const ALLOWED = new Set([
  'ImportDeclaration',
  'ExportNamedDeclaration',
  'ExportDefaultDeclaration',
  'ExportAllDeclaration',
  'VariableDeclaration',
  'FunctionDeclaration',
  'ClassDeclaration',
  'EmptyStatement',
]);

/** The identifier a member chain starts from: Dialog.Content.displayName → Dialog. */
const rootOf = (node) => {
  let current = node;
  while (current.type === 'MemberExpression' || current.type === 'CallExpression')
    current = current.type === 'CallExpression' ? current.callee : current.object;
  return current.type === 'Identifier' ? current.name : undefined;
};

/** Top-level statements that run something on import (other than statics on the file's own declarations). */
const effectsIn = (file) => {
  const ast = parseSync(readFileSync(file, 'utf8'), {
    filename: file,
    babelrc: false,
    configFile: false,
    // JSX only in .tsx: in .ts, `<T>(x) => …` is a generic arrow, not an element.
    parserOpts: { plugins: file.endsWith('.tsx') ? ['typescript', 'jsx'] : ['typescript'] },
  });
  const declared = new Set();
  for (const node of ast.program.body) {
    const declaration = node.type.startsWith('Export') ? node.declaration : node;
    if (declaration?.id?.name) declared.add(declaration.id.name);
    for (const variable of declaration?.declarations ?? []) if (variable.id?.name) declared.add(variable.id.name);
  }
  return ast.program.body.flatMap((node) => {
    if (node.type.startsWith('TS')) return [];
    if (node.type === 'ImportDeclaration')
      // 'server-only' / 'client-only' mark where a module may run (they throw elsewhere); they change nothing on import.
      return node.specifiers.length || node.importKind === 'type' || node.source.value.endsWith('.css') || MARKERS.has(node.source.value)
        ? []
        : [`bare import '${node.source.value}'`];
    if (ALLOWED.has(node.type)) return [];
    // X.Sub = …, X.Sub.displayName = …, instance.interceptors.request.use(…): acting on the file's own declaration only
    // matters when that declaration is used, and then the module is kept.
    const expression = node.expression;
    const target =
      expression?.type === 'AssignmentExpression' ? expression.left : expression?.type === 'CallExpression' ? expression.callee : null;
    if (target?.type === 'MemberExpression' && declared.has(rootOf(target))) return [];
    return [`${node.type} at line ${node.loc.start.line}`];
  });
};

describe('package.json sideEffects', () => {
  it('lists every module that does something when imported', () => {
    const unlisted = sources
      .map((file) => [rel(file), effectsIn(file)])
      .filter(
        ([file, effects]) =>
          effects.length &&
          !(file in TIED_TO_EXPORTS) &&
          !(file in GENERATED) &&
          !listed.some((entry) => covers(entry, path.join(ROOT, file))),
      );
    expect(unlisted).toEqual([]);
  });

  it('keeps its own exceptions honest: every tied-to-exports file exists and still has an effect', () => {
    for (const file of Object.keys(TIED_TO_EXPORTS)) expect(effectsIn(path.join(ROOT, file)).length).toBeGreaterThan(0);
  });

  it('lists nothing stale: every entry matches a file', () => {
    expect(listed.filter((entry) => !all.some((file) => covers(entry, file)))).toEqual([]);
  });

  it('reads a bare server-only or client-only import as a marker, not an effect', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'side-effects-'));
    const file = path.join(dir, 'secret.ts');
    writeFileSync(file, "import 'server-only';\nimport 'client-only';\nexport const secret = () => 'x';\n");
    expect(effectsIn(file)).toEqual([]);
    writeFileSync(file, "import './register';\nexport const secret = () => 'x';\n");
    expect(effectsIn(file)).toEqual(["bare import './register'"]);
  });
});
