/**
 * How long a test waits for an element (findBy…, waitFor) and how long a test may run. The wait covers a lazily
 * loaded page on a busy CI runner; the limit stays at least three times the wait, so a lookup that never succeeds
 * fails with its own message instead of the test being cut off. vite.config.ts and setup.ts read these.
 */
export const WAIT_TIMEOUT_MS = 5_000;
export const TEST_TIMEOUT_MS = 15_000;
