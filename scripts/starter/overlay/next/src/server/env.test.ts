// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { parseServerEnv } from './env';

const SECRET = 'a'.repeat(32);

describe('server environment', () => {
  it('requires SESSION_SECRET, at least 32 characters, with no default', () => {
    expect(() => parseServerEnv({})).toThrow(/SESSION_SECRET/);
    expect(() => parseServerEnv({ SESSION_SECRET: '' })).toThrow(/SESSION_SECRET/);
    expect(() => parseServerEnv({ SESSION_SECRET: 'x'.repeat(31) })).toThrow(/SESSION_SECRET/);
    expect(parseServerEnv({ SESSION_SECRET: SECRET }).SESSION_SECRET).toBe(SECRET);
  });

  it('turns the demo account off in production unless asked for, and on in development', () => {
    expect(parseServerEnv({ SESSION_SECRET: SECRET, NODE_ENV: 'production' }).AUTH_MOCK).toBe('false');
    expect(parseServerEnv({ SESSION_SECRET: SECRET, NODE_ENV: 'development' }).AUTH_MOCK).toBe('true');
    expect(parseServerEnv({ SESSION_SECRET: SECRET, NODE_ENV: 'production', AUTH_MOCK: '' }).AUTH_MOCK).toBe('false');
    expect(parseServerEnv({ SESSION_SECRET: SECRET, AUTH_MOCK: 'false' }).AUTH_MOCK).toBe('false');
  });

  it('reads nothing at import (next build runs without the secret), and ships no secret of its own', async () => {
    const before = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    await expect(import('./env')).resolves.toBeDefined();
    process.env.SESSION_SECRET = before;
    const source = readFileSync(path.join(import.meta.dirname, 'env.ts'), 'utf8');
    expect(source.match(/(['"`])[^'"`\n]{32,}\1/g)?.filter((literal) => !literal.includes(' ')) ?? []).toEqual([]);
  });
});
