/**
 * EnumGenerator — Strategy for generating TypeScript enums.
 * e.g. `export enum Status { Active = 'Active', Inactive = 'Inactive' }`
 */

import { BaseGenerator } from './BaseGenerator.js';
import type { IRSchema, GeneratorOptions, GeneratorResult } from '../types/index.js';
import { toPascalCase } from '../utils/naming.js';

export class EnumGenerator extends BaseGenerator {
  name = 'enum';

  supports(schema: IRSchema, options: GeneratorOptions): boolean {
    return schema.kind === 'enum' && options.enumStrategy === 'enum';
  }

  generate(schema: IRSchema, _options: GeneratorOptions): GeneratorResult {
    const members = (schema.enumValues ?? []).map((value) => ({
      key: toPascalCase(value),
      value,
    }));

    const content = this.renderTemplate('enum', {
      name: schema.name,
      members,
    });

    return {
      filename: `${schema.name}.ts`,
      content: content + '\n',
    };
  }
}
