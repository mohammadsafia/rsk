/**
 * pnpm arguments for the starter. Locally the store is warm, so working offline is fast and proves nothing is
 * fetched; CI starts with an empty store.
 */
const isCI = (env: NodeJS.ProcessEnv) => Boolean(env.CI) && env.CI !== 'false' && env.CI !== '0';

/** Rewrites the starter's lockfile to match its package.json, which drops the docs-only dependencies. */
export function lockfileArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  return isCI(env) ? ['install', '--lockfile-only'] : ['install', '--lockfile-only', '--offline'];
}

/** Installs from the refreshed lockfile, frozen, the way an app's own CI will. */
export function installArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  return isCI(env) ? ['install', '--frozen-lockfile'] : ['install', '--offline', '--frozen-lockfile'];
}
