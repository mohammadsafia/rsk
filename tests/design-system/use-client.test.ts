// A Next app renders kit modules as client components: the ones that render or use hooks carry 'use client', and those
// modules export nothing a server file would call (that throws once the module is a client reference).
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { exportsServerValues, hasUseClient, isClientCandidate, needsUseClient } from '../../scripts/lib/use-client';
import { readTree } from '../../scripts/kit/core';

const ROOT = path.resolve(import.meta.dirname, '../..');
const modules = [...readTree(ROOT).keys()].filter(isClientCandidate);
const read = (file: string): string => readFileSync(path.join(ROOT, file), 'utf8');

describe("'use client'", () => {
  it('scans the kit’s rendering and hook modules', () => {
    expect(modules).toContain('src/components/ui/button/Button.tsx');
    expect(modules).not.toContain('src/components/ui/button/index.ts');
  });

  it('is on every kit module that renders or uses hooks', () => {
    expect(modules.filter((file) => needsUseClient(read(file), file) && !hasUseClient(read(file)))).toEqual([]);
  });

  it('is on no module that doesn’t need it (variants, constants, pure helpers)', () => {
    expect(modules.filter((file) => hasUseClient(read(file)) && !needsUseClient(read(file), file))).toEqual([]);
  });

  it('never marks a module that exports values a server file would call (cva variants, constants, class names)', () => {
    const marked = modules.filter((file) => hasUseClient(read(file)));
    expect(marked.flatMap((file) => exportsServerValues(read(file), file).map((name) => `${file}: ${name}`))).toEqual([]);
  });

  it('recognises the patterns', () => {
    expect(needsUseClient("import { useState } from 'react';\nexport const X = () => { useState(0); return null; };")).toBe(true);
    expect(needsUseClient('export const X = () => <div />;')).toBe(true);
    expect(needsUseClient('export const C = createContext(null);')).toBe(true);
    expect(needsUseClient("export const cn = (...a: string[]) => a.join(' ');")).toBe(false);
    expect(needsUseClient('export const first = <T,>(items: Array<T>): T => items[0];', 'list.ts')).toBe(false);
    expect(exportsServerValues("export const buttonVariants = cva('x');\nexport const TONES = ['a'];")).toEqual([
      'buttonVariants',
      'TONES',
    ]);
    expect(exportsServerValues('export type Tone = string;\nexport const Button = () => null;')).toEqual([]);
  });
});
