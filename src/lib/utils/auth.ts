/**
 * Where to go after signing in: `next` when it is a path inside this app, else `fallback`. A `next` that could leave
 * the app ("//host", "https://…", "/\host") is refused, so a crafted link can't send someone elsewhere.
 */
export function safeNext(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}

/** A message to show for a failed request: the API's `message`, an Error's, a plain string; else `fallback`. */
export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error) return error;
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : fallback;
}
