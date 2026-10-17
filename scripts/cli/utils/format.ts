/**
 * Oxfmt formatting helper — formats generated code using the `fmt` block
 * from the project's vite.config.ts (single source of truth for style).
 */

import { loadConfigFromFile } from 'vite-plus';
import { format, type FormatConfig } from 'vite-plus/fmt';
import { resolveFromRoot } from './path.js';

let fmtOptionsPromise: Promise<FormatConfig> | undefined;

function loadFmtOptions(): Promise<FormatConfig> {
  fmtOptionsPromise ??= loadConfigFromFile({ command: 'build', mode: 'production' }, resolveFromRoot('vite.config.ts')).then((loaded) => {
    const { ignorePatterns: _ignored, ...options } = (loaded?.config as { fmt?: FormatConfig & { ignorePatterns?: string[] } })?.fmt ?? {};
    return options;
  });
  return fmtOptionsPromise;
}

export async function formatTs(filePath: string, content: string): Promise<string> {
  const result = await format(filePath, content, await loadFmtOptions());
  if (result.errors.length > 0) {
    throw new Error(result.errors.map((e) => e.message).join('\n'));
  }
  return result.code;
}
