import type { NextConfig } from 'next';

/** Sent with every response: no framing (clickjacking), no MIME sniffing, and only the origin in cross-site referrers. */
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const config: NextConfig = {
  // The kit is written for the React Compiler (see vite.config.ts's lint rules).
  reactCompiler: true,
  poweredByHeader: false,
  // The root layout sits under [lang], so a URL no route matches gets app/global-not-found.tsx (a full page in the
  // visitor's language) instead of Next's own 404 outside the app.
  experimental: { globalNotFound: true },
  // The app's settings (paths, strictness) live in tsconfig.app.json; next build reads them from there.
  typescript: { tsconfigPath: 'tsconfig.app.json' },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default config;
