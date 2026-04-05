/**
 * FetchStep — Fetches swagger specs from configured endpoints.
 */

import type { PipelineStep } from '../Pipeline.js';
import { SwaggerFetcher } from '../../core/SwaggerFetcher.js';
import { logger } from '../../utils/logger.js';

export function createFetchStep(): PipelineStep {
  return {
    name: 'Fetch',
    beforeHook: 'beforeFetch',
    afterHook: 'afterFetch',
    async execute(ctx) {
      const fetcher = new SwaggerFetcher();
      const endpoints = ctx.config.endpoints;

      const spinner = logger.spinner(
        `Fetching swagger specs from ${endpoints.length} endpoint(s)...`
      );

      try {
        for (const endpoint of endpoints) {
          const doc = await fetcher.fetch(endpoint.url);
          ctx.swagger.set(endpoint.name, doc);
        }

        spinner.succeed(
          `Fetched ${endpoints.length} swagger spec(s) successfully.`
        );
      } catch (error) {
        spinner.fail('Failed to fetch swagger specs.');
        throw error;
      }
    },
  };
}
