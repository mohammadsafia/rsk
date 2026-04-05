import chalk from 'chalk';
import type { ListCommandOptions } from '../types/index.js';
import { loadConfig } from '../config/loader.js';
import { SwaggerFetcher } from '../core/SwaggerFetcher.js';
import { SchemaParser } from '../core/SchemaParser.js';
import { logger } from '../utils/logger.js';
import { computeSchemaDiffs } from '../utils/diff.js';

export async function listCommand(options: ListCommandOptions): Promise<void> {
  try {
    const config = loadConfig();
    const fetcher = new SwaggerFetcher();
    const parser = new SchemaParser();

    let endpoints = config.endpoints;
    if (options.version && options.version !== 'all') {
      endpoints = endpoints.filter((ep) => ep.name === options.version);
    }

    for (const endpoint of endpoints) {
      const spinner = logger.spinner(
        `Fetching schemas from ${endpoint.name}...`
      );

      const doc = await fetcher.fetch(endpoint.url);
      const schemas = parser.parse(doc);
      spinner.stop();

      if (options.diff) {
        await renderDiffMode(schemas, endpoint.outputDir, endpoint.name, config.enumStrategy);
        continue;
      }

      logger.heading(`${endpoint.name} (${schemas.size} schemas)`);

      const sorted = Array.from(schemas.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      );

      if (options.json) {
        const jsonOutput = sorted.map(([name, schema]) => ({
          name,
          kind: schema.kind,
          properties: schema.properties.length,
          enumValues: schema.enumValues?.length ?? 0,
        }));
        console.log(JSON.stringify(jsonOutput, null, 2));
        continue;
      }

      let enums = 0;
      let objects = 0;
      let aliases = 0;

      for (const [name, schema] of sorted) {
        const kindLabel =
          schema.kind === 'enum'
            ? chalk.yellow('[enum]  ')
            : schema.kind === 'alias'
              ? chalk.blue('[alias] ')
              : chalk.green('[dto]   ');

        const detail =
          schema.kind === 'enum'
            ? chalk.dim(` (${schema.enumValues?.length ?? 0} values)`)
            : schema.kind === 'object'
              ? chalk.dim(` (${schema.properties.length} props)`)
              : chalk.dim(` → ${schema.aliasType ?? 'unknown'}`);

        console.log(`  ${kindLabel} ${name}${detail}`);

        if (schema.kind === 'enum') enums++;
        else if (schema.kind === 'object') objects++;
        else aliases++;
      }

      logger.blank();
      logger.table([
        ['DTOs', objects],
        ['Enums', enums],
        ['Aliases', aliases],
        ['Total', schemas.size],
      ]);
    }
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

async function renderDiffMode(
  schemas: Map<string, import('../types/index.js').IRSchema>,
  outputDir: string,
  endpointName: string,
  enumStrategy: import('../types/index.js').EnumStrategy
): Promise<void> {
  const diffSpinner = logger.spinner('Computing diffs...');
  const diffs = await computeSchemaDiffs(schemas, outputDir, enumStrategy);
  diffSpinner.stop();

  const counts = { new: 0, updated: 0, unchanged: 0 };
  for (const d of diffs.values()) {
    if (d.status === 'new') counts.new++;
    else if (d.status === 'updated') counts.updated++;
    else if (d.status === 'unchanged') counts.unchanged++;
  }

  logger.heading(
    `${endpointName} — ${schemas.size} schemas (${chalk.green(`${counts.new} new`)}, ${chalk.yellow(`${counts.updated} updated`)}, ${chalk.cyan(`${counts.unchanged} unchanged`)})`
  );

  const allEntries: { name: string; schema: import('../types/index.js').IRSchema; diff: import('../types/index.js').SchemaDiffResult }[] = [];

  for (const [name, schema] of schemas.entries()) {
    const diff = diffs.get(name);
    if (diff) allEntries.push({ name, schema, diff });
  }

  allEntries.sort((a, b) => {
    const order = { new: 0, updated: 1, deleted: 2, unchanged: 3 };
    const statusDiff = order[a.diff.status] - order[b.diff.status];
    if (statusDiff !== 0) return statusDiff;
    return a.name.localeCompare(b.name);
  });

  for (const { name, schema, diff } of allEntries) {
    const kindLabel =
      schema.kind === 'enum'
        ? chalk.dim('[enum]  ')
        : schema.kind === 'alias'
          ? chalk.dim('[alias] ')
          : chalk.dim('[dto]   ');

    const detail =
      schema.kind === 'enum'
        ? chalk.dim(` (${schema.enumValues?.length ?? 0} values)`)
        : schema.kind === 'object'
          ? chalk.dim(` (${schema.properties.length} props)`)
          : chalk.dim(` → ${schema.aliasType ?? 'unknown'}`);

    const statusLabel =
      diff.status === 'new'
        ? chalk.green('  (new)')
        : diff.status === 'updated'
          ? chalk.yellow('  (updated)')
          : chalk.cyan('  (no diff)');

    console.log(`  ${kindLabel} ${name}${detail}${statusLabel}`);
  }

  const updatedSchemas = allEntries.filter((s) => s.diff.status === 'updated');
  for (const { name, diff } of updatedSchemas) {
    logger.diffFileHeader(`${name}.ts`);
    for (const line of diff.lines) {
      if (line.type === 'added') logger.diffAdded(line.content);
      else if (line.type === 'removed') logger.diffRemoved(line.content);
    }
  }

  logger.diffSummary({ ...counts, deleted: 0 });
}
