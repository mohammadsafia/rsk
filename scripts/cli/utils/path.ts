/**
 * Path utilities for the CLI tool.
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root of the scripts/cli directory. */
export const CLI_ROOT = path.resolve(__dirname, '..');

/** Root of the project (where package.json lives). */
export function getProjectRoot(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

/** Resolve a path relative to the project root. */
export function resolveFromRoot(...segments: string[]): string {
  return path.join(getProjectRoot(), ...segments);
}

/** Get the templates directory path. */
export function getTemplatesDir(): string {
  return path.join(CLI_ROOT, 'templates');
}

/** Ensure a directory exists, creating it recursively if needed. */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
