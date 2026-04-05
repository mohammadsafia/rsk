/**
 * FileWriter — Writes generated files to disk with hash-based change detection.
 * Only writes files that have actually changed to minimize noise.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { GeneratedFile } from '../types/index.js';
import { computeContentHash } from '../utils/hash.js';
import { ensureDir } from '../utils/path.js';
import { logger } from '../utils/logger.js';

export class FileWriter {
  /**
   * Write a batch of generated files to disk.
   * Returns updated GeneratedFile records with `changed` flag set.
   */
  write(files: GeneratedFile[], dryRun = false): GeneratedFile[] {
    const results: GeneratedFile[] = [];

    for (const file of files) {
      const existsOnDisk = fs.existsSync(file.path);
      const changed = this.hasChanged(file.path, file.content);
      const created = changed && !existsOnDisk;
      const result: GeneratedFile = { ...file, changed, created };

      if (changed && !dryRun) {
        ensureDir(path.dirname(file.path));
        fs.writeFileSync(file.path, file.content, 'utf-8');
      }

      const relativePath = this.getRelativePath(file.path);

      if (dryRun) {
        if (created) {
          logger.fileCreated(`${relativePath} (dry-run, would create)`);
        } else if (changed) {
          logger.fileUpdated(`${relativePath} (dry-run, would change)`);
        } else {
          logger.fileUnchanged(relativePath);
        }
      } else if (created) {
        logger.fileCreated(relativePath);
      } else if (changed) {
        logger.fileUpdated(relativePath);
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Write a single file to disk.
   */
  writeSingle(filePath: string, content: string, dryRun = false): boolean {
    const changed = this.hasChanged(filePath, content);

    if (changed && !dryRun) {
      ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    return changed;
  }

  /**
   * Check if file content has changed compared to what's on disk.
   */
  private hasChanged(filePath: string, newContent: string): boolean {
    if (!fs.existsSync(filePath)) {
      return true;
    }

    const existingContent = fs.readFileSync(filePath, 'utf-8');
    const existingHash = computeContentHash(existingContent);
    const newHash = computeContentHash(newContent);

    return existingHash !== newHash;
  }

  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }
}
