/**
 * TypeLiteralGenerator — Strategy for generating enum-like types as union type literals.
 * e.g. `export type Status = 'Active' | 'Inactive';`
 */

import { BaseGenerator } from './BaseGenerator.js';
import type { IRSchema, GeneratorOptions, GeneratorResult } from '../types/index.js';

export class TypeLiteralGenerator extends BaseGenerator {
  name = 'type-literal';

  supports(schema: IRSchema, options: GeneratorOptions): boolean {
    return schema.kind === 'enum' && options.enumStrategy === 'type-literal';
  }

  generate(schema: IRSchema, _options: GeneratorOptions): GeneratorResult {
    const values = (schema.enumValues ?? []).map((v) => `'${v}'`).join(' | ');

    const content = this.renderTemplate('type-literal', {
      name: schema.name,
      values,
    });

    return {
      filename: `${schema.name}.ts`,
      content: content + '\n',
    };
  }
}
