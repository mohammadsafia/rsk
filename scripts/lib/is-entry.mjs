// scripts/lib/is-entry.mjs
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Whether this module is the script Node was asked to run. Node resolves symlinks in import.meta.url but not in argv,
 * so both sides are compared as real paths: a checkout reached through a symlink (/tmp on macOS, a linked workspace)
 * still runs instead of silently doing nothing.
 */
export function isEntry(metaUrl, argvPath) {
  if (!argvPath) return false;
  try {
    return fileURLToPath(metaUrl) === realpathSync(argvPath);
  } catch {
    return false;
  }
}
