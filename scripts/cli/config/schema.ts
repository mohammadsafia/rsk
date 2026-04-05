/**
 * Zod validation schema for the DTO generator config file.
 */

import { z } from 'zod';

export const SwaggerEndpointSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  outputDir: z.string().min(1),
});

export const FormattingConfigSchema = z.object({
  prettier: z.boolean().default(true),
  eslint: z.boolean().default(true),
});

export const DtoGenConfigSchema = z.object({
  endpoints: z.array(SwaggerEndpointSchema).min(1),
  enumStrategy: z.enum(['type-literal', 'enum']).default('type-literal'),
  formatting: FormattingConfigSchema.default({}),
  selectedSchemas: z
    .record(z.union([z.array(z.string()), z.literal('all')]))
    .optional(),
  dryRun: z.boolean().default(false),
});

export type ValidatedConfig = z.infer<typeof DtoGenConfigSchema>;
