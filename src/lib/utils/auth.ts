/**
 * Where to go after signing in: `next` when it is a path inside this app, else `fallback`. A `next` that could leave
 * the app ("//host", "https://…", "/\host") is refused, so a crafted link can't send someone elsewhere.
 */
export function safeNext(next: string | null | undefined, fallback = '/'): string {
  // Control characters: a URL parser drops tabs and newlines, so "/\t/host" would become "//host".
  // oxlint-disable-next-line no-control-regex -- matching control characters is the point
  if (!next || !next.startsWith('/') || /[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  const base = 'https://app.invalid';
  const url = new URL(next, base);
  return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
}

/** A message to show for a failed request: the API's `message`, an Error's, a plain string; else `fallback`. */
export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error) return error;
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : fallback;
}
