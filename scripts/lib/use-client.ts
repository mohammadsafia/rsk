/**
 * Which kit modules are client components in a Next app: those that render JSX, call a hook, create a context or declare
 * a class component. Everything else (barrels, cva variants, constants, pure helpers) stays directive-free, so a server
 * file can call it. tests/design-system/use-client.test.ts checks both halves; this adds or removes the directive:
 *
 *   tsx scripts/lib/use-client.ts --write
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { parseSync } from '@babel/core';

import { readTree } from '../kit/core';

type Node = { type: string; [key: string]: unknown };

const DIRECTIVE = /^\s*['"]use client['"];\s*/;
const HOOK = /^use[A-Z0-9]|^use$/;
const SERVER_VALUE = /Variants$|^[A-Z][A-Z0-9_]+$|ClassName$/;

/** Kit modules that may need the directive: rendering and hook folders, never tests, typings, barrels or test support. */
export const isClientCandidate = (file: string): boolean =>
  /^src\/(components|lib\/(hooks|contexts)|blocks)\//.test(file) &&
  /\.tsx?$/.test(file) &&
  !/(\.test\.|\.d\.ts$|\/index\.ts$|\/testing\.tsx$)/.test(file);

export const hasUseClient = (source: string): boolean => DIRECTIVE.test(source);

const parse = (source: string, file: string): Node[] =>
  (parseSync(source, {
    filename: file,
    babelrc: false,
    configFile: false,
    // JSX only in .tsx: in .ts, `<T>(x) => …` is a generic arrow, not an element.
    parserOpts: { plugins: file.endsWith('.ts') ? ['typescript'] : ['typescript', 'jsx'] },
  })?.program.body ?? []) as unknown as Node[];

const calleeName = (callee: Node): string | undefined => {
  if (callee.type === 'Identifier') return callee.name as string;
  if (callee.type === 'MemberExpression' && (callee.property as Node).type === 'Identifier')
    return (callee.property as Node).name as string;
  return undefined;
};

const isClientNode = (node: Node): boolean => {
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
  if (node.type === 'CallExpression') {
    const name = calleeName(node.callee as Node);
    if (name && (HOOK.test(name) || name === 'createContext')) return true;
  }
  if ((node.type === 'ClassDeclaration' || node.type === 'ClassExpression') && node.superClass) {
    const name = calleeName(node.superClass as Node);
    return name === 'Component' || name === 'PureComponent';
  }
  return false;
};

/** Depth-first: does any node in the tree satisfy `match`? */
const some = (value: unknown, match: (node: Node) => boolean): boolean => {
  if (Array.isArray(value)) return value.some((item) => some(item, match));
  if (!value || typeof value !== 'object') return false;
  const node = value as Node;
  if (typeof node.type === 'string' && match(node)) return true;
  return Object.entries(node).some(([key, child]) => key !== 'loc' && key !== 'leadingComments' && some(child, match));
};

/** True when the module renders, calls a hook, creates a context or declares a class component. */
export const needsUseClient = (source: string, file = 'module.tsx'): boolean => some(parse(source, file), isClientNode);

/** Exported values a server file may call — cva variants, UPPER_CASE constants, *ClassName strings — by name. */
export const exportsServerValues = (source: string, file = 'module.tsx'): string[] =>
  parse(source, file).flatMap((node) => {
    if (node.type !== 'ExportNamedDeclaration' || node.exportKind === 'type') return [];
    const declaration = node.declaration as Node | null;
    const names = declaration
      ? declaration.type === 'VariableDeclaration'
        ? (declaration.declarations as Node[]).map((item) => (item.id as Node).name as string)
        : declaration.type === 'FunctionDeclaration'
          ? [(declaration.id as Node).name as string]
          : []
      : (node.specifiers as Node[]).filter((item) => item.exportKind !== 'type').map((item) => (item.exported as Node).name as string);
    return names.filter((name) => SERVER_VALUE.test(name));
  });

if (process.argv.includes('--write')) {
  const root = path.resolve(import.meta.dirname, '../..');
  for (const file of readTree(root).keys()) {
    if (!isClientCandidate(file)) continue;
    const full = path.join(root, file);
    const source = readFileSync(full, 'utf8');
    const marked = hasUseClient(source);
    const needed = needsUseClient(source, file);
    if (needed && !marked) writeFileSync(full, `'use client';\n\n${source}`);
    if (!needed && marked) writeFileSync(full, source.replace(DIRECTIVE, ''));
  }
}
