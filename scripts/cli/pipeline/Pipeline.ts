/**
 * Pipeline — Orchestrates execution of pipeline steps with plugin hooks.
 * Middleware-inspired: each step transforms the shared PipelineContext.
 */

import type { PipelineContext } from './PipelineContext.js';
import type { PluginManager } from '../plugins/PluginManager.js';
import type { HookName } from '../plugins/Plugin.js';
import { logger } from '../utils/logger.js';

export type PipelineStep = {
  name: string;
  beforeHook?: HookName;
  afterHook?: HookName;
  execute: (ctx: PipelineContext) => Promise<void>;
};

export class Pipeline {
  private steps: PipelineStep[] = [];
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  /**
   * Add a step to the pipeline.
   */
  addStep(step: PipelineStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Execute all pipeline steps in order.
   */
  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const startTime = Date.now();

    for (const step of this.steps) {
      // Run before hook
      if (step.beforeHook) {
        await this.pluginManager.runHook(step.beforeHook, ctx);
      }

      // Execute the step
      await step.execute(ctx);

      // Run after hook
      if (step.afterHook) {
        await this.pluginManager.runHook(step.afterHook, ctx);
      }
    }

    ctx.stats.durationMs = Date.now() - startTime;
    return ctx;
  }

  /**
   * Print a summary of the pipeline execution.
   */
  static printSummary(ctx: PipelineContext): void {
    logger.blank();
    logger.heading('Summary');
    const rows: [string, string | number][] = [
      ['Total schemas', ctx.stats.totalSchemas],
      ['Selected', ctx.stats.selectedSchemas],
    ];

    if (ctx.stats.autoResolvedSchemas > 0) {
      rows.push(['Auto-resolved', ctx.stats.autoResolvedSchemas]);
    }

    rows.push(
      ['Files generated', ctx.stats.filesGenerated],
      ['Files created', ctx.stats.filesCreated],
      ['Files updated', ctx.stats.filesChanged],
      ['Files unchanged', ctx.stats.filesUnchanged],
    );

    if (ctx.stats.filesDeleted > 0) {
      rows.push(['Files deleted (not in BE)', ctx.stats.filesDeleted]);
    }
    if (ctx.stats.filesSkippedModified > 0) {
      rows.push(['Files skipped (modified)', ctx.stats.filesSkippedModified]);
    }
    if (ctx.stats.filesSkippedUntracked > 0) {
      rows.push(['Files skipped (untracked)', ctx.stats.filesSkippedUntracked]);
    }

    rows.push(
      ['Duration', `${(ctx.stats.durationMs / 1000).toFixed(2)}s`],
    );

    logger.table(rows);
    logger.blank();
  }
}
