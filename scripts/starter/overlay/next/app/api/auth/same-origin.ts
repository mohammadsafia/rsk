// The auth endpoints take JSON from this app's own pages only: a cross-site form (login CSRF) or fetch is refused.
export function sameOrigin(request: Request): boolean {
  if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) return false;
  const origin = request.headers.get('origin');
  if (origin) return origin === new URL(request.url).origin;
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

/** The value of one cookie the request carries. */
export const requestCookie = (request: Request, name: string): string | undefined =>
  request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((pair) => pair.startsWith(`${name}=`))
    ?.slice(name.length + 1);
