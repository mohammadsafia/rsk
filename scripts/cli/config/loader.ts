/**
 * Configuration loader — reads .dto-gen.json or falls back to defaults.
 */

import fs from 'node:fs';
import path from 'node:path';
import { DtoGenConfigSchema } from './schema.js';
import { DEFAULT_CONFIG, CONFIG_FILENAME } from './defaults.js';
import type { DtoGenConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';

export function loadConfig(configPath?: string): DtoGenConfig {
  const projectRoot = findProjectRoot();
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.join(projectRoot, CONFIG_FILENAME);

  if (!fs.existsSync(resolvedPath)) {
    logger.dim(`No config file found at ${resolvedPath}, using defaults.`);
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = DtoGenConfigSchema.parse(parsed);
    logger.success(`Loaded config from ${path.relative(projectRoot, resolvedPath)}`);
    return validated;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.error(`Invalid JSON in config file: ${resolvedPath}`);
    } else {
      logger.error(`Config validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    logger.dim('Falling back to default config.');
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: DtoGenConfig, configPath?: string): void {
  const projectRoot = findProjectRoot();
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.join(projectRoot, CONFIG_FILENAME);

  const { dryRun, ...configToSave } = config;
  fs.writeFileSync(resolvedPath, JSON.stringify(configToSave, null, 2) + '\n', 'utf-8');
  logger.success(`Config saved to ${path.relative(projectRoot, resolvedPath)}`);
}

function findProjectRoot(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

export function getProjectRoot(): string {
  return findProjectRoot();
}
