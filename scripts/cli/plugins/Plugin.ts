/**
 * Plugin type definitions and hook system.
 * Inspired by Rollup/Vite plugin architecture.
 */

import type { PipelineContext } from '../pipeline/PipelineContext.js';

export type HookName =
  | 'beforeFetch'
  | 'afterFetch'
  | 'beforeParse'
  | 'afterParse'
  | 'beforeGenerate'
  | 'afterGenerate'
  | 'beforeWrite'
  | 'afterWrite';

export type HookFn = (ctx: PipelineContext) => Promise<void> | void;

export type Plugin = {
  name: string;
  hooks: Partial<Record<HookName, HookFn>>;
};
