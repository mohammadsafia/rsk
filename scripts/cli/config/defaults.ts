/**
 * Default configuration values for the DTO generator.
 */

import type { DtoGenConfig, SwaggerEndpoint } from '../types/index.js';

export const DEFAULT_ENDPOINTS: SwaggerEndpoint[] = [
  {
    name: 'v1',
    url: 'https://dev-api.qlinica.app/med-legal/swagger/v1/swagger.json',
    outputDir: 'src/types/api',
  },
  {
    name: 'v2',
    url: 'https://dev-api.qlinica.app/med-legal/swagger/v2/swagger.json',
    outputDir: 'src/types/api-v2',
  },
];

export const DEFAULT_CONFIG: DtoGenConfig = {
  endpoints: DEFAULT_ENDPOINTS,
  enumStrategy: 'type-literal',
  formatting: {
    prettier: true,
    eslint: true,
  },
  dryRun: false,
};

export const CONFIG_FILENAME = '.dto-gen.json';
