/**
 * CodeGenerator — Orchestrates code generation via the GeneratorRegistry.
 * Delegates to the appropriate generator based on schema kind and options.
 */

import type {
  IRSchema,
  GeneratorOptions,
  GeneratorResult,
} from '../types/index.js';
import { GeneratorRegistry } from '../generators/GeneratorRegistry.js';

export class CodeGenerator {
  private registry: GeneratorRegistry;

  constructor(registry: GeneratorRegistry) {
    this.registry = registry;
  }

  /**
   * Generate code for a single schema.
   */
  generate(schema: IRSchema, options: GeneratorOptions): GeneratorResult {
    const generator = this.registry.resolve(schema, options);

    if (!generator) {
      throw new Error(
        `No generator found for schema "${schema.name}" (kind: ${schema.kind})`
      );
    }

    return generator.generate(schema, options);
  }

  /**
   * Generate code for multiple schemas.
   */
  generateAll(
    schemas: IRSchema[],
    options: GeneratorOptions
  ): GeneratorResult[] {
    return schemas.map((schema) => this.generate(schema, options));
  }
}
