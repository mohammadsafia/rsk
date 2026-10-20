// Downloads the RSK starter from GitHub for kit:status, kit:update and kit:add.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const REPO = process.env.RSK_STARTER_REPO ?? 'mohammadsafia/rsk-starter';

/** Downloads a ref of the starter repository and unpacks it; null when the ref doesn't exist. */
export async function download(ref: string): Promise<string | null> {
  const response = await fetch(`https://codeload.github.com/${REPO}/tar.gz/${ref}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Downloading ${REPO}@${ref} failed: HTTP ${response.status}`);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'rsk-kit-'));
  try {
    writeFileSync(path.join(dir, 'starter.tar.gz'), Buffer.from(await response.arrayBuffer()));
    // A relative archive path: some Windows tars read "C:\…" as a remote host.
    const unpack = spawnSync('tar', ['-xzf', 'starter.tar.gz', '--strip-components=1'], { cwd: dir, encoding: 'utf8' });
    if (unpack.status !== 0) throw new Error(`Unpacking ${REPO}@${ref} failed: ${unpack.stderr || unpack.error?.message}`);
    rmSync(path.join(dir, 'starter.tar.gz'));
    return dir;
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}
