/**
 * pnpm install arguments for the starter. Locally the store is warm, so installing offline is fast and proves nothing
 * is fetched; CI starts with an empty store. The lockfile is never frozen: the starter's package.json drops the
 * docs-only dependencies, so the copied lockfile no longer matches it exactly.
 */
export function installArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  const ci = Boolean(env.CI) && env.CI !== 'false' && env.CI !== '0';
  return ci ? ['install', '--no-frozen-lockfile'] : ['install', '--offline', '--no-frozen-lockfile'];
}
