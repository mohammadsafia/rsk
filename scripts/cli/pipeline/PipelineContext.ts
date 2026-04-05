/**
 * PipelineContext — Shared mutable state passed through all pipeline steps.
 */

import type {
  DtoGenConfig,
  IRSchema,
  GeneratedFile,
  PipelineStats,
  OpenAPIDocument,
} from '../types/index.js';

export type PipelineContext = {
  config: DtoGenConfig;

  /** Fetched swagger documents, keyed by endpoint name (e.g. 'v1', 'v2'). */
  swagger: Map<string, OpenAPIDocument>;

  /** All parsed IR schemas, keyed by schema name. */
  schemas: Map<string, IRSchema>;

  /** Schema names selected for generation. */
  selectedSchemas: string[];

  /** Generated file objects (populated after GenerateStep). */
  generatedFiles: GeneratedFile[];

  /** Pipeline execution stats. */
  stats: PipelineStats;

  /** Current endpoint being processed. */
  currentEndpoint?: string;
};

export function createPipelineContext(config: DtoGenConfig): PipelineContext {
  return {
    config,
    swagger: new Map(),
    schemas: new Map(),
    selectedSchemas: [],
    generatedFiles: [],
    stats: {
      totalSchemas: 0,
      selectedSchemas: 0,
      autoResolvedSchemas: 0,
      filesGenerated: 0,
      filesCreated: 0,
      filesChanged: 0,
      filesUnchanged: 0,
      filesDeleted: 0,
      filesSkippedModified: 0,
      filesSkippedUntracked: 0,
      durationMs: 0,
    },
  };
}
