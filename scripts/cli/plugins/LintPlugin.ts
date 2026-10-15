/**
 * LintPlugin — Lints generated files with Oxlint (`vp lint --fix`) after writing.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Plugin } from './Plugin.js';
import type { PipelineContext } from '../pipeline/PipelineContext.js';
import { logger } from '../utils/logger.js';
import { getProjectRoot } from '../utils/path.js';

const execFileAsync = promisify(execFile);

export function createLintPlugin(): Plugin {
  return {
    name: 'lint',
    hooks: {
      async afterWrite(ctx: PipelineContext): Promise<void> {
        if (!ctx.config.formatting.lint) return;
        if (ctx.config.dryRun) return;

        const changedFiles = ctx.generatedFiles.filter((f) => f.changed).map((f) => f.path);

        if (changedFiles.length === 0) return;

        try {
          await execFileAsync('vp', ['lint', '--fix', ...changedFiles], {
            cwd: getProjectRoot(),
          });
        } catch (error) {
          logger.warn(`Oxlint fix failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    },
  };
}
