/**
 * SwaggerFetcher — Fetches and caches OpenAPI/Swagger specs from URLs.
 */

import type { OpenAPIDocument } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class SwaggerFetcher {
  private cache: Map<string, OpenAPIDocument> = new Map();

  async fetch(url: string): Promise<OpenAPIDocument> {
    const cached = this.cache.get(url);
    if (cached) {
      logger.dim(`Using cached swagger spec for ${url}`);
      return cached;
    }

    const response = await globalThis.fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch swagger spec from ${url}: ${response.status} ${response.statusText}`);
    }

    const doc = (await response.json()) as OpenAPIDocument;
    this.validate(doc, url);
    this.cache.set(url, doc);
    return doc;
  }

  async fetchMultiple(
    endpoints: Array<{ name: string; url: string }>
  ): Promise<Map<string, OpenAPIDocument>> {
    const results = new Map<string, OpenAPIDocument>();

    for (const endpoint of endpoints) {
      const doc = await this.fetch(endpoint.url);
      results.set(endpoint.name, doc);
    }

    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private validate(doc: OpenAPIDocument, url: string): void {
    if (!doc.openapi && !doc.swagger) {
      throw new Error(`Invalid OpenAPI/Swagger document at ${url}: missing openapi or swagger version field.`);
    }

    const schemas = this.getSchemas(doc);
    if (!schemas || Object.keys(schemas).length === 0) {
      logger.warn(`No schemas found in swagger spec at ${url}.`);
    }
  }

  private getSchemas(
    doc: OpenAPIDocument
  ): Record<string, unknown> | undefined {
    // OpenAPI 3.x uses components.schemas, Swagger 2.x uses definitions
    return (doc.components?.schemas ?? doc.definitions) as Record<string, unknown> | undefined;
  }
}
