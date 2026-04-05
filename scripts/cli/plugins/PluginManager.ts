/**
 * PluginManager — Registers plugins and executes their hooks.
 */

import type { HookName, Plugin } from './Plugin.js';
import type { PipelineContext } from '../pipeline/PipelineContext.js';
import { logger } from '../utils/logger.js';

export class PluginManager {
  private plugins: Plugin[] = [];

  /**
   * Register a plugin.
   */
  register(plugin: Plugin): this {
    this.plugins.push(plugin);
    logger.dim(`Plugin registered: ${plugin.name}`);
    return this;
  }

  /**
   * Run all plugin hooks for a given hook name.
   */
  async runHook(hookName: HookName, ctx: PipelineContext): Promise<void> {
    for (const plugin of this.plugins) {
      const hook = plugin.hooks[hookName];
      if (hook) {
        await hook(ctx);
      }
    }
  }

  /**
   * List registered plugins.
   */
  list(): string[] {
    return this.plugins.map((p) => p.name);
  }
}
