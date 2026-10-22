// The upgrade fixture starts from the kit apps were published with, never from HEAD's own history: on main (CI's
// starter-sync, a shallow clone) the merge-base with main is HEAD itself, and the fixture would test nothing.
import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vite-plus/test';

import { UPGRADE_FROM } from '../../scripts/starter/verify-upgrade';

const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8' }).trim();

describe('upgrade fixture baseline', () => {
  it('is a pinned, published kit commit, older than HEAD', () => {
    expect(UPGRADE_FROM).toMatch(/^[0-9a-f]{40}$/);
    expect(UPGRADE_FROM).not.toBe(git('rev-parse', 'HEAD'));
    expect(() => git('merge-base', '--is-ancestor', UPGRADE_FROM, 'HEAD')).not.toThrow();
  });
});
