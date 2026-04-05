/**
 * FormatStep — Formats generated files with Prettier.
 * (ESLint is handled as a plugin after writing, since it needs files on disk.)
 */

import prettier from 'prettier';
import type { PipelineStep } from '../Pipeline.js';
import { logger } from '../../utils/logger.js';

export function createFormatStep(): PipelineStep {
  return {
    name: 'Format',
    async execute(ctx) {
      if (!ctx.config.formatting.prettier) {
        logger.dim('Prettier formatting skipped (disabled in config).');
        return;
      }

      const spinner = logger.spinner(
        `Formatting ${ctx.generatedFiles.length} file(s) with Prettier...`
      );

      try {
        for (const file of ctx.generatedFiles) {
          const config = await prettier.resolveConfig(file.path);

          file.content = await prettier.format(file.content, {
            ...(config ?? {}),
            parser: 'typescript',
            filepath: file.path,
          });
        }

        spinner.succeed('Files formatted with Prettier.');
      } catch (error) {
        spinner.fail('Prettier formatting failed.');
        logger.warn(
          `Prettier error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  };
}
