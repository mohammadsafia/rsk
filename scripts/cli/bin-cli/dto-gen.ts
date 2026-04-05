#!/usr/bin/env npx tsx

/**
 * dto-gen — Advanced TypeScript DTO generator from OpenAPI/Swagger specs.
 *
 * Usage:
 *   npx tsx scripts/cli/bin/dto-gen.ts generate -i     # Interactive mode
 *   npx tsx scripts/cli/bin/dto-gen.ts generate -v v2   # Generate all for v2
 *   npx tsx scripts/cli/bin/dto-gen.ts list              # List schemas
 *   npx tsx scripts/cli/bin/dto-gen.ts init              # Create config
 */

import { Command } from 'commander';
import { generateCommand } from '../commands/generate.js';
import { listCommand } from '../commands/list.js';
import { initCommand } from '../commands/init.js';
import { cleanCommand } from '../commands/clean.js';

const program = new Command();

program
  .name('dto-gen')
  .description(
    'Advanced TypeScript DTO generator from OpenAPI/Swagger specs'
  )
  .version('1.0.0');

program
  .command('generate')
  .alias('g')
  .description('Generate DTOs from swagger specs')
  .option('-i, --interactive', 'Run in interactive mode', false)
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --version <version>', 'API version to generate (v1, v2, all)', 'all')
  .option('-s, --schemas <schemas>', 'Comma-separated list of schema names')
  .option('-e, --enum-strategy <strategy>', 'Enum strategy (type-literal, enum)')
  .option('--diff', 'Show diff between BE schemas and local files', false)
  .option('--dry-run', 'Preview changes without writing', false)
  .action(generateCommand);

program
  .command('list')
  .alias('ls')
  .description('List available schemas from swagger')
  .option(
    '-v, --version <version>',
    'API version (v1, v2, all)',
    'all'
  )
  .option('--json', 'Output as JSON', false)
  .option('--diff', 'Show diff between BE schemas and local files', false)
  .action(listCommand);

program
  .command('init')
  .description('Initialize .dto-gen.json config file')
  .option('-f, --force', 'Overwrite existing config', false)
  .action(initCommand);

program
  .command('clean')
  .description('Delete local model files not in BE swagger and create manifest')
  .option('-v, --version <version>', 'API version (v1, v2, all)', 'all')
  .option('--dry-run', 'Preview deletions without modifying files', false)
  .action(cleanCommand);

program.parse();
