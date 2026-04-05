/**
 * ParseStep — Parses fetched swagger specs into IR schemas.
 */

import type { PipelineStep } from '../Pipeline.js';
import { SchemaParser } from '../../core/SchemaParser.js';
import { logger } from '../../utils/logger.js';

export function createParseStep(): PipelineStep {
  return {
    name: 'Parse',
    beforeHook: 'beforeParse',
    afterHook: 'afterParse',
    async execute(ctx) {
      const parser = new SchemaParser();

      const spinner = logger.spinner('Parsing OpenAPI schemas...');

      try {
        for (const [endpointName, doc] of ctx.swagger.entries()) {
          const schemas = parser.parse(doc);

          for (const [name, schema] of schemas.entries()) {
            // Prefix key with endpoint name to avoid collisions
            ctx.schemas.set(`${endpointName}::${name}`, schema);
          }
        }

        ctx.stats.totalSchemas = ctx.schemas.size;
        spinner.succeed(
          `Parsed ${ctx.schemas.size} schema(s) from swagger specs.`
        );
      } catch (error) {
        spinner.fail('Failed to parse schemas.');
        throw error;
      }
    },
  };
}
