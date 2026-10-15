/**
 * FormatStep — Formats generated files with Oxfmt (via Vite+).
 * (Linting is handled as a plugin after writing, since it needs files on disk.)
 */

import type { PipelineStep } from '../Pipeline.js';
import { logger } from '../../utils/logger.js';
import { formatTs } from '../../utils/format.js';

export function createFormatStep(): PipelineStep {
  return {
    name: 'Format',
    async execute(ctx) {
      if (!ctx.config.formatting.format) {
        logger.dim('Oxfmt formatting skipped (disabled in config).');
        return;
      }

      const spinner = logger.spinner(`Formatting ${ctx.generatedFiles.length} file(s) with Oxfmt...`);

      try {
        for (const file of ctx.generatedFiles) {
          file.content = await formatTs(file.path, file.content);
        }

        spinner.succeed('Files formatted with Oxfmt.');
      } catch (error) {
        spinner.fail('Oxfmt formatting failed.');
        logger.warn(`Oxfmt error: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
}
