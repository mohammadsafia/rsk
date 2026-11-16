// The dev server's settings from the environment (vite.config.ts `server`), so several copies of an app can run at
// once (parallel work, a QA run beside a developer's) without anyone editing the config:
//
//   DEV_PORT=5101 DEV_API_TARGET=http://localhost:5097 pnpm dev
//
//   DEV_PORT        the port (default 3000). Set, it is strict: a taken port stops the server instead of moving it
//                   to the next free one, where it could answer for another copy.
//   DEV_API_TARGET  proxy API calls to this origin (default: no proxy). The app then calls its API on its own origin.
//   DEV_API_PATH    the path that goes to DEV_API_TARGET (default /api).
//   DEV_OPEN=false  don't open a browser tab (headless or scripted runs).

type Env = Record<string, string | undefined>;
type Proxy = Record<string, { target: string; changeOrigin: boolean }>;
export type DevServer = { port: number; open: boolean; strictPort?: boolean; proxy?: Proxy };

const DEFAULT_PORT = 3000;

export function devServer(env: Env = process.env): DevServer {
  const server: DevServer = { port: DEFAULT_PORT, open: env.DEV_OPEN !== 'false' };
  if (env.DEV_PORT) {
    const port = Number(env.DEV_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65_535)
      throw new Error(`DEV_PORT must be a port number (1–65535), not "${env.DEV_PORT}".`);
    server.port = port;
    server.strictPort = true;
  }
  if (env.DEV_API_TARGET) {
    if (!/^https?:\/\/[^/\s]+/.test(env.DEV_API_TARGET))
      throw new Error(`DEV_API_TARGET must be an origin such as http://localhost:5080, not "${env.DEV_API_TARGET}".`);
    server.proxy = { [env.DEV_API_PATH || '/api']: { target: env.DEV_API_TARGET, changeOrigin: true } };
  }
  return server;
}
