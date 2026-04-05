/**
 * Generator-related types for the code generation layer.
 */

import type { EnumStrategy } from './config.js';
import type { IRSchema } from './ir.js';

export type GeneratorOptions = {
  enumStrategy: EnumStrategy;
};

export type GeneratorResult = {
  filename: string;
  content: string;
};

export type GeneratedFile = {
  path: string;
  filename: string;
  content: string;
  hash: string;
  changed: boolean;
  created: boolean;
};

export type PipelineStats = {
  totalSchemas: number;
  selectedSchemas: number;
  autoResolvedSchemas: number;
  filesGenerated: number;
  filesCreated: number;
  filesChanged: number;
  filesUnchanged: number;
  filesDeleted: number;
  filesSkippedModified: number;
  filesSkippedUntracked: number;
  durationMs: number;
};

export type GeneratorEntry = {
  name: string;
  supports: (schema: IRSchema) => boolean;
  generate: (schema: IRSchema, options: GeneratorOptions) => GeneratorResult;
};
