// The server's settings, read when a request needs them (never at import, so `next build` runs without them).
import 'server-only';

import { z } from 'zod';

/** An unset or empty variable is absent (`.env.example` lists keys with empty values). */
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const schema = z.object({
  NODE_ENV: optional(z.enum(['development', 'production', 'test'])),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters (openssl rand -hex 32)'),
  SESSION_SECRET_PREVIOUS: optional(z.string().min(32)),
  API_URL: optional(z.url()),
  AUTH_MOCK: optional(z.enum(['true', 'false'])),
});

export type ServerEnv = {
  SESSION_SECRET: string;
  SESSION_SECRET_PREVIOUS?: string;
  API_URL: string;
  AUTH_MOCK: 'true' | 'false';
};

let warned = false;

/** Validates the server's environment; throws naming each bad or missing key. */
export function parseServerEnv(env: Record<string, string | undefined>): ServerEnv {
  const result = schema.safeParse(env);
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid server environment: ${keys.join(', ')}. See .env.example.`);
  }
  const { NODE_ENV, SESSION_SECRET, SESSION_SECRET_PREVIOUS, API_URL, AUTH_MOCK } = result.data;
  const production = NODE_ENV === 'production';
  // The demo account is public: in production it is off unless asked for.
  const mock = AUTH_MOCK ?? (production ? 'false' : 'true');
  if (production && mock === 'true' && !warned) {
    warned = true;
    console.warn('AUTH_MOCK is on in production: anyone can sign in with the demo account.');
  }
  return { SESSION_SECRET, SESSION_SECRET_PREVIOUS, API_URL: API_URL ?? 'http://localhost:4000', AUTH_MOCK: mock };
}

let cached: ServerEnv | undefined;

/** The validated environment, parsed on first use in a request. */
export const getServerEnv = (): ServerEnv => (cached ??= parseServerEnv(process.env));
