/**
 * GeneratorRegistry — Registry pattern for managing multiple generators.
 * Resolves the correct generator for a schema based on kind and options.
 */

import type { IRSchema, GeneratorOptions } from '../types/index.js';
import { BaseGenerator } from './BaseGenerator.js';
import { DtoGenerator } from './DtoGenerator.js';
import { TypeLiteralGenerator } from './TypeLiteralGenerator.js';
import { EnumGenerator } from './EnumGenerator.js';

export class GeneratorRegistry {
  private generators: BaseGenerator[] = [];

  /**
   * Register a generator.
   */
  register(generator: BaseGenerator): this {
    this.generators.push(generator);
    return this;
  }

  /**
   * Find the first generator that supports the given schema and options.
   */
  resolve(
    schema: IRSchema,
    options: GeneratorOptions
  ): BaseGenerator | undefined {
    return this.generators.find((g) => g.supports(schema, options));
  }

  /**
   * List all registered generator names.
   */
  list(): string[] {
    return this.generators.map((g) => g.name);
  }

  /**
   * Create a registry pre-loaded with all built-in generators.
   */
  static createDefault(): GeneratorRegistry {
    const registry = new GeneratorRegistry();
    registry.register(new DtoGenerator());
    registry.register(new TypeLiteralGenerator());
    registry.register(new EnumGenerator());
    return registry;
  }
}
