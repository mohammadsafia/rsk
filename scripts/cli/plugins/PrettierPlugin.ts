/**
 * PrettierPlugin — Formats generated files with Prettier after generation.
 */

import prettier from 'prettier';
import type { Plugin } from './Plugin.js';
import type { PipelineContext } from '../pipeline/PipelineContext.js';

export function createPrettierPlugin(): Plugin {
  return {
    name: 'prettier',
    hooks: {
      async afterGenerate(ctx: PipelineContext): Promise<void> {
        if (!ctx.config.formatting.prettier) return;

        for (const file of ctx.generatedFiles) {
          const config = await prettier.resolveConfig(file.path);

          file.content = await prettier.format(file.content, {
            ...(config ?? {}),
            parser: 'typescript',
            filepath: file.path,
          });
        }
      },
    },
  };
}
