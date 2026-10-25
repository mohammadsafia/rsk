import { clientEnv } from '@env';

// The auth endpoints take JSON from this app's own pages only: a cross-site form (login CSRF) or fetch is refused.
export function sameOrigin(request: Request): boolean {
  if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) return false;
  const origin = request.headers.get('origin');
  // The site's own URL counts too, for proxies that rewrite Host and send no X-Forwarded-Host (nginx by default).
  if (origin) return hostOf(origin) === addressedHost(request) || origin === new URL(clientEnv.NEXT_PUBLIC_SITE_URL).origin;
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

const hostOf = (origin: string): string | null => {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
};

/** The host the browser sent the request to: a proxy's forwarded host, else Host (Next rewrites request.url's). */
const addressedHost = (request: Request): string =>
  request.headers.get('x-forwarded-host')?.split(',')[0].trim() || request.headers.get('host') || new URL(request.url).host;

/** The value of one cookie the request carries. */
export const requestCookie = (request: Request, name: string): string | undefined =>
  request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((pair) => pair.startsWith(`${name}=`))
    ?.slice(name.length + 1);
