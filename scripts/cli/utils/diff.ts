import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import type { IRSchema, EnumStrategy, DiffLine, SchemaDiffResult, DiffStatus } from '../types/index.js';
import { CodeGenerator } from '../core/CodeGenerator.js';
import { GeneratorRegistry } from '../generators/GeneratorRegistry.js';
import { resolveFromRoot } from './path.js';

export async function computeSchemaDiffs(
  schemas: Map<string, IRSchema>,
  outputDir: string,
  enumStrategy: EnumStrategy
): Promise<Map<string, SchemaDiffResult>> {
  const registry = GeneratorRegistry.createDefault();
  const codeGen = new CodeGenerator(registry);
  const modelsDir = resolveFromRoot(outputDir, 'models');
  const results = new Map<string, SchemaDiffResult>();

  for (const [name, schema] of schemas.entries()) {
    const generator = registry.resolve(schema, { enumStrategy });
    if (!generator) continue;

    const generated = codeGen.generate(schema, { enumStrategy });
    let expectedContent = generated.content;

    const filePath = path.join(modelsDir, generated.filename);

    try {
      const prettierConfig = await prettier.resolveConfig(filePath);
      expectedContent = await prettier.format(expectedContent, {
        ...(prettierConfig ?? {}),
        parser: 'typescript',
        filepath: filePath,
      });
    } catch {
      // skip formatting if prettier fails
    }

    if (!fs.existsSync(filePath)) {
      results.set(name, { name, status: 'new', lines: [] });
      continue;
    }

    const diskContent = fs.readFileSync(filePath, 'utf-8');

    if (normalizeForCompare(diskContent) === normalizeForCompare(expectedContent)) {
      results.set(name, { name, status: 'unchanged', lines: [] });
      continue;
    }

    const lines = computeLineDiff(diskContent, expectedContent);
    results.set(name, { name, status: 'updated', lines });
  }

  return results;
}

function normalizeForCompare(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n');
}

function computeLineDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.replace(/\r\n/g, '\n').split('\n');
  const newLines = newContent.replace(/\r\n/g, '\n').split('\n');
  const diff: DiffLine[] = [];

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      diff.push({ type: 'added', content: newLines[j] });
      j++;
      continue;
    }
    if (j >= newLines.length) {
      diff.push({ type: 'removed', content: oldLines[i] });
      i++;
      continue;
    }
    if (oldLines[i] === newLines[j]) {
      diff.push({ type: 'context', content: oldLines[i] });
      i++;
      j++;
      continue;
    }

    const newInOld = oldLines.indexOf(newLines[j], i);
    const oldInNew = newLines.indexOf(oldLines[i], j);

    if (newInOld === -1 && oldInNew === -1) {
      diff.push({ type: 'removed', content: oldLines[i] });
      diff.push({ type: 'added', content: newLines[j] });
      i++;
      j++;
    } else if (newInOld !== -1 && (oldInNew === -1 || newInOld - i <= oldInNew - j)) {
      while (i < newInOld) {
        diff.push({ type: 'removed', content: oldLines[i] });
        i++;
      }
    } else {
      while (j < oldInNew) {
        diff.push({ type: 'added', content: newLines[j] });
        j++;
      }
    }
  }

  return diff.filter((l) => l.type !== 'context');
}

export function sortByDiffStatus<T extends { status: DiffStatus }>(items: T[]): T[] {
  const order: Record<DiffStatus, number> = { new: 0, updated: 1, deleted: 2, unchanged: 3 };
  return items.sort((a, b) => order[a.status] - order[b.status]);
}
