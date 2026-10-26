import type { NextConfig } from 'next';

/** Sent with every response: no framing (clickjacking), no MIME sniffing, and only the origin in cross-site referrers. */
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

/**
 * The site's own host. Next refuses a server action whose Origin isn't the Host (or X-Forwarded-Host) it was sent
 * to, so behind a proxy that rewrites Host without X-Forwarded-Host (nginx by default) every action would fail; the
 * site's public URL counts too, as it does for sign-in (app/api/auth/same-origin.ts).
 */
const siteHost = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').host;

const config: NextConfig = {
  // The kit is written for the React Compiler (see vite.config.ts's lint rules).
  reactCompiler: true,
  poweredByHeader: false,
  // The root layout sits under [lang], so a URL no route matches gets app/global-not-found.tsx (a full page in the
  // visitor's language) instead of Next's own 404 outside the app.
  experimental: { globalNotFound: true, serverActions: { allowedOrigins: [siteHost] } },
  // The app's settings (paths, strictness) live in tsconfig.app.json; next build reads them from there.
  typescript: { tsconfigPath: 'tsconfig.app.json' },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default config;
