import fs from 'node:fs';
import path from 'node:path';
import type { CleanCommandOptions } from '../types/index.js';
import { loadConfig } from '../config/loader.js';
import { SwaggerFetcher } from '../core/SwaggerFetcher.js';
import { SchemaParser } from '../core/SchemaParser.js';
import { BarrelGenerator } from '../core/BarrelGenerator.js';
import { ManifestManager } from '../core/ManifestManager.js';
import { FileWriter } from '../core/FileWriter.js';
import { resolveFromRoot } from '../utils/path.js';
import { logger } from '../utils/logger.js';

export async function cleanCommand(options: CleanCommandOptions): Promise<void> {
  try {
    const config = loadConfig();
    const fetcher = new SwaggerFetcher();
    const parser = new SchemaParser();

    let endpoints = config.endpoints;
    if (options.version && options.version !== 'all') {
      endpoints = endpoints.filter((ep) => ep.name === options.version);
    }

    for (const endpoint of endpoints) {
      const spinner = logger.spinner(`Fetching schemas from ${endpoint.name}...`);
      const doc = await fetcher.fetch(endpoint.url);
      const schemas = parser.parse(doc);
      spinner.stop();

      const beSchemaNames = new Set(schemas.keys());
      const modelsDir = resolveFromRoot(endpoint.outputDir, 'models');
      const outputDir = resolveFromRoot(endpoint.outputDir);
      const manifest = new ManifestManager(outputDir);

      if (!fs.existsSync(modelsDir)) {
        logger.info(`No models directory found for ${endpoint.name}, skipping.`);
        continue;
      }

      logger.heading(`Cleaning ${endpoint.name} (${modelsDir})`);

      let deletedCount = 0;
      const remainingFiles: string[] = [];
      const enumNames = new Set(
        Array.from(schemas.entries())
          .filter(([, s]) => s.kind === 'enum')
          .map(([name]) => name)
      );

      for (const file of fs.readdirSync(modelsDir).sort()) {
        if (!file.endsWith('.ts')) continue;
        const name = file.replace(/\.ts$/, '');
        const filePath = path.join(modelsDir, file);

        if (beSchemaNames.has(name)) {
          remainingFiles.push(name);
          manifest.setFromDisk(file, filePath);
          continue;
        }

        const relativePath = path.relative(process.cwd(), filePath);
        if (options.dryRun) {
          logger.fileDeleted(`${relativePath} (dry-run)`);
        } else {
          fs.unlinkSync(filePath);
          logger.fileDeleted(relativePath);
        }
        manifest.remove(file);
        deletedCount++;
      }

      if (!options.dryRun) {
        const barrelGen = new BarrelGenerator();
        const barrelContent = barrelGen.generateFromFilenames(
          remainingFiles,
          config.enumStrategy,
          enumNames
        );
        const barrelPath = resolveFromRoot(endpoint.outputDir, 'index.ts');
        const writer = new FileWriter();
        const changed = writer.writeSingle(barrelPath, barrelContent, false);
        if (changed) {
          logger.fileUpdated(path.relative(process.cwd(), barrelPath));
        }

        manifest.save();
      }

      logger.blank();
      if (options.dryRun) {
        logger.success(`Dry-run: ${deletedCount} file(s) would be deleted from ${endpoint.name}.`);
      } else {
        logger.success(`Deleted ${deletedCount} file(s) from ${endpoint.name}. Manifest saved.`);
      }
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
