/**
 * GenerateStep — Runs code generators to produce TypeScript file contents.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { PipelineStep } from '../Pipeline.js';
import type { GeneratedFile, IRSchema } from '../../types/index.js';
import { CodeGenerator } from '../../core/CodeGenerator.js';
import { BarrelGenerator } from '../../core/BarrelGenerator.js';
import { GeneratorRegistry } from '../../generators/GeneratorRegistry.js';
import { computeContentHash } from '../../utils/hash.js';
import { resolveFromRoot } from '../../utils/path.js';
import { logger } from '../../utils/logger.js';

export function createGenerateStep(): PipelineStep {
  return {
    name: 'Generate',
    beforeHook: 'beforeGenerate',
    afterHook: 'afterGenerate',
    async execute(ctx) {
      const registry = GeneratorRegistry.createDefault();
      const codeGen = new CodeGenerator(registry);
      const barrelGen = new BarrelGenerator();

      const spinner = logger.spinner(
        `Generating code for ${ctx.selectedSchemas.length} schema(s)...`
      );

      try {
        // Group selected schemas by endpoint
        const byEndpoint = new Map<string, IRSchema[]>();

        for (const key of ctx.selectedSchemas) {
          const [endpointName, _schemaName] = key.split('::');
          const schema = ctx.schemas.get(key);
          if (!schema) continue;

          const list = byEndpoint.get(endpointName) ?? [];
          list.push(schema);
          byEndpoint.set(endpointName, list);
        }

        const generatedFiles: GeneratedFile[] = [];

        for (const [endpointName, schemas] of byEndpoint.entries()) {
          const endpoint = ctx.config.endpoints.find(
            (e) => e.name === endpointName
          );
          if (!endpoint) continue;

          const modelsDir = resolveFromRoot(endpoint.outputDir, 'models');

          // Generate individual schema files
          for (const schema of schemas) {
            const result = codeGen.generate(schema, {
              enumStrategy: ctx.config.enumStrategy,
            });

            const filePath = path.join(modelsDir, result.filename);

            generatedFiles.push({
              path: filePath,
              filename: result.filename,
              content: result.content,
              hash: computeContentHash(result.content),
              changed: false,
            });
          }

          // Generate barrel index.ts — merge generated schemas with existing disk files
          const generatedNames = new Set(schemas.map((s) => s.name));
          const enumNames = new Set(
            schemas.filter((s) => s.kind === 'enum').map((s) => s.name)
          );

          // Discover existing model files on disk not covered by this generation
          if (fs.existsSync(modelsDir)) {
            for (const file of fs.readdirSync(modelsDir)) {
              if (!file.endsWith('.ts')) continue;
              const name = file.replace(/\.ts$/, '');
              if (!generatedNames.has(name)) {
                generatedNames.add(name);
              }
            }
          }

          const barrelContent = barrelGen.generateFromFilenames(
            [...generatedNames],
            ctx.config.enumStrategy,
            enumNames
          );
          const barrelPath = resolveFromRoot(endpoint.outputDir, 'index.ts');

          generatedFiles.push({
            path: barrelPath,
            filename: 'index.ts',
            content: barrelContent,
            hash: computeContentHash(barrelContent),
            changed: false,
          });
        }

        ctx.generatedFiles = generatedFiles;
        ctx.stats.filesGenerated = generatedFiles.length;

        spinner.succeed(
          `Generated ${generatedFiles.length} file(s) across ${byEndpoint.size} endpoint(s).`
        );
      } catch (error) {
        spinner.fail('Code generation failed.');
        throw error;
      }
    },
  };
}
