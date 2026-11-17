// The wait for an element (findBy…, waitFor) is realistic for a lazily loaded page on a busy CI runner, and well under
// the limit of the test that waits: a lookup that times out then fails with its own message instead of the test
// being cut off. A project's page tests failed after merge on the 1 s default wait, and later at the 5 s test limit.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { getConfig } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { TEST_TIMEOUT_MS, WAIT_TIMEOUT_MS } from './timeouts';

describe('test timeouts', () => {
  it('every test file waits WAIT_TIMEOUT_MS for an element', () => {
    expect(getConfig().asyncUtilTimeout).toBe(WAIT_TIMEOUT_MS);
  });

  it('the wait is at most a third of the test limit, and the limit is the one the config sets', () => {
    expect(WAIT_TIMEOUT_MS).toBeGreaterThanOrEqual(3000);
    expect(WAIT_TIMEOUT_MS * 3).toBeLessThanOrEqual(TEST_TIMEOUT_MS);
    const config = readFileSync(path.resolve(import.meta.dirname, '../../vite.config.ts'), 'utf8');
    expect(config).toContain('testTimeout: TEST_TIMEOUT_MS,');
    expect(config).toContain("setupFiles: ['./src/test-utils/setup.ts'],");
  });
});
