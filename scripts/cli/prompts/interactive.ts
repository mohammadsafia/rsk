import chalk from 'chalk';
import type { DtoGenConfig, IRSchema, SchemaDiffResult, SwaggerEndpoint } from '../types/index.js';
import { selectVersions } from './versionSelector.js';
import {
  selectGenerationMode,
  selectSchemas,
  filterSchemasByMode,
} from './schemaSelector.js';
import { selectEnumStrategy, selectAdditionalOptions } from './strategySelector.js';
import { SwaggerFetcher } from '../core/SwaggerFetcher.js';
import { SchemaParser } from '../core/SchemaParser.js';
import { logger } from '../utils/logger.js';
import { saveConfig } from '../config/loader.js';
import { computeSchemaDiffs } from '../utils/diff.js';

export type InteractiveResult = {
  config: DtoGenConfig;
  selectedSchemas: string[];
};

export async function runInteractiveFlow(
  baseConfig: DtoGenConfig
): Promise<InteractiveResult> {
  console.log();
  console.log(chalk.bold.cyan('  DTO Generator'));
  console.log(chalk.dim('  Generate TypeScript DTOs from OpenAPI/Swagger specs'));
  console.log();

  const selectedEndpoints = await selectVersions(baseConfig.endpoints);

  const fetcher = new SwaggerFetcher();
  const parser = new SchemaParser();

  const spinner = logger.spinner('Fetching swagger specs...');
  const allSchemas = new Map<string, IRSchema>();
  const parsedByEndpoint = new Map<string, Map<string, IRSchema>>();

  for (const endpoint of selectedEndpoints) {
    const doc = await fetcher.fetch(endpoint.url);
    const schemas = parser.parse(doc);
    parsedByEndpoint.set(endpoint.name, schemas);
    for (const [name, schema] of schemas.entries()) {
      allSchemas.set(`${endpoint.name}::${name}`, schema);
    }
  }
  spinner.succeed(`Found ${allSchemas.size} schemas across ${selectedEndpoints.length} endpoint(s).`);

  const diffSpinner = logger.spinner('Computing diffs...');
  const allDiffs = new Map<string, SchemaDiffResult>();
  for (const endpoint of selectedEndpoints) {
    const schemas = parsedByEndpoint.get(endpoint.name)!;
    const endpointDiffs = await computeSchemaDiffs(schemas, endpoint.outputDir, baseConfig.enumStrategy);
    for (const [name, diff] of endpointDiffs.entries()) {
      allDiffs.set(name, diff);
    }
  }
  diffSpinner.succeed('Diff computation complete.');

  const mode = await selectGenerationMode();

  let selectedSchemaNames: string[] = [];

  if (mode === 'select') {
    selectedSchemaNames = await selectSchemas(allSchemas, allDiffs);
  } else if (mode === 'enums-only' || mode === 'dtos-only') {
    selectedSchemaNames = filterSchemasByMode(allSchemas, mode);
    logger.dim(`Pre-selected ${selectedSchemaNames.length} schema(s) based on mode.`);
  }

  const enumStrategy = await selectEnumStrategy();

  const options = await selectAdditionalOptions();

  const config: DtoGenConfig = {
    endpoints: selectedEndpoints,
    enumStrategy,
    formatting: {
      prettier: options.prettier,
      eslint: options.eslint,
    },
    dryRun: options.dryRun,
  };

  if (options.saveConfig) {
    const configToSave: DtoGenConfig = {
      ...config,
      selectedSchemas: buildSelectedSchemasMap(
        selectedEndpoints,
        selectedSchemaNames
      ),
    };
    saveConfig(configToSave);
  }

  return {
    config,
    selectedSchemas: selectedSchemaNames,
  };
}

function buildSelectedSchemasMap(
  endpoints: SwaggerEndpoint[],
  schemaNames: string[]
): Record<string, string[] | 'all'> {
  if (schemaNames.length === 0) {
    return Object.fromEntries(endpoints.map((ep) => [ep.name, 'all']));
  }

  return Object.fromEntries(endpoints.map((ep) => [ep.name, schemaNames]));
}
