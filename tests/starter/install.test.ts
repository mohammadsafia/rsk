import { describe, expect, it } from 'vite-plus/test';

import { installArgs, lockfileArgs } from '../../scripts/starter/install';

describe('installArgs', () => {
  it('installs offline from the local pnpm store outside CI', () => {
    expect(installArgs({})).toEqual(['install', '--offline', '--frozen-lockfile']);
  });

  it('installs online in CI', () => {
    expect(installArgs({ CI: 'true' })).toEqual(['install', '--frozen-lockfile']);
    expect(installArgs({ CI: '1' })).toEqual(['install', '--frozen-lockfile']);
  });

  it('treats CI=false, CI=0 and an empty CI as local', () => {
    for (const CI of ['false', '0', '']) expect(installArgs({ CI })).toContain('--offline');
  });
});

describe('lockfileArgs', () => {
  it('rewrites only the lockfile, offline outside CI', () => {
    expect(lockfileArgs({})).toEqual(['install', '--lockfile-only', '--offline']);
    expect(lockfileArgs({ CI: 'true' })).toEqual(['install', '--lockfile-only']);
  });
});
