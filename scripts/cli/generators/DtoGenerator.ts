/**
 * DtoGenerator — Generates TypeScript `export type` definitions for object schemas.
 * Produces output matching the existing codebase format exactly.
 */

import { BaseGenerator } from './BaseGenerator.js';
import type { IRSchema, GeneratorOptions, GeneratorResult } from '../types/index.js';
import { sanitizePropertyName } from '../utils/naming.js';

export class DtoGenerator extends BaseGenerator {
  name = 'dto';

  supports(schema: IRSchema, _options: GeneratorOptions): boolean {
    return schema.kind === 'object';
  }

  generate(schema: IRSchema, _options: GeneratorOptions): GeneratorResult {
    const properties = schema.properties.map((prop) => ({
      propName: sanitizePropertyName(prop.name),
      type: prop.type,
      optional: !prop.required,
      nullable: prop.nullable,
      deprecated: prop.deprecated,
      readOnly: prop.readOnly,
    }));

    const content = this.renderTemplate('dto', {
      name: schema.name,
      imports: schema.imports,
      properties,
    });

    return {
      filename: `${schema.name}.ts`,
      content: content + '\n',
    };
  }
}
