// Downloads the RSK starter from GitHub for kit:status, kit:update and kit:add.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_REPO = 'mohammadsafia/rsk-starter';

/** The repository to update from: the app's kit.lock.json, then RSK_STARTER_REPO, then the Vite starter (older locks). */
export function starterRepo(appDir = process.cwd()): string {
  const lockFile = path.join(appDir, 'kit.lock.json');
  const fromLock = existsSync(lockFile) ? (JSON.parse(readFileSync(lockFile, 'utf8')) as { starter?: string }).starter : undefined;
  return fromLock ?? process.env.RSK_STARTER_REPO ?? DEFAULT_REPO;
}

/** Downloads a ref of the starter repository and unpacks it; null when the ref doesn't exist. */
export async function download(ref: string, repo = starterRepo()): Promise<string | null> {
  const response = await fetch(`https://codeload.github.com/${repo}/tar.gz/${ref}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Downloading ${repo}@${ref} failed: HTTP ${response.status}`);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'rsk-kit-'));
  try {
    writeFileSync(path.join(dir, 'starter.tar.gz'), Buffer.from(await response.arrayBuffer()));
    // A relative archive path: some Windows tars read "C:\…" as a remote host.
    const unpack = spawnSync('tar', ['-xzf', 'starter.tar.gz', '--strip-components=1'], { cwd: dir, encoding: 'utf8' });
    if (unpack.status !== 0) throw new Error(`Unpacking ${repo}@${ref} failed: ${unpack.stderr || unpack.error?.message}`);
    rmSync(path.join(dir, 'starter.tar.gz'));
    return dir;
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}
