/**
 * Zod validation schema for the DTO generator config file.
 */

import { z } from 'zod';

export const SwaggerEndpointSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  outputDir: z.string().min(1),
});

export const FormattingConfigSchema = z.preprocess(
  // Accept legacy `prettier` / `eslint` keys from pre-Vite+ configs.
  (raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const { prettier, eslint, ...rest } = raw as Record<string, unknown>;
    return { format: prettier, lint: eslint, ...rest };
  },
  z.object({
    format: z.boolean().default(true),
    lint: z.boolean().default(true),
  }),
);

export const DtoGenConfigSchema = z.object({
  endpoints: z.array(SwaggerEndpointSchema).min(1),
  enumStrategy: z.enum(['type-literal', 'enum']).default('type-literal'),
  // prefault, not default: Zod 4's .default() returns {} as-is, skipping the inner defaults (format / lint: true).
  formatting: FormattingConfigSchema.prefault({}),
  selectedSchemas: z.record(z.string(), z.union([z.array(z.string()), z.literal('all')])).optional(),
  dryRun: z.boolean().default(false),
});

export type ValidatedConfig = z.infer<typeof DtoGenConfigSchema>;
