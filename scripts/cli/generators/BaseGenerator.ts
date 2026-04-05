/**
 * BaseGenerator — Abstract base class for all code generators.
 * Provides template rendering via Handlebars.
 */

import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
import type { IRSchema, GeneratorOptions, GeneratorResult } from '../types/index.js';
import { getTemplatesDir } from '../utils/path.js';

const FILE_HEADER = `/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */`;

export abstract class BaseGenerator {
  abstract name: string;

  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Whether this generator can handle the given schema.
   */
  abstract supports(schema: IRSchema, options: GeneratorOptions): boolean;

  /**
   * Generate code for the given schema.
   */
  abstract generate(schema: IRSchema, options: GeneratorOptions): GeneratorResult;

  /**
   * Render a Handlebars template by name.
   */
  protected renderTemplate(
    templateName: string,
    data: Record<string, unknown>
  ): string {
    const template = this.loadTemplate(templateName);
    return template({ ...data, fileHeader: FILE_HEADER });
  }

  /**
   * Load and compile a Handlebars template, with caching.
   */
  private loadTemplate(name: string): HandlebarsTemplateDelegate {
    const cached = this.templateCache.get(name);
    if (cached) return cached;

    const templatePath = path.join(getTemplatesDir(), `${name}.hbs`);
    const source = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(source, { noEscape: true });

    this.templateCache.set(name, compiled);
    return compiled;
  }
}
