/**
 * Version selector prompt — Select which API version(s) to generate.
 */

import { checkbox } from '@inquirer/prompts';
import type { SwaggerEndpoint } from '../types/index.js';

export async function selectVersions(
  endpoints: SwaggerEndpoint[]
): Promise<SwaggerEndpoint[]> {
  const selected = await checkbox({
    message: 'Select API version(s) to generate:',
    choices: endpoints.map((ep) => ({
      name: `${ep.name} (${ep.url})`,
      value: ep.name,
      checked: true,
    })),
    required: true,
  });

  return endpoints.filter((ep) => selected.includes(ep.name));
}
