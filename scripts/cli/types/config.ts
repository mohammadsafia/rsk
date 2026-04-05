/**
 * Configuration types for the DTO generator CLI.
 */

export type EnumStrategy = 'type-literal' | 'enum';

export type SwaggerEndpoint = {
  name: string;
  url: string;
  outputDir: string;
};

export type FormattingConfig = {
  prettier: boolean;
  eslint: boolean;
};

export type DtoGenConfig = {
  endpoints: SwaggerEndpoint[];
  enumStrategy: EnumStrategy;
  formatting: FormattingConfig;
  selectedSchemas?: Record<string, string[] | 'all'>;
  dryRun: boolean;
};

export type GenerateCommandOptions = {
  interactive?: boolean;
  config?: string;
  version?: string;
  schemas?: string;
  enumStrategy?: EnumStrategy;
  dryRun?: boolean;
};

export type ListCommandOptions = {
  version?: string;
  json?: boolean;
  diff?: boolean;
};

export type CleanCommandOptions = {
  version?: string;
  dryRun?: boolean;
};
