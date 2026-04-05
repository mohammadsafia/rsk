/**
 * BarrelGenerator — Generates index.ts barrel export files
 * that match the existing project format.
 */

import type { EnumStrategy, IRSchema } from '../types/index.js';

const FILE_HEADER = `/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */`;

export class BarrelGenerator {
  /**
   * Generate a barrel index.ts content from a list of schema names.
   */
  generate(
    schemas: IRSchema[],
    enumStrategy: EnumStrategy
  ): string {
    const sortedSchemas = [...schemas].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const exports = sortedSchemas.map((schema) => {
      // Enums use value export; types use type-only export
      const isEnum = schema.kind === 'enum' && enumStrategy === 'enum';
      const keyword = isEnum ? 'export' : 'export type';
      return `${keyword} { ${schema.name} } from './models/${schema.name}';`;
    });

    return `${FILE_HEADER}\n\n${exports.join('\n')}\n`;
  }

  /**
   * Generate a barrel for a list of filenames (without reading IR).
   */
  generateFromFilenames(
    filenames: string[],
    enumStrategy: EnumStrategy,
    enumNames: Set<string> = new Set()
  ): string {
    const sorted = [...filenames].sort();

    const exports = sorted.map((name) => {
      const isEnum = enumNames.has(name) && enumStrategy === 'enum';
      const keyword = isEnum ? 'export' : 'export type';
      return `${keyword} { ${name} } from './models/${name}';`;
    });

    return `${FILE_HEADER}\n\n${exports.join('\n')}\n`;
  }
}
