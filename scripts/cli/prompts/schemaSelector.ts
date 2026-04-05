import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import type { IRSchema, SchemaDiffResult } from '../types/index.js';
import searchableCheckbox from './searchableCheckbox.js';

type GenerationMode = 'all' | 'select' | 'enums-only' | 'dtos-only';

export async function selectGenerationMode(): Promise<GenerationMode> {
  return select({
    message: 'Select generation mode:',
    choices: [
      {
        name: 'Generate all schemas',
        value: 'all' as GenerationMode,
      },
      {
        name: 'Select specific schemas',
        value: 'select' as GenerationMode,
      },
      {
        name: 'Enums only',
        value: 'enums-only' as GenerationMode,
      },
      {
        name: 'DTOs only (object types)',
        value: 'dtos-only' as GenerationMode,
      },
    ],
  });
}

export async function selectSchemas(
  schemas: Map<string, IRSchema>,
  diffs?: Map<string, SchemaDiffResult>
): Promise<string[]> {
  const choices = Array.from(schemas.entries())
    .map(([key, schema]) => {
      const name = key.split('::')[1];
      const kindLabel =
        schema.kind === 'enum'
          ? '[enum]'
          : schema.kind === 'alias'
            ? '[alias]'
            : '[dto]';

      let diffLabel = '';
      let sortOrder = 2;
      if (diffs) {
        const diff = diffs.get(name);
        if (diff?.status === 'new') {
          diffLabel = chalk.green(' (new)');
          sortOrder = 0;
        } else if (diff?.status === 'updated') {
          diffLabel = chalk.yellow(' (updated)');
          sortOrder = 1;
        } else if (diff?.status === 'deleted') {
          diffLabel = chalk.red(' (deleted)');
          sortOrder = 2;
        } else {
          diffLabel = chalk.cyan(' (no diff)');
          sortOrder = 3;
        }
      }

      return {
        name: `${kindLabel} ${name}${diffLabel}`,
        value: name,
        checked: false,
        sortOrder,
      };
    })
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.value.localeCompare(b.value);
    });

  return searchableCheckbox({
    message: 'Select schemas (type to search, space to select, enter to confirm):',
    choices,
    pageSize: 20,
    required: true,
  });
}

export function filterSchemasByMode(
  schemas: Map<string, IRSchema>,
  mode: GenerationMode
): string[] {
  if (mode === 'all') {
    return [];
  }

  const result: string[] = [];

  for (const [key, schema] of schemas.entries()) {
    const name = key.split('::')[1];

    if (mode === 'enums-only' && schema.kind === 'enum') {
      result.push(name);
    } else if (mode === 'dtos-only' && schema.kind === 'object') {
      result.push(name);
    }
  }

  return result;
}
