// scripts/lib/kit-target.mjs
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const NEXT_CONFIGS = ['next.config.ts', 'next.config.mjs', 'next.config.js'];

/**
 * Which starter an app (or this repository) was made from: kit.lock.json's target, else a next.config file, else Vite.
 * The kit's gates and scripts read it to check the app's own config.
 *
 * @param {string} [root]
 * @returns {'vite' | 'next'}
 */
export function kitTarget(root = process.cwd()) {
  const lockFile = path.join(root, 'kit.lock.json');
  if (existsSync(lockFile)) {
    const { target } = JSON.parse(readFileSync(lockFile, 'utf8'));
    if (target === 'vite' || target === 'next') return target;
  }
  return NEXT_CONFIGS.some((file) => existsSync(path.join(root, file))) ? 'next' : 'vite';
}
