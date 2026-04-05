/**
 * Init command — Creates a .dto-gen.json config file with defaults.
 */

import fs from 'node:fs';
import path from 'node:path';
import { select } from '@inquirer/prompts';
import { DEFAULT_CONFIG, CONFIG_FILENAME } from '../config/defaults.js';
import { saveConfig, getProjectRoot } from '../config/loader.js';
import { logger } from '../utils/logger.js';

type InitCommandOptions = {
  force?: boolean;
};

export async function initCommand(options: InitCommandOptions): Promise<void> {
  try {
    const projectRoot = getProjectRoot();
    const configPath = path.join(projectRoot, CONFIG_FILENAME);

    if (fs.existsSync(configPath) && !options.force) {
      const action = await select({
        message: `Config file ${CONFIG_FILENAME} already exists. What would you like to do?`,
        choices: [
          { name: 'Keep existing', value: 'keep' },
          { name: 'Overwrite with defaults', value: 'overwrite' },
        ],
      });

      if (action === 'keep') {
        logger.info('Keeping existing config file.');
        return;
      }
    }

    saveConfig(DEFAULT_CONFIG, configPath);
    logger.success(`Created ${CONFIG_FILENAME} with default configuration.`);
    logger.dim('Edit this file to customize endpoints, enum strategy, and selected schemas.');
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
