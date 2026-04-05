/**
 * ESLintPlugin — Lints generated files with ESLint --fix after writing.
 */

import { ESLint } from 'eslint';
import type { Plugin } from './Plugin.js';
import type { PipelineContext } from '../pipeline/PipelineContext.js';
import { logger } from '../utils/logger.js';

export function createESLintPlugin(): Plugin {
  return {
    name: 'eslint',
    hooks: {
      async afterWrite(ctx: PipelineContext): Promise<void> {
        if (!ctx.config.formatting.eslint) return;
        if (ctx.config.dryRun) return;

        const changedFiles = ctx.generatedFiles
          .filter((f) => f.changed)
          .map((f) => f.path);

        if (changedFiles.length === 0) return;

        const eslint = new ESLint({ fix: true });
        const results = await eslint.lintFiles(changedFiles);

        try {
          await ESLint.outputFixes(results);
        } catch (error) {
          logger.warn(
            `ESLint fix failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      },
    },
  };
}
