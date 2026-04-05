/**
 * FilterStep — Filters schemas based on user selection.
 * Provides per-schema feedback showing which schemas were found vs. not found.
 */

import type { PipelineStep } from '../Pipeline.js';
import { logger } from '../../utils/logger.js';

export function createFilterStep(): PipelineStep {
  return {
    name: 'Filter',
    async execute(ctx) {
      // If selectedSchemas is empty, it means "all schemas"
      if (ctx.selectedSchemas.length === 0) {
        ctx.selectedSchemas = Array.from(ctx.schemas.keys());
        logger.dim(`No filter applied — generating all ${ctx.selectedSchemas.length} schemas.`);
      } else {
        // selectedSchemas contains schema names without endpoint prefix
        // Match them against the full keys (endpoint::name)
        const requestedNames = [...ctx.selectedSchemas];
        const allKeys = Array.from(ctx.schemas.keys());

        logger.blank();
        logger.dim('  Schema selection:');

        const matched: string[] = [];

        for (const name of requestedNames) {
          const matchingKeys = allKeys.filter((key) => key.split('::')[1] === name);

          if (matchingKeys.length > 0) {
            matched.push(...matchingKeys);
            const endpoints = matchingKeys.map((k) => k.split('::')[0]).join(', ');
            logger.schemaFound(name, endpoints);
          } else {
            logger.schemaNotFound(name);
          }
        }

        ctx.selectedSchemas = matched;
      }

      ctx.stats.selectedSchemas = ctx.selectedSchemas.length;
    },
  };
}
