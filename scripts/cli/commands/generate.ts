/**
 * Generate command — Main entry point for DTO generation.
 * Supports both interactive and non-interactive modes.
 */

import type { DtoGenConfig, GenerateCommandOptions } from '../types/index.js';
import { loadConfig } from '../config/loader.js';
import { runInteractiveFlow } from '../prompts/interactive.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { createPipelineContext } from '../pipeline/PipelineContext.js';
import { PluginManager } from '../plugins/PluginManager.js';
import { createESLintPlugin } from '../plugins/ESLintPlugin.js';
import { createFetchStep } from '../pipeline/steps/FetchStep.js';
import { createParseStep } from '../pipeline/steps/ParseStep.js';
import { createFilterStep } from '../pipeline/steps/FilterStep.js';
import { createResolveStep } from '../pipeline/steps/ResolveStep.js';
import { createGenerateStep } from '../pipeline/steps/GenerateStep.js';
import { createFormatStep } from '../pipeline/steps/FormatStep.js';
import { createWriteStep } from '../pipeline/steps/WriteStep.js';
import { logger } from '../utils/logger.js';

export async function generateCommand(
  options: GenerateCommandOptions
): Promise<void> {
  try {
    let config = loadConfig(options.config);
    let selectedSchemas: string[] = [];

    // Interactive mode
    if (options.interactive) {
      const result = await runInteractiveFlow(config);
      config = result.config;
      selectedSchemas = result.selectedSchemas;
    } else {
      // Apply CLI overrides
      config = applyCLIOverrides(config, options);

      // If specific schemas provided via CLI
      if (options.schemas) {
        selectedSchemas = options.schemas.split(',').map((s) => s.trim());
      }
    }

    // Build and execute pipeline
    const pluginManager = new PluginManager();
    pluginManager.register(createESLintPlugin());

    const pipeline = new Pipeline(pluginManager)
      .addStep(createFetchStep())
      .addStep(createParseStep())
      .addStep(createFilterStep())
      .addStep(createResolveStep())
      .addStep(createGenerateStep())
      .addStep(createFormatStep())
      .addStep(createWriteStep());

    const ctx = createPipelineContext(config);
    ctx.selectedSchemas = selectedSchemas;

    const result = await pipeline.execute(ctx);

    Pipeline.printSummary(result);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

function applyCLIOverrides(
  config: DtoGenConfig,
  options: GenerateCommandOptions
): DtoGenConfig {
  const updated = { ...config };

  // Filter endpoints by version
  if (options.version && options.version !== 'all') {
    updated.endpoints = config.endpoints.filter(
      (ep) => ep.name === options.version
    );

    if (updated.endpoints.length === 0) {
      logger.warn(
        `No endpoint found for version "${options.version}". Available: ${config.endpoints.map((e) => e.name).join(', ')}`
      );
      updated.endpoints = config.endpoints;
    }
  }

  // Enum strategy
  if (options.enumStrategy) {
    updated.enumStrategy = options.enumStrategy;
  }

  // Dry run
  if (options.dryRun) {
    updated.dryRun = true;
  }

  return updated;
}
