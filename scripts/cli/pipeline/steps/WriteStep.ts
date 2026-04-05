import fs from 'node:fs';
import path from 'node:path';
import type { PipelineStep } from '../Pipeline.js';
import { FileWriter } from '../../core/FileWriter.js';
import { ManifestManager } from '../../core/ManifestManager.js';
import { resolveFromRoot } from '../../utils/path.js';
import { logger } from '../../utils/logger.js';

export function createWriteStep(): PipelineStep {
  return {
    name: 'Write',
    beforeHook: 'beforeWrite',
    afterHook: 'afterWrite',
    async execute(ctx) {
      const writer = new FileWriter();
      const dryRun = ctx.config.dryRun;

      const spinner = logger.spinner(
        dryRun
          ? 'Dry-run: previewing changes...'
          : `Writing ${ctx.generatedFiles.length} file(s) to disk...`
      );
      spinner.stop();

      const results = writer.write(ctx.generatedFiles, dryRun);
      ctx.generatedFiles = results;

      const created = results.filter((f) => f.created).length;
      const changed = results.filter((f) => f.changed && !f.created).length;
      const unchanged = results.filter((f) => !f.changed).length;

      ctx.stats.filesCreated = created;
      ctx.stats.filesChanged = changed;
      ctx.stats.filesUnchanged = unchanged;

      const allSchemaNames = new Set<string>();
      for (const key of ctx.schemas.keys()) {
        const name = key.includes('::') ? key.split('::')[1] : key;
        allSchemaNames.add(name);
      }

      let deletedCount = 0;
      let skippedModified = 0;
      let skippedUntracked = 0;

      for (const endpoint of ctx.config.endpoints) {
        const outputDir = resolveFromRoot(endpoint.outputDir);
        const modelsDir = resolveFromRoot(endpoint.outputDir, 'models');
        if (!fs.existsSync(modelsDir)) continue;

        const manifest = new ManifestManager(outputDir);

        for (const file of results) {
          const filename = path.basename(file.path);
          if (file.path.startsWith(modelsDir) && filename.endsWith('.ts')) {
            manifest.set(filename, file.content);
          }
        }

        for (const file of fs.readdirSync(modelsDir)) {
          if (!file.endsWith('.ts')) continue;
          const name = file.replace(/\.ts$/, '');
          if (allSchemaNames.has(name)) continue;

          const filePath = path.join(modelsDir, file);
          const relativePath = path.relative(process.cwd(), filePath);

          if (!manifest.has(file)) {
            logger.fileSkippedUntracked(relativePath);
            skippedUntracked++;
          } else if (!manifest.hashMatches(file, filePath)) {
            logger.fileSkippedModified(relativePath);
            skippedModified++;
          } else {
            if (!dryRun) {
              fs.unlinkSync(filePath);
            }
            logger.fileDeleted(dryRun ? `${relativePath} (dry-run)` : relativePath);
            manifest.remove(file);
            deletedCount++;
          }
        }

        if (!dryRun) {
          manifest.save();
        }
      }

      ctx.stats.filesDeleted = deletedCount;
      ctx.stats.filesSkippedModified = skippedModified;
      ctx.stats.filesSkippedUntracked = skippedUntracked;

      if (dryRun) {
        logger.success(
          `Dry-run complete: ${created} would be created, ${changed} would change, ${unchanged} unchanged.`
        );
      } else {
        logger.success(
          `Created ${created}, updated ${changed}, ${unchanged} unchanged.`
        );
      }
    },
  };
}
