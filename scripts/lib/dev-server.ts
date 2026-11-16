// The dev server's settings from the environment (vite.config.ts `server`), so several copies of an app can run at
// once (parallel work, a QA run beside a developer's) without anyone editing the config:
//
//   FRONTEND_PORT=5101 API_PROXY_TARGET=http://localhost:5097 pnpm dev
//
//   FRONTEND_PORT     the port (default 3000). Set, it is strict: a taken port stops the server instead of moving
//                     it to the next free one, where it could answer for another copy.
//   API_PROXY_TARGET  proxy API calls to this origin (default: no proxy). The app then calls its API on its own
//                     origin.
//   API_PROXY_PATH    the path that goes to API_PROXY_TARGET (default /api).
//   FRONTEND_OPEN     false: don't open a browser tab (headless or scripted runs).
//
// None is VITE_-prefixed, so none reaches the browser bundle.

type Env = Record<string, string | undefined>;
type Proxy = Record<string, { target: string; changeOrigin: boolean }>;
export type DevServer = { port: number; open: boolean; strictPort?: boolean; proxy?: Proxy };

const DEFAULT_PORT = 3000;

export function devServer(env: Env = process.env): DevServer {
  const server: DevServer = { port: DEFAULT_PORT, open: env.FRONTEND_OPEN !== 'false' };
  if (env.FRONTEND_PORT) {
    const port = Number(env.FRONTEND_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65_535)
      throw new Error(`FRONTEND_PORT must be a port number (1–65535), not "${env.FRONTEND_PORT}".`);
    server.port = port;
    server.strictPort = true;
  }
  if (env.API_PROXY_TARGET) {
    if (!/^https?:\/\/[^/\s]+/.test(env.API_PROXY_TARGET))
      throw new Error(`API_PROXY_TARGET must be an origin such as http://localhost:5080, not "${env.API_PROXY_TARGET}".`);
    server.proxy = { [env.API_PROXY_PATH || '/api']: { target: env.API_PROXY_TARGET, changeOrigin: true } };
  }
  return server;
}
