/**
 * Strategy selector prompt — Choose between enum and type literal generation.
 */

import { select, checkbox } from '@inquirer/prompts';
import type { EnumStrategy } from '../types/index.js';

export async function selectEnumStrategy(): Promise<EnumStrategy> {
  return select({
    message: 'How should enum-like types be generated?',
    choices: [
      {
        name: "Type literals  (type Status = 'Active' | 'Inactive')",
        value: 'type-literal' as EnumStrategy,
      },
      {
        name: 'Enums          (enum Status { Active, Inactive })',
        value: 'enum' as EnumStrategy,
      },
    ],
  });
}

type AdditionalOption =
  | 'prettier'
  | 'eslint'
  | 'dryRun'
  | 'saveConfig';

export type AdditionalOptions = {
  prettier: boolean;
  eslint: boolean;
  dryRun: boolean;
  saveConfig: boolean;
};

export async function selectAdditionalOptions(): Promise<AdditionalOptions> {
  const selected = await checkbox<AdditionalOption>({
    message: 'Additional options:',
    choices: [
      { name: 'Format with Prettier', value: 'prettier', checked: true },
      { name: 'Lint with ESLint', value: 'eslint', checked: true },
      { name: 'Dry run (preview without writing)', value: 'dryRun', checked: false },
      { name: 'Save selection to config file', value: 'saveConfig', checked: false },
    ],
  });

  return {
    prettier: selected.includes('prettier'),
    eslint: selected.includes('eslint'),
    dryRun: selected.includes('dryRun'),
    saveConfig: selected.includes('saveConfig'),
  };
}
